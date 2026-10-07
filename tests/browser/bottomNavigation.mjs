import assert from 'node:assert/strict'
import { join } from 'node:path'

// Use an existing Playwright installation; do not depend on a running backend.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const baseUrl = process.env.UI_BASE_URL || 'http://localhost:5174'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const failures = []
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Studio Notes', nudger_id: 'studio-notes', profile_type: 'platform', is_active: true, profile_image_url: '/nudge.png' }
const snapshot = { total_audience: 0, new_subscribers: 0, unsubscribed_users: 0, unsubscribe_rate: 0, muted_subscribers: 0, reachable_subscribers: 0, broadcast_reach: 0, transactional_reach: 0 }

async function setup(width, theme, touch = false, options = {}) {
  let notifyLogout, notifySave
  const controls = { logoutCalls: 0, logoutStatus: options.logoutStatus || 200,
    holdLogout: false, releaseLogout: null, logoutStarted: new Promise(resolve => { notifyLogout = resolve }),
    holdSave: false, releaseSave: null, saveStarted: new Promise(resolve => { notifySave = resolve }), tokenReads: 0 }
  let merchantProfile = { ...profile, profile_type: options.merchantType || 'platform', profile_image_url: options.imageUrl === undefined ? profile.profile_image_url : options.imageUrl }
  const context = await browser.newContext({ viewport: { width, height: 812 }, colorScheme: theme, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' })
  await context.addInitScript(() => {
    localStorage.setItem('nudger.refresh_token', 'fixture-refresh')
    window.__NUDGER_CONFIG__ = { apiBaseUrl: 'http://localhost:8001' }
  })
  const page = await context.newPage()
  page.on('pageerror', error => failures.push(error.message))
  await page.route('**/fixture-broken-avatar.png', route => route.fulfill({ status: 404, body: '' }))
  await page.route('**/v1/**', async route => {
    const request = route.request(), url = new URL(request.url())
    let body
    if (url.pathname.endsWith('/refresh')) body = { data: { auth: { access_token: 'fixture-session', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Studio Notes', email: 'fixture@example.test' }, merchant_profile: merchantProfile } }
    else if (url.pathname.endsWith('/logout') && request.method() === 'POST') {
      controls.logoutCalls += 1
      const pause = controls.holdLogout ? new Promise(resolve => { controls.releaseLogout = resolve }) : Promise.resolve()
      notifyLogout()
      await pause
      await route.fulfill({ status: controls.logoutStatus, contentType: 'application/json', body: JSON.stringify({ message: 'Fixture logout response', data: null }) })
      return
    } else if (url.pathname.endsWith('/profile') && request.method() === 'PATCH') {
      const pause = controls.holdSave ? new Promise(resolve => { controls.releaseSave = resolve }) : Promise.resolve()
      notifySave()
      await pause
      merchantProfile = { ...merchantProfile, ...request.postDataJSON(), updated_at: '2026-10-07T12:00:00Z' }
      body = { data: merchantProfile }
    }
    else if (request.method() !== 'GET') {
      failures.push(`Unexpected mutation: ${request.method()} ${url.pathname}`)
      await route.abort(); return
    } else if (url.pathname.endsWith('/profile')) body = { data: merchantProfile }
    else if (url.pathname.endsWith('/token')) { controls.tokenReads += 1; body = { data: { has_token: false, token: null, token_prefix: null, created_at: null, rotated_at: null } } }
    else if (url.pathname.endsWith('/audience/overview')) body = { data: { ...snapshot, merchant_profile_id: profile.id, profile_type: merchantProfile.profile_type, active_subscribers: 0, period: url.searchParams.get('period') || '30d', breakdown: snapshot, comparison: { period: '30d', current: snapshot, previous: snapshot }, trend: [], comparison_trend: [], generated_at: '2026-10-07T00:00:00Z' } }
    else body = { data: { items: [], results: [], next: null } }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.goto(`${baseUrl}/audience`)
  await page.locator('.page-layout .header__title').waitFor()
  return { page, context, controls }
}

async function verifyForeground(button, theme, label) {
  await button.locator('.v-ripple__container').waitFor({ state: 'detached' })
  const result = await button.evaluate(element => {
    const style = getComputedStyle(element), content = element.querySelector('.v-btn__content'), icon = element.querySelector('.v-icon')
    const overlay = getComputedStyle(element.querySelector('.v-btn__overlay'))
    return { background: style.backgroundColor, color: style.color, content: getComputedStyle(content).color, icon: icon ? getComputedStyle(icon).color : style.color, opacity: getComputedStyle(content).opacity, height: element.getBoundingClientRect().height, overlay: overlay.backgroundColor, overlayOpacity: Number(overlay.opacity) }
  })
  const expected = theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(67, 56, 202)'
  for (const property of ['color', 'content', 'icon']) assert.equal(result[property], expected, `${label}: ${JSON.stringify(result)}`)
  assert.equal(result.opacity, '1'); assert.ok(result.height >= 48)
  if (theme === 'dark') {
    assert.equal(result.background, 'rgb(67, 56, 202)')
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number)
    const surface = rgb(result.background), overlay = rgb(result.overlay)
    const rendered = surface.map((value, index) => value * (1 - result.overlayOpacity) + overlay[index] * result.overlayOpacity)
    const luminance = rendered.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    assert.ok(1.05 / (luminance + .05) >= 4.5, `${label}: rendered contrast must include the hover/focus overlay`)
  }
}

try {
  for (const theme of ['dark', 'light']) for (const width of [375, 768, 320]) {
    const { page, context } = await setup(width, theme)
    const nav = page.locator('.app-bottom-nav')
    const original = await nav.elementHandle()
    assert.deepEqual(await nav.getByRole('link').evaluateAll(items => items.map(item => item.getAttribute('aria-label'))), ['Audience', 'Nudges', 'API token', 'Profile'])
    assert.equal(await page.locator('.app-drawer').count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Toggle theme', exact: true }).count(), 0)
    for (const [name, path] of [['Audience', '/audience'], ['Nudges', '/nudges'], ['API token', '/token'], ['Profile', '/profile']]) {
      const button = nav.getByRole('link', { name, exact: true })
      await button.click(); await page.waitForURL(`**${path}`)
      assert.equal(await button.getAttribute('aria-current'), 'page')
      // Clicking leaves the pointer over the selection, which reproduced the regression.
      await verifyForeground(button, theme, `${width}px ${name} hovered/selected`)
      if (process.env.NAV_SCREENSHOT_DIR) await nav.screenshot({ path: join(process.env.NAV_SCREENSHOT_DIR, `bottom-nav-${width}-${theme}-${name.toLowerCase()}.png`) })
      await page.mouse.move(0, 0)
      await verifyForeground(button, theme, `${width}px ${name} selected`)
      await button.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab')
      assert.equal(await button.evaluate(el => el.matches(':focus-visible')), true)
      await verifyForeground(button, theme, `${width}px ${name} keyboard-focused`)
      assert.equal(await nav.evaluate((el, original) => el === original, original), true)
    }
    const avatar = nav.locator('.ui-avatar-image')
    await page.waitForFunction(() => document.querySelector('.ui-avatar-image img')?.naturalWidth > 0)
    assert.equal(await avatar.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)')
    const logout = page.getByRole('button', { name: 'Log out', exact: true })
    await logout.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const logoutHit = await logout.evaluate(el => {
      const rect = el.getBoundingClientRect(), hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
      return rect.height >= 48 && (hit === el || el.contains(hit))
    })
    assert.equal(logoutHit, true, 'Logout remains reachable above the floating nav')
    assert.equal(await page.locator('.ui-session-actions').evaluate(el => Boolean(document.querySelector('.ui-detail-card__settings').compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)), true)
    await page.getByRole('radio', { name: 'System', exact: true }).locator('..').click()
    assert.equal(await page.getByRole('radio', { name: 'System', exact: true }).isChecked(), true)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    if (process.env.NAV_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.NAV_SCREENSHOT_DIR, `profile-navigation-${width}-${theme}.png`), fullPage: true })
    console.log(`PASS ${width}px ${theme}: platform navigation, avatar, no drawer/theme shortcut, profile settings/logout, contrast, keyboard and 48px targets`)
    await context.close()
  }
  const touch = await setup(375, 'dark', true)
  const touchNav = touch.page.locator('.app-bottom-nav')
  await touchNav.getByRole('link', { name: 'Nudges', exact: true }).tap()
  await touch.page.waitForURL('**/nudges')
  await verifyForeground(touchNav.getByRole('link', { name: 'Nudges', exact: true }), 'dark', 'Touch selection')
  await touch.page.getByRole('button', { name: 'Send a nudge', exact: true }).tap()
  await touch.page.getByRole('dialog').waitFor()
  await touch.page.keyboard.press('Escape')
  await touchNav.getByRole('link', { name: 'Profile', exact: true }).tap()
  await touch.page.waitForURL('**/profile')
  console.log('PASS touch navigation and broadcast composer access through the FAB')
  await touch.context.close()
  for (const imageUrl of [null, '/fixture-broken-avatar.png']) {
    const creator = await setup(375, 'dark', true, { merchantType: 'creator', imageUrl })
    const nav = creator.page.locator('.app-bottom-nav')
    assert.deepEqual(await nav.getByRole('link').evaluateAll(items => items.map(item => item.getAttribute('aria-label'))), ['Audience', 'Nudges', 'Profile'])
    await nav.locator('.ui-avatar-image .mdi-account-outline').waitFor()
    await nav.getByRole('link', { name: 'Profile', exact: true }).tap()
    await creator.page.waitForURL('**/profile')
    await verifyForeground(nav.getByRole('link', { name: 'Profile', exact: true }), 'dark', 'Creator fallback avatar')
    await creator.page.goto(`${baseUrl}/token`); await creator.page.waitForURL('**/audience')
    assert.equal(creator.controls.tokenReads, 0)
    console.log(`PASS creator restrictions and ${imageUrl ? 'broken' : 'missing'} image fallback`)
    await creator.context.close()
  }
  for (const logoutStatus of [200, 503]) {
    const app = await setup(375, 'dark', false, { logoutStatus }), { page, controls } = app
    await page.locator('.app-bottom-nav').getByRole('link', { name: 'Profile', exact: true }).click()
    await page.getByRole('button', { name: 'Edit details', exact: true }).click()
    const about = page.getByRole('textbox', { name: 'About', exact: true }), logout = page.getByRole('button', { name: 'Log out', exact: true })
    await about.fill('Keep this unsaved draft')
    page.once('dialog', dialog => dialog.dismiss())
    await logout.click()
    assert.equal(controls.logoutCalls, 0); assert.equal(await about.inputValue(), 'Keep this unsaved draft')
    assert.equal(await page.evaluate(() => localStorage.getItem('nudger.refresh_token')), 'fixture-refresh')
    if (logoutStatus === 200) {
      controls.holdSave = true
      await page.getByRole('button', { name: 'Save changes', exact: true }).click(); await controls.saveStarted
      assert.equal(await logout.isDisabled(), true)
      controls.releaseSave()
      await page.getByRole('button', { name: 'Edit details', exact: true }).waitFor()
    } else page.once('dialog', dialog => dialog.accept())
    controls.holdLogout = true
    await logout.click(); await controls.logoutStarted
    assert.equal(await logout.isDisabled(), true)
    await logout.evaluate(el => el.click())
    assert.equal(controls.logoutCalls, 1)
    controls.releaseLogout()
    await page.waitForURL('**/login')
    assert.equal(await page.evaluate(() => localStorage.getItem('nudger.refresh_token')), null)
    assert.equal(await page.locator('.app-bottom-nav').count(), 0)
    console.log(`PASS logout (${logoutStatus}): cancelled drafts preserved, save/duplicate protection, session cleared and login shown`)
    await app.context.close()
  }
  for (const theme of ['dark', 'light']) {
    const desktop = await setup(1440, theme)
    assert.equal(await desktop.page.locator('.app-bottom-nav').count(), 0)
    assert.equal(await desktop.page.locator('.app-drawer').isVisible(), true)
    assert.equal(await desktop.page.getByLabel('Dark mode', { exact: true }).isVisible(), true)
    assert.equal(await desktop.page.getByRole('link', { name: /New nudge/ }).isVisible(), true)
    await desktop.page.getByRole('link', { name: /Profile Manage your public identity/ }).click()
    await desktop.page.waitForURL('**/profile')
    assert.equal(await desktop.page.getByRole('button', { name: 'Log out', exact: true }).count(), 0)
    const header = await desktop.page.locator('.page-layout .header').elementHandle()
    await desktop.page.setViewportSize({ width: 375, height: 812 })
    await desktop.page.locator('.app-bottom-nav').waitFor()
    assert.equal(await desktop.page.locator('.app-drawer').count(), 0)
    assert.equal(await desktop.page.getByRole('button', { name: 'Log out', exact: true }).isVisible(), true)
    await desktop.page.setViewportSize({ width: 1440, height: 812 })
    await desktop.page.locator('.app-drawer').waitFor()
    assert.equal(await desktop.page.locator('.app-bottom-nav').count(), 0)
    assert.equal(await desktop.page.locator('.page-layout .header').evaluate((el, header) => el === header, header), true)
    console.log(`PASS 1440px ${theme}: desktop sidebar retained, mobile navigation absent`)
    await desktop.context.close()
  }
  assert.deepEqual(failures, [])
} finally { await browser.close() }
