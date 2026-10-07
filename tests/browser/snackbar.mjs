import assert from 'node:assert/strict'
import { join } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const baseUrl = process.env.UI_BASE_URL || 'http://localhost:5174'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const failures = []
const profileFixture = { id: 'fixture', user_id: 'fixture-user', display_name: 'Fixture Studio', nudger_id: 'fixture-studio', profile_type: 'platform', is_active: true, profile_image_url: '/nudge.png' }
const snapshot = { total_audience: 0, new_subscribers: 0, unsubscribed_users: 0, unsubscribe_rate: 0, muted_subscribers: 0, reachable_subscribers: 0, broadcast_reach: 0, transactional_reach: 0 }

async function setup(width = 375, theme = 'dark', signedIn = true) {
  const context = await browser.newContext({ viewport: { width, height: 812 }, colorScheme: theme, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] })
  if (signedIn) await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-refresh'))
  const page = await context.newPage()
  page.setDefaultTimeout(8000)
  page.on('pageerror', error => failures.push(error.message))
  const controls = { failHistory: true, failAudience: true, failToken: false, failSave: true, failSend: true, sends: 0 }
  let profile = { ...profileFixture }
  await page.route('**/v1/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ data }) })
    const fail = message => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message, data: null, errors: { code: 'FIXTURE_UNAVAILABLE', retryable: true } }) })
    if (path.endsWith('/refresh')) return reply({ auth: { access_token: 'fixture-session', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Fixture', email: 'fixture@example.test' }, merchant_profile: profile })
    if (path.endsWith('/google/start')) return fail('Sign-in is temporarily unavailable.')
    if (path.endsWith('/nudges') && request.method() === 'GET') return controls.failHistory ? fail('Could not load your nudges.') : reply({ items: [], next: null })
    if (path.endsWith('/audience/overview')) return controls.failAudience ? fail('Could not load your audience.') : reply({ ...snapshot, merchant_profile_id: profile.id, profile_type: 'platform', active_subscribers: 0, period: '30d', comparison: { current: snapshot, previous: snapshot }, trend: [], comparison_trend: [], generated_at: '2026-10-07T00:00:00Z' })
    if (path.endsWith('/token') && request.method() === 'GET') return controls.failToken ? fail('Could not load your token.') : reply({ has_token: true, token: 'fixture-key-not-a-real-secret', token_prefix: 'fixture', created_at: null, rotated_at: null })
    if (path.endsWith('/token/rotate')) return fail('Token rotation is temporarily unavailable.')
    if (path.endsWith('/profile/image/presign')) return fail('Image upload is temporarily unavailable.')
    if (path.endsWith('/profile') && request.method() === 'GET') return reply(profile)
    if (path.endsWith('/profile') && request.method() === 'PATCH') {
      if (controls.failSave) return fail('Profile update is temporarily unavailable.')
      profile = { ...profile, ...request.postDataJSON(), updated_at: '2026-10-07T12:00:00Z' }
      return reply(profile)
    }
    if (path.endsWith('/nudge/broadcast') || path.endsWith('/nudge/send')) {
      controls.sends += 1
      return controls.failSend ? fail('Could not queue this nudge. Check history before trying again.') : reply({ nudge_id: 'fixture-nudge', status: 'queued' }, 202)
    }
    failures.push(`Unexpected API request: ${request.method()} ${path}`)
    await route.abort()
  })
  return { page, context, controls }
}
const snackbar = page => page.locator('.ui-snackbar')
async function expectMessage(page, text) {
  await snackbar(page).getByText(text, { exact: false }).waitFor()
  await snackbar(page).locator('.v-snackbar-transition-enter-active').waitFor({ state: 'detached' })
  assert.equal(await page.locator('.v-alert').count(), 0)
  assert.equal(await snackbar(page).count(), 1)
}
async function dismiss(page) {
  await snackbar(page).getByRole('button', { name: 'Dismiss notification' }).click()
  await snackbar(page).waitFor({ state: 'detached' })
}
async function geometry(page) {
  const metrics = await snackbar(page).locator('.v-snackbar__wrapper').evaluate(el => {
    const r = el.getBoundingClientRect()
    return { left: r.left, right: r.right, bottom: r.bottom, top: r.top, width: innerWidth, height: innerHeight }
  })
  assert.ok(metrics.left >= 0 && metrics.right <= metrics.width && metrics.top >= 0 && metrics.bottom <= metrics.height, JSON.stringify(metrics))
  assert.ok(metrics.top <= 24 && metrics.width - metrics.right <= 24, 'snackbar must be at the viewport top-right: ' + JSON.stringify(metrics))
  for (const button of await snackbar(page).getByRole('button').all()) {
    const box = await button.boundingBox()
    assert.ok(box.width >= 47.99 && box.height >= 47.99, '48px action targets: ' + JSON.stringify(box))
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
}
async function screenshot(page, name) {
  if (process.env.SNACKBAR_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.SNACKBAR_SCREENSHOT_DIR, name + '.png') })
}

try {
  for (const width of [320, 375, 768, 1440]) for (const theme of ['light', 'dark']) {
    const { page, context, controls } = await setup(width, theme)
    await page.goto(`${baseUrl}/nudges`)
    await expectMessage(page, 'Could not load your nudges.')
    await geometry(page)
    await screenshot(page, `snackbar-${width}-${theme}`)
    await snackbar(page).getByRole('button', { name: 'Dismiss notification' }).focus()
    await page.keyboard.press('Escape')
    await snackbar(page).waitFor({ state: 'detached' })
    await page.getByRole('button', { name: 'Reload nudges' }).click()
    await expectMessage(page, 'Could not load your nudges.')
    controls.failHistory = false
    await snackbar(page).getByRole('button', { name: 'Try again' }).click()
    await snackbar(page).waitFor({ state: 'detached' })
    await page.getByText('No nudges here yet', { exact: true }).waitFor()
    console.log(`PASS ${width}px ${theme}: snackbar/retry, keyboard dismissal, safe placement and no overflow`)
    await context.close()
  }

  const { page, context, controls } = await setup()
  await page.clock.install()
  await page.goto(`${baseUrl}/audience`)
  await expectMessage(page, 'Could not load your audience.')
  await page.mouse.move(0, 700)
  await page.clock.fastForward(19000)
  assert.equal(await snackbar(page).isVisible(), true, 'errors remain for the requested 20 seconds')
  await page.clock.fastForward(1100)
  await snackbar(page).waitFor({ state: 'detached' })
  await page.getByRole('button', { name: 'Reload audience' }).click()
  await expectMessage(page, 'Could not load your audience.')
  controls.failAudience = false
  await snackbar(page).getByRole('button', { name: 'Try again' }).click()
  await snackbar(page).waitFor({ state: 'detached' })
  await page.locator('.app-bottom-nav').getByRole('link', { name: 'API token', exact: true }).click()
  await page.getByRole('button', { name: 'Copy API token', exact: true }).click()
  await expectMessage(page, 'Token copied.')
  await snackbar(page).getByRole('button', { name: 'Dismiss notification' }).focus()
  await page.clock.fastForward(21000)
  assert.equal(await snackbar(page).isVisible(), true, 'keyboard focus pauses success timeout')
  await page.getByRole('button', { name: 'Reveal API token', exact: true }).focus()
  await page.mouse.move(0, 0)
  await page.clock.fastForward(19000)
  assert.equal(await snackbar(page).isVisible(), true, 'success uses the same 20-second timeout')
  await page.clock.fastForward(1100)
  await snackbar(page).waitFor({ state: 'detached' })
  await page.getByRole('button', { name: 'Copy API token', exact: true }).click()
  await expectMessage(page, 'Token copied.')
  await snackbar(page).locator('.v-snackbar__wrapper').hover()
  await page.clock.fastForward(21000)
  assert.equal(await snackbar(page).isVisible(), true, 'hover pauses timeout')
  await page.mouse.move(0, 700)
  await page.clock.fastForward(20100)
  await snackbar(page).waitFor({ state: 'detached' })
  await page.getByRole('button', { name: 'Rotate token', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Rotate token', exact: true }).click()
  await expectMessage(page, 'Token rotation is temporarily unavailable.')
  assert.equal(await snackbar(page).evaluate(el => Boolean(el.closest('.v-dialog.v-overlay--active'))), true)
  await geometry(page)
  const modalBox = await page.locator('.ui-confirmation').boundingBox()
  const noticeBox = await snackbar(page).locator('.v-snackbar__wrapper').boundingBox()
  assert.ok(noticeBox.y + noticeBox.height <= modalBox.y, 'snackbar must not cover the confirmation heading')
  await snackbar(page).getByRole('button', { name: 'Dismiss notification' }).focus()
  assert.equal(await snackbar(page).getByRole('button', { name: 'Dismiss notification' }).evaluate(el => el === document.activeElement), true)
  await screenshot(page, 'snackbar-token-dialog')
  await page.keyboard.press('Escape')
  await snackbar(page).waitFor({ state: 'detached' })
  assert.equal(await page.getByRole('dialog').isVisible(), true, 'Escape in snackbar must not also close its modal')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.locator('.app-bottom-nav').getByRole('link', { name: 'Profile', exact: true }).click()
  await page.getByRole('button', { name: 'Edit details', exact: true }).click()
  const about = page.getByRole('textbox', { name: 'About', exact: true })
  await about.fill('A profile draft that must survive failure.')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expectMessage(page, 'Profile update is temporarily unavailable.')
  assert.equal(await about.inputValue(), 'A profile draft that must survive failure.')
  await dismiss(page)
  controls.failSave = false
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expectMessage(page, 'Public profile updated.')
  await page.locator('.app-bottom-nav').getByRole('link', { name: 'Nudges', exact: true }).click()
  await expectMessage(page, 'Public profile updated.')
  await snackbar(page).getByRole('button', { name: 'Dismiss notification' }).click()
  await expectMessage(page, 'Could not load your nudges.')
  controls.failHistory = false
  await snackbar(page).getByRole('button', { name: 'Try again' }).click()
  await snackbar(page).waitFor({ state: 'detached' })
  await context.close()
  console.log('PASS 20-second error/success timeout, focus/hover pause, modal Escape, profile recovery and queued notices')

  const api = await setup(375, 'light')
  api.controls.failToken = true
  await api.page.goto(`${baseUrl}/token`)
  await expectMessage(api.page, 'Could not load your token.')
  api.controls.failToken = false
  await snackbar(api.page).getByRole('button', { name: 'Try again' }).click()
  await snackbar(api.page).waitFor({ state: 'detached' })
  await api.page.getByRole('button', { name: 'Copy Request example', exact: true }).click()
  await expectMessage(api.page, 'Copied.')
  await dismiss(api.page)
  await api.page.getByRole('textbox', { name: 'Message', exact: true }).fill('Playground fixture only.')
  await api.page.getByRole('button', { name: 'Send test nudge', exact: true }).click()
  await api.page.getByRole('button', { name: 'Confirm & send', exact: true }).click()
  await expectMessage(api.page, 'Request returned HTTP 503.')
  await dismiss(api.page)
  api.controls.failSend = false
  await api.page.getByRole('button', { name: 'Send test nudge', exact: true }).click()
  await api.page.getByRole('button', { name: 'Confirm & send', exact: true }).click()
  await expectMessage(api.page, 'Nudge queued. Check nudge history for delivery progress.')
  await dismiss(api.page)
  await api.page.locator('.app-bottom-nav').getByRole('link', { name: 'Profile', exact: true }).click()
  await api.page.locator('input[type="file"]').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64') })
  await expectMessage(api.page, 'Image upload is temporarily unavailable.')
  await api.context.close()
  console.log('PASS token load recovery, example copy, playground error/success and image-upload feedback')

  for (const width of [375, 1440]) {
    const { page, context, controls } = await setup(width)
    controls.failHistory = false
    await page.goto(`${baseUrl}/${width === 375 ? 'nudges' : 'compose'}`)
    if (width === 375) await page.getByRole('button', { name: 'Send a nudge', exact: true }).click()
    await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('Mocked broadcast only.')
    await page.getByRole('button', { name: 'Review & send', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Send nudge', exact: true }).click()
    await expectMessage(page, 'Could not queue this nudge.')
    assert.equal(controls.sends, 1, 'failed sends are never automatically retried')
    await page.waitForFunction(() => Boolean(document.querySelector('.ui-snackbar')?.closest('.v-dialog.v-overlay--active')))
    await geometry(page)
    assert.equal(await snackbar(page).evaluate(el => Boolean(el.closest('[inert]'))), false)
    await snackbar(page).getByRole('button', { name: 'Dismiss notification' }).focus()
    assert.equal(await snackbar(page).getByRole('button', { name: 'Dismiss notification' }).evaluate(el => el === document.activeElement), true)
    await screenshot(page, `snackbar-compose-${width}`)
    if (width === 375) {
      await snackbar(page).getByRole('button', { name: 'Check history', exact: true }).click()
      await page.getByRole('dialog').waitFor({ state: 'hidden' })
      await page.getByRole('button', { name: 'Send a nudge', exact: true }).click()
    } else {
      await dismiss(page)
      await page.getByRole('button', { name: 'Keep editing', exact: true }).click()
    }
    assert.equal(await page.getByRole('textbox', { name: 'Your message', exact: true }).inputValue(), 'Mocked broadcast only.')
    controls.failSend = false
    await page.getByRole('button', { name: 'Review & send', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Send nudge', exact: true }).click()
    await expectMessage(page, 'Your nudge is queued.')
    assert.equal(controls.sends, 2)
    await context.close()
    console.log(`PASS ${width}px composer: modal/sheet feedback, usable focus, preserved draft and explicit send only`)
  }
  const guest = await setup(375, 'light', false)
  await guest.page.goto(`${baseUrl}/auth/callback`)
  await expectMessage(guest.page, 'This sign-in link is incomplete.')
  await snackbar(guest.page).getByRole('link', { name: 'Sign in', exact: true }).click()
  await guest.page.waitForURL('**/login')
  await snackbar(guest.page).waitFor({ state: 'detached' })
  await guest.page.getByRole('button', { name: 'Continue with Google' }).click()
  await expectMessage(guest.page, 'Sign-in is temporarily unavailable.')
  await guest.context.close()
  assert.deepEqual(failures, [])
  console.log('PASS callback/login failures and stale notification cleanup; no real API mutations')
} finally { await browser.close() }
