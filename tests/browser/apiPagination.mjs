import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const baseUrl = process.env.UI_BASE_URL || 'http://localhost:5174'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const failures = []
const historyPath = '/v1/app-nudger/nudges'
const fixture = (id, type = 'broadcast') => ({
  id: `${type}-${id}`, title: 'Fixture Studio', message: `Notification ${id}`, sender: 'creator', nudge_type: type,
  status: 'completed', created_at: '2026-10-07T08:00:00Z', completed_at: '2026-10-07T08:00:01Z',
  stats: { total_audience: 10, total_devices: 10, delivered_users: 9, muted_users: 1, failed_deliveries: 0 },
})

async function setup(width, theme, profileType, endpoint = null) {
  const context = await browser.newContext({ viewport: { width, height: 812 }, colorScheme: theme, reducedMotion: 'reduce' })
  await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-only-refresh'))
  const page = await context.newPage()
  page.on('pageerror', error => failures.push(error.message))
  if (endpoint) await page.route('**/runtime-config.js', route => route.fulfill({
    contentType: 'application/javascript', body: `window.__NUDGER_CONFIG__ = ${JSON.stringify({
      apiBaseUrl: endpoint, profileImageSourceMaxBytes: 10485760, profileImageFinalMaxBytes: 2097152,
      profileImageMaxDimension: 1600, profileImageWebpQuality: .82,
    })};`,
  }))
  const calls = [], controls = { failNextPage: true }
  await page.route('**/v1/**', async route => {
    const url = new URL(route.request().url()), path = url.pathname.replace(/^\/gateway/, '')
    const expectedOrigin = endpoint ? new URL(endpoint).origin : new URL(baseUrl).origin
    if (url.origin !== expectedOrigin || (endpoint && !url.pathname.startsWith('/gateway/')) || path.startsWith('/http')) {
      failures.push(`Incorrect API endpoint: ${url.href}`); await route.abort(); return
    }
    const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Fixture Studio', nudger_id: 'fixture-studio', profile_type: profileType, is_active: true, profile_image_url: '/nudge.png' }
    let body
    if (path.endsWith('/refresh')) body = { data: { auth: { access_token: 'fixture-access', refresh_token: 'fixture-only-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Fixture', email: 'fixture@example.test' }, merchant_profile: profile } }
    else if (route.request().method() !== 'GET') { failures.push('Unexpected mutation'); await route.abort(); return }
    else if (path === historyPath) {
      calls.push(url)
      const type = url.searchParams.get('nudge_type') || 'broadcast'
      if (url.searchParams.has('cursor')) {
        if (controls.failNextPage) {
          controls.failNextPage = false
          await route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Simulated proxy fallback</html>' }); return
        }
        body = { data: { items: [fixture(20, type), fixture(21, type)], next: null, page_size: 20 } }
      } else body = { data: {
        items: Array.from({ length: 20 }, (_, index) => fixture(index + 1, type)), page_size: 20,
        next: `http://internal-api:8000${historyPath}?page_size=20&nudge_type=${type}&cursor=abc%2B%2F%3D`,
      } }
    } else if (path.endsWith('/token')) body = { data: { has_token: true, token: 'fixture-api-key', token_prefix: 'fixture', created_at: null, rotated_at: null } }
    else if (path.endsWith('/profile')) body = { data: profile }
    else { failures.push(`Unexpected API path: ${path}`); await route.abort(); return }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto(`${baseUrl}/nudges`)
  await page.waitForFunction(() => document.querySelectorAll('.nudge-card').length === 20)
  return { page, context, calls, controls }
}

try {
  for (const width of [320, 375, 768, 1440]) for (const theme of ['light', 'dark']) {
    const { page, context, calls } = await setup(width, theme, width === 375 ? 'creator' : 'platform')
    const header = await page.locator('.page-layout .header').elementHandle()
    assert.equal(await page.getByText('Creator profiles receive broadcast messages.', { exact: false }).count(), 0)
    if (width === 375) assert.equal(await page.getByRole('tab').count(), 0)
    await page.getByRole('button', { name: 'Load more nudges' }).click()
    await page.locator('.ui-snackbar').getByText('The API returned an unexpected response.', { exact: false }).waitFor()
    assert.equal(await page.locator('.nudge-card').count(), 20)
    assert.equal(await page.getByText("Cannot read properties of null", { exact: false }).count(), 0)
    await page.getByRole('button', { name: 'Try again' }).click()
    await page.waitForFunction(() => document.querySelectorAll('.nudge-card').length === 21)
    assert.equal(calls.length, 3)
    assert.equal(calls[1].searchParams.get('cursor'), 'abc+/=')
    assert.equal(calls[2].href, calls[1].href)
    assert.equal(await page.getByRole('button', { name: 'Load more nudges' }).count(), 0)
    assert.equal(await page.locator('.page-layout .header').evaluate((el, original) => el === original, header), true)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    if (width !== 375) {
      await page.evaluate(() => scrollTo(0, 500))
      const transactional = page.getByRole('tab', { name: 'Transactional' })
      await transactional.focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.querySelectorAll('.nudge-card').length === 20)
      assert.equal(calls.at(-1).searchParams.get('nudge_type'), 'transactional')
      assert.ok(await page.evaluate(() => scrollY > 100), 'filter changes retain a scrolled document')
    }
    console.log(`PASS ${width}px ${theme}: absolute cursor, retained cards, retry, deduplication, creator restrictions and stable layout`)
    await context.close()
  }
  const { page, context, calls } = await setup(1440, 'light', 'platform', 'https://configured-api.example/gateway')
  await page.getByRole('button', { name: 'Load more nudges' }).click()
  await page.getByRole('button', { name: 'Try again' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.nudge-card').length === 21)
  assert.equal(calls[1].origin, 'https://configured-api.example')
  await page.goto(`${baseUrl}/token`)
  await page.waitForFunction(() => document.querySelector('pre[aria-label="Request example"]')?.textContent.includes('https://configured-api.example/gateway/v1/app-nudger/nudge/send'))
  await page.goto(baseUrl)
  assert.equal(await page.getByRole('link', { name: /Developer API Docs/ }).getAttribute('href'), 'https://configured-api.example/gateway/docs')
  console.log('PASS absolute environment base and prefix: pagination, token examples, and documentation use the same endpoint')
  await context.close()
  assert.deepEqual(failures, [])
} finally { await browser.close() }
