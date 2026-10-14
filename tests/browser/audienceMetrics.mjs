import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const { default: AxeBuilder } = await import(process.env.AXE_MODULE || '@axe-core/playwright')
const browser = process.env.BROWSER_ENGINE === 'webkit'
  ? await webkit.launch({ headless: true }) : await chromium.launch({ headless: true, channel: 'chrome' })
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:5184'
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Fixture Studio', nudger_id: 'fixture', profile_type: 'platform', is_active: true, profile_image_url: '/nudge.png' }
const cases = { '7d': [1, 2, '-50.0%'], '30d': [3, 2, '+50.0%'], '90d': [6, 4, '+50.0%'] }
const errors = []
let activePage
const output = process.env.AUDIENCE_SCREENSHOT_DIR
if (output) mkdirSync(output, { recursive: true })

function payload(period, current, previous, total = 42) {
  const snapshot = { total_audience: total, new_subscribers: current, unsubscribed_users: 1, unsubscribe_rate: 2, muted_subscribers: total ? 2 : 0, reachable_subscribers: total ? total-2 : 0, broadcast_reach: total ? total-2 : 0, transactional_reach: total ? total-2 : 0 }
  return { ...snapshot, merchant_profile_id: profile.id, profile_type: profile.profile_type, active_subscribers: total, period,
    breakdown: { ...snapshot, broadcast_subscribed: total, broadcast_unsubscribed: 0, transactional_subscribed: total, transactional_unsubscribed: 0 },
    comparison: { period, current: snapshot, previous: { ...snapshot, total_audience: 12, new_subscribers: previous } },
    trend: [{ date: '2026-10-14', active_subscribers: total, new_subscribers: current, unsubscribed_users: 1 }],
    comparison_trend: [{ date: '2026-10-14', previous_date: '2026-09-14', active_subscribers: total, previous_active_subscribers: 12 }], generated_at: '2026-10-14T00:00:00Z' }
}

async function assertCards(page, period, change, total = 42) {
  const cards = page.locator('.ui-insights__metrics .ui-stat')
  await page.locator('.ui-stat__detail').filter({ hasText: `vs previous ${period.slice(0, -1)} days` }).waitFor()
  assert.equal(await cards.count(), 4)
  assert.equal(await cards.nth(0).locator('.ui-stat__label').textContent(), 'Total audience')
  assert.equal(await cards.nth(0).locator('.ui-stat__detail').textContent(), 'Currently active subscribers')
  assert.equal(await cards.nth(0).locator('.ui-stat__change').count(), 0)
  assert.equal(await cards.nth(0).locator('.ui-visually-hidden').textContent(), String(total))
  assert.equal(await cards.nth(1).locator('.ui-stat__change span').textContent(), change)
  assert.equal(await page.locator('.ui-stat__change').count(), 1)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
}

try {
  for (const width of (process.env.AUDIENCE_VIEWPORTS || '320,375,768,1440').split(',').map(Number)) for (const theme of ['light', 'dark']) {
    // Prevent a production-build service worker from bypassing Playwright's fixture routes.
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce', hasTouch: width < 960, serviceWorkers: 'block' })
    const controls = { fail: false, custom: null }
    await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-refresh'))
    await context.route('**/runtime-config.js', route => route.fulfill({ contentType: 'application/javascript', body: 'window.__NUDGER_CONFIG__={apiBaseUrl:"/",profileImageSourceMaxBytes:10485760,profileImageFinalMaxBytes:1000000,profileImageMaxDimension:1280,profileImageWebpQuality:0.86}' }))
    await context.route('**/v1/**', async route => {
      const path = new URL(route.request().url()).pathname
      const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ message: 'Fixture', data, errors: {} }) })
      if (path.endsWith('/refresh')) return reply({ auth: { access_token: 'fixture', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Fixture' }, merchant_profile: profile })
      assert.equal(route.request().method(), 'GET', 'Audience layout tests must never mutate real data')
      if (path.endsWith('/audience/overview')) {
        const period = new URL(route.request().url()).searchParams.get('period') || '30d'
        return controls.fail ? reply(null, 503) : reply(payload(period, ...(controls.custom || cases[period].slice(0, 2))))
      }
      errors.push(`Unexpected API request: ${path}`)
      return reply(null, 404)
    })
    const page = await context.newPage()
    activePage = page
    page.on('pageerror', error => errors.push(error.message))
    page.on('requestfailed', request => errors.push(`Fixture network failure: ${request.url()} ${request.failure()?.errorText}`))
    await page.goto(`${base}/audience`)
    try { await assertCards(page, '30d', '+50.0%') } catch (error) {
      console.error('Fixture browser state:', page.url(), await page.locator('body').innerText(), errors)
      throw error
    }
    const header = await page.locator('.header').elementHandle()
    const window = await page.locator('.v-window__container').elementHandle()
    for (const period of ['7d', '90d', '30d']) {
      const tab = page.getByRole('tab', { name: `${period.slice(0, -1)} days` })
      if (width < 960) await tab.tap()
      else await tab.click()
      await assertCards(page, period, cases[period][2])
      assert.ok(await header.evaluate(element => element.isConnected))
      assert.ok(await window.evaluate(element => element.isConnected))
    }
    // Exercise real keyboard tab activation, not a second filter implementation.
    await page.getByRole('tab', { name: '7 days' }).focus()
    await page.keyboard.press('Enter')
    await assertCards(page, '7d', '-50.0%')
    controls.fail = true
    await page.getByRole('tab', { name: '90 days' }).click()
    await page.getByRole('button', { name: 'Reload audience' }).waitFor()
    await assertCards(page, '7d', '-50.0%')
    controls.fail = false
    await page.getByRole('button', { name: 'Dismiss notification' }).click()
    await page.getByRole('button', { name: 'Reload audience' }).click()
    await assertCards(page, '90d', '+50.0%')
    for (const [current, previous, total, change] of [[3, 0, 42, 'New this period'], [0, 2, 42, '-100.0%'], [0, 0, 0, 'No change']]) {
      controls.custom = [current, previous, total]
      await page.reload()
      await assertCards(page, '30d', change, total)
    }
    const accessibility = await new AxeBuilder({ page }).include('.ui-insights__metrics').analyze()
    assert.deepEqual(accessibility.violations, [])
    assert.equal(await page.locator('h1').count(), 1)
    if (output) await page.screenshot({ path: `${output}/audience-${process.env.BROWSER_ENGINE || 'chrome'}-${width}-${theme}.png`, fullPage: true })
    console.log(`PASS ${width}px ${theme}: 7/30/90 cohorts, sole comparison, stable frame, keyboard, error/retry, zero baseline, Axe, no overflow`)
    await context.close()
  }
  assert.deepEqual(errors, [])
} catch (error) {
  if (activePage && !activePage.isClosed()) {
    console.error('Fixture failure state:', activePage.url(), await activePage.locator('body').innerText(), errors)
    if (output) await activePage.screenshot({ path: `${output}/failure-${process.env.BROWSER_ENGINE || 'chrome'}.png`, fullPage: true })
  }
  throw error
} finally { await browser.close() }
