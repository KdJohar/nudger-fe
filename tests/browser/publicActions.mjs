import assert from 'node:assert/strict'
import { join } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const baseUrl = process.env.UI_BASE_URL || 'http://localhost:5174'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const failures = []
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Studio Notes', nudger_id: 'studio-notes', profile_type: 'creator', profile_image_url: '/nudge.png', is_active: true }

async function setup({ width = 375, theme = 'light', session = 'visitor', holdRefresh = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 812 }, colorScheme: theme, hasTouch: width < 960, reducedMotion: 'reduce' })
  await context.addInitScript(session => {
    if (session !== 'visitor') localStorage.setItem('nudger.refresh_token', 'fixture-refresh')
    window.__NUDGER_CONFIG__ = { apiBaseUrl: 'http://localhost:8001' }
  }, session)
  const page = await context.newPage()
  page.on('pageerror', error => failures.push(error.message))
  let releaseRefresh
  const refreshGate = holdRefresh ? new Promise(resolve => { releaseRefresh = resolve }) : Promise.resolve()
  const requests = []
  const merchant = ['active', 'pending'].includes(session) ? { ...profile, is_active: session === 'active' } : null
  await page.route('**/v1/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname
    requests.push(path)
    let body, status = 200
    if (path.endsWith('/refresh')) {
      await refreshGate
      if (session === 'expired') { status = 401; body = { message: 'Session expired', data: null } }
      else body = { data: { auth: { access_token: 'fixture-session', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Studio Notes', email: 'fixture@example.test' }, merchant_profile: merchant } }
    } else if (request.method() !== 'GET') {
      failures.push(`Unexpected mutation: ${request.method()} ${path}`)
      await route.abort(); return
    } else if (path.endsWith('/profile')) body = { data: merchant }
    else body = { data: { items: [], results: [], next: null } }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto(baseUrl)
  await page.getByRole('heading', { level: 1 }).waitFor()
  return { context, page, requests, releaseRefresh, dock: page.getByRole('navigation', { name: 'Quick actions' }) }
}

try {
  // Real responsive layout and touch targets in both themes, including narrow reflow.
  for (const theme of ['light', 'dark']) for (const width of [320, 375, 768]) {
    const { page, context, dock, requests } = await setup({ width, theme })
    await dock.getByRole('link', { name: /Start sending/ }).waitFor()
    assert.equal(await dock.getByRole('link').count(), 2)
    assert.equal(requests.length, 0, 'Visitors require no session/profile request')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const fixedTop = await dock.evaluate(el => el.getBoundingClientRect().top)
    for (const link of await dock.getByRole('link').all()) {
      const box = await link.boundingBox()
      assert.ok(box.width >= 48 && box.height >= 48)
      assert.ok(await link.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }))
      await link.focus()
      assert.equal(await link.evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
    }
    await page.keyboard.press('Tab')
    await page.mouse.click(1, 200)
    if (process.env.PUBLIC_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.PUBLIC_SCREENSHOT_DIR, `landing-actions-${width}-${theme}.png`) })
    await dock.getByRole('link', { name: /Get the app/ }).tap()
    await page.waitForURL('**/#get-app')
    await page.waitForFunction(() => document.querySelector('#get-app').getBoundingClientRect().top < 100)
    assert.equal(await dock.evaluate(el => el.getBoundingClientRect().top), fixedTop, 'Dock stays at the viewport bottom while scrolling')
    assert.equal(await page.getByLabel('App Store coming soon', { exact: true }).count(), 1)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const footerBottom = await page.locator('.site-footer__bottom').evaluate(el => el.getBoundingClientRect().bottom)
    assert.ok(footerBottom < fixedTop, 'Footer remains reachable above the dock')
    await dock.getByRole('link', { name: /Start sending/ }).tap()
    await page.waitForURL('**/login')
    assert.equal(await dock.count(), 0)
    console.log(`PASS ${width}px ${theme}: split actions, fixed position, targets/focus, coming soon, footer clearance and sign-in`)
    await context.close()
  }

  for (const session of ['active', 'pending', 'onboarding', 'expired']) {
    const { page, context, dock, requests, releaseRefresh } = await setup({ session, holdRefresh: true })
    await dock.getByRole('status').waitFor()
    assert.equal(await dock.getByRole('link').count(), 0, 'No incorrect CTA while restoring the session')
    // The landing page remains usable even when session restoration is still pending.
    assert.equal(await page.getByRole('heading', { level: 1 }).isVisible(), true)
    releaseRefresh()
    const hasProfile = ['active', 'pending'].includes(session)
    const action = dock.getByRole('link', { name: hasProfile ? /Open dashboard/ : /Start sending/ })
    await action.waitFor()
    assert.equal(await dock.getByRole('link').count(), hasProfile ? 1 : 2)
    assert.equal(await action.getAttribute('href'), hasProfile ? '/nudges' : session === 'onboarding' ? '/onboarding' : '/login')
    if (session === 'pending') assert.match(await dock.innerText(), /awaiting approval/)
    if (process.env.PUBLIC_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.PUBLIC_SCREENSHOT_DIR, `landing-actions-${session}.png`) })
    await action.tap()
    await page.waitForURL(`**/${session === 'active' ? 'nudges' : session === 'pending' ? 'pending' : session === 'onboarding' ? 'onboarding' : 'login'}`)
    assert.equal(requests.filter(path => path.endsWith('/refresh')).length, 1, 'Reuse the restored session during routing')
    assert.equal(await dock.count(), 0)
    if (session === 'pending') assert.equal(requests.some(path => path.includes('/nudge/')), false, 'Pending profiles retain the existing approval gate')
    console.log(`PASS ${session}: session restoration, correct CTA and guarded destination`)
    await context.close()
  }

  const desktop = await setup({ width: 1440, session: 'active' })
  assert.equal(await desktop.dock.count(), 0)
  assert.equal(desktop.requests.length, 0, 'Desktop landing does not restore a session for mobile-only UI')
  const header = await desktop.page.locator('.site-header').elementHandle()
  await desktop.page.setViewportSize({ width: 375, height: 812 })
  await desktop.dock.getByRole('link', { name: /Open dashboard/ }).waitFor()
  await desktop.page.setViewportSize({ width: 1440, height: 812 })
  await desktop.dock.waitFor({ state: 'detached' })
  assert.equal(await desktop.dock.count(), 0)
  assert.equal(await desktop.page.locator('.site-header').evaluate((el, original) => el === original, header), true)
  await desktop.page.setViewportSize({ width: 375, height: 812 })
  await desktop.dock.getByRole('link', { name: /Open dashboard/ }).waitFor()
  assert.equal(desktop.requests.filter(path => path.endsWith('/refresh')).length, 1)
  await desktop.page.goto(`${baseUrl}/privacy`)
  await desktop.page.getByRole('heading', { level: 1 }).waitFor()
  assert.equal(await desktop.dock.count(), 0)
  console.log('PASS desktop unchanged, responsive session reuse, dock scoped to landing')
  await desktop.context.close()
  assert.deepEqual(failures, [])
} finally {
  await browser.close()
}
