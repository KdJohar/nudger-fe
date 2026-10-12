import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { notificationCapabilities } from '../helpers/notificationFixtures.mjs'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const { default: AxeBuilder } = await import(process.env.AXE_MODULE || '@axe-core/playwright')
const isWebKit = process.env.BROWSER_ENGINE === 'webkit'
const browser = isWebKit ? await webkit.launch({ headless: true }) : await chromium.launch({ headless: true, channel: 'chrome' })
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:5174'
const output = process.env.HISTORY_SCREENSHOT_DIR || '/tmp/nudger-history'
const widths = (process.env.HISTORY_VIEWPORTS || '320,375,768,1024,1440').split(',').map(Number)
mkdirSync(output, { recursive: true })
const errors = []
const longMessage = 'A useful update 👋\n' + 'Long text stays readable. '.repeat(155)
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Studio Notes', nudger_id: 'studio-notes', profile_type: 'platform', is_active: true, profile_image_url: '/nudge.png' }
const item = (id, content = {}) => ({ id, title: 'Studio Notes', message: id, sender: 'platform', nudge_type: 'broadcast', notification_format: 'basic', status: 'completed', created_at: '2026-10-01T08:00:00Z', completed_at: '2026-10-01T08:00:05Z', stats: { total_audience: 12450, total_devices: 17000, delivered_users: 12000, muted_users: 450, failed_deliveries: 0 }, ...content })
const rich = { notification_format: 'rich', destination_url: 'https://example.com/watch', cta_label: 'watch_now', media_url: 'https://assets.example.com/ready.webp' }
const fixtures = [item('A basic update'), item('Watch our new tutorial', rich), item('An expired image', { ...rich, status: 'failed', cta_label: 'learn_more', media_url: 'https://assets.example.com/deleted.webp', stats: { total_audience: 1, total_devices: 1, delivered_users: 0, muted_users: 0, failed_deliveries: 1 } }), item('Still processing', { ...rich, status: 'processing', completed_at: null, media_url: null }), item('Queued for later', { status: 'created', completed_at: null }), item('Long message', { ...rich, message: longMessage, media_url: null })]

async function setup(width, theme) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce', hasTouch: width < 960 })
  const mediaCalls = [], historyCalls = []
  const controls = { mode: 'normal', hold: null }
  await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-refresh'))
  await context.route('**/runtime-config.js', route => route.fulfill({ contentType: 'application/javascript', body: 'window.__NUDGER_CONFIG__={apiBaseUrl:"/",profileImageSourceMaxBytes:10485760,profileImageFinalMaxBytes:1000000,profileImageMaxDimension:1280,profileImageWebpQuality:0.86}' }))
  await context.route('https://assets.example.com/**', route => {
    mediaCalls.push(route.request().url())
    assert.equal(route.request().headers().authorization, undefined)
    return route.request().url().includes('deleted') ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#154E61"/><circle cx="400" cy="225" r="100" fill="#DDF4ED"/><path d="M375 175 L375 275 L450 225Z" fill="#154E61"/></svg>' })
  })
  await context.route('**/v1/**', async route => {
    const path = new URL(route.request().url()).pathname
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ message: 'Fixture', data, errors: {} }) })
    if (path.endsWith('/refresh')) return respond({ auth: { access_token: 'fixture-session', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Studio', email: 'fixture@example.test' }, merchant_profile: profile })
    assert.equal(route.request().method(), 'GET', 'No real sends or mutations')
    if (path.endsWith('/profile')) return respond(profile)
    if (path.endsWith('/capabilities')) return respond(notificationCapabilities)
    if (path.endsWith('/nudges')) {
      historyCalls.push(route.request().url())
      if (controls.hold) await controls.hold
      return controls.mode === 'error' ? respond(null, 503) : respond({ items: controls.mode === 'empty' ? [] : fixtures, next: null, page_size: 20 })
    }
    errors.push(`Unexpected API request ${path}`)
    return respond(null, 404)
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  return { context, page, controls, mediaCalls, historyCalls }
}

try {
  for (const width of widths) for (const theme of ['light', 'dark']) {
    const { context, page, controls, mediaCalls, historyCalls } = await setup(width, theme)
    let release
    controls.hold = new Promise(resolve => { release = resolve })
    await page.goto(`${base}/nudges`)
    await page.getByText('Loading nudges.', { exact: true }).waitFor({ state: 'attached' })
    assert.equal(await page.locator('.ui-record-list__loading').count(), 1)
    controls.hold = null; release()
    const entries = page.getByTestId('history-item')
    await entries.nth(5).waitFor()
    assert.equal(await entries.count(), 6)
    assert.equal(mediaCalls.length, 0, 'History does not prefetch media, including older images')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.equal(await page.locator('table.ui-record-table').count(), width >= 960 ? 1 : 0)
    assert.equal(await page.locator('.ui-record-card').count(), width < 960 ? 6 : 0)
    assert.equal(await entries.nth(0).getByText('Basic', { exact: true }).count(), 1)
    assert.equal(await entries.nth(0).getByRole('link').count(), 0)
    assert.equal(await entries.nth(0).getByRole('button', { name: 'View image' }).count(), 0)
    assert.equal(await entries.nth(0).getByText('12,000', { exact: true }).count(), 1)
    assert.equal(await entries.nth(0).getByText('Completed in 5s', { exact: true }).count(), 1)
    assert.equal(await entries.nth(2).getByText('Failed', { exact: true }).count(), 1)
    assert.equal(await entries.nth(2).getByText('1 failed delivery', { exact: true }).count(), 1)
    assert.equal(await entries.nth(3).getByText('Processing', { exact: true }).count(), 1)
    assert.equal(await entries.nth(4).getByText('Queued', { exact: true }).count(), 1)
    assert.equal(await entries.nth(1).getByRole('link').getAttribute('href'), rich.destination_url)
    assert.equal(await entries.nth(1).getByRole('link').getAttribute('rel'), 'noopener noreferrer')
    if (width >= 960) assert.deepEqual(await page.locator('thead th').allTextContents(), ['Message', 'Type', 'Audience', 'Delivered', 'Muted', 'Total clicks', 'CTR', 'Status', 'Completion', 'CTA', 'Media'])
    else assert.equal(await page.locator('.header__content').evaluate(el => el.getBoundingClientRect().height), 1)
    const axe = await new AxeBuilder({ page }).include('.ui-record-list').analyze()
    assert.deepEqual(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `${width}/${theme} history accessibility`)
    await page.screenshot({ path: `${output}/history-${width}-${theme}.png`, fullPage: width >= 960 })

    const expired = entries.nth(2).getByRole('button', { name: 'View image' })
    await expired.click()
    let dialog = page.getByRole('dialog', { name: 'Notification image', exact: true })
    try { await dialog.waitFor({ timeout: 5000 }) } catch (error) {
      await page.screenshot({ path: `${output}/viewer-failure.png` })
      console.log(await page.locator('[role=dialog], v-dialog').evaluateAll(elements => elements.map(el => el.outerHTML)))
      throw error
    }
    await dialog.getByText('Image unavailable. The message and link are still available.', { exact: true }).waitFor()
    assert.equal(await dialog.locator('.ui-sheet__surface').count(), width < 960 ? 1 : 0)
    if (width < 960) assert.ok(await page.locator('#app').evaluate(el => el.inert), 'Sheet makes its background inert, including first open')
    assert.equal(mediaCalls.length, 1)
    const viewerAxe = await new AxeBuilder({ page }).include('[role=dialog]').analyze()
    assert.deepEqual(viewerAxe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], 'Image fallback accessibility')
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'View image')
    assert.equal(await page.locator('#app').getAttribute('inert'), null)

    await entries.nth(1).getByRole('button', { name: 'View image' }).click()
    dialog = page.getByRole('dialog', { name: 'Notification image', exact: true })
    await dialog.getByRole('img').waitFor()
    await page.waitForFunction(() => document.querySelector('[role=dialog] img')?.naturalWidth > 0)
    assert.equal(mediaCalls.length, 2)
    assert.ok(await dialog.getByRole('img').evaluate(el => getComputedStyle(el).objectFit === 'contain'))
    await page.screenshot({ path: `${output}/image-${width}-${theme}.png` })
    const geometry = await dialog.getByRole('img').boundingBox()
    assert.ok(geometry.x >= 0 && geometry.x + geometry.width <= width + 1, 'Image fits the viewer')
    await page.setViewportSize({ width: width < 960 ? 1440 : 375, height: 650 })
    await page.waitForFunction(expected => Boolean(document.querySelector('table.ui-record-table')) === expected, width < 960)
    assert.equal(await page.getByRole('dialog').count(), 1, 'Rotation keeps one viewer open')
    assert.equal(await dialog.locator('.ui-sheet__surface').count(), width < 960 ? 1 : 0)
    const close = dialog.getByRole('button', { name: 'Close image', exact: true }).last()
    await close.focus()
    await page.keyboard.press(isWebKit ? 'Alt+Tab' : 'Tab')
    assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)), 'Focus remains in the viewer')
    await close.click()
    await dialog.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => !document.getElementById('app').inert)
    await page.waitForFunction(() => document.activeElement?.dataset.mediaId === 'Watch our new tutorial')
    await page.setViewportSize({ width, height: 900 })
    await page.waitForFunction(expected => Boolean(document.querySelector('table.ui-record-table')) === expected, width >= 960)

    await entries.nth(5).getByRole('button', { name: 'Read full message' }).click()
    assert.equal(await entries.nth(5).locator('.ui-expandable-text__copy').textContent(), longMessage)
    await page.setViewportSize({ width: width >= 960 ? 375 : 1440, height: 900 })
    await page.waitForFunction(expected => Boolean(document.querySelector('table.ui-record-table')) === expected, width < 960)
    assert.equal(await entries.nth(5).locator('.ui-expandable-text__copy').textContent(), longMessage)
    assert.equal(historyCalls.length, 1, 'Resizing does not fetch history')
    await entries.nth(5).getByRole('button', { name: 'Show less' }).click()

    if (width === 375 && theme === 'light') {
      controls.mode = 'error'
      await page.getByRole('tab', { name: 'Transactional' }).click()
      await page.getByRole('button', { name: 'Reload nudges' }).waitFor()
      assert.equal(await entries.count(), 6, 'Failed refresh retains old data')
      controls.mode = 'empty'
      await page.getByRole('button', { name: 'Reload nudges' }).click()
      await page.getByRole('heading', { name: 'No nudges here yet' }).waitFor()
      controls.mode = 'normal'
      await page.getByRole('tab', { name: 'Broadcast' }).click()
      await entries.nth(5).waitFor()
    }
    console.log(`PASS ${width}/${theme}: table/cards, counts/status/duration, no invented engagement, deferred/deleted media, modal/Sheet focus, expansion and resize`)
    await context.close()
  }
  assert.deepEqual(errors, [])
} finally { await browser.close() }
