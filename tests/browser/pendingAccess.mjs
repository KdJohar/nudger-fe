import assert from 'node:assert/strict'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const baseUrl = process.env.UI_BASE_URL || 'http://127.0.0.1:5174'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Fixture Studio', nudger_id: 'fixture-studio', profile_type: 'creator', is_active: true, profile_image_url: '/nudge.png' }

async function verifyPendingAccess({ label, width, merchantProfile, expectedPath, hasSession = true }) {
  const context = await browser.newContext({ viewport: { width, height: 812 }, hasTouch: width < 960, reducedMotion: 'reduce' })
  await context.addInitScript(({ hasSession }) => {
    if (hasSession) localStorage.setItem('nudger.refresh_token', 'fixture-refresh')
    window.__NUDGER_CONFIG__ = { apiBaseUrl: 'http://localhost:8001' }
  }, { hasSession })
  const page = await context.newPage()
  const unexpectedMutations = []
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.route('**/v1/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (request.method() !== 'GET' && !path.endsWith('/refresh')) {
      unexpectedMutations.push(`${request.method()} ${path}`)
      await route.abort()
      return
    }
    if (path.endsWith('/refresh')) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
        data: { auth: { access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Fixture Studio', email: 'fixture@example.test' }, merchant_profile: merchantProfile },
      }) })
      return
    }
    if (path.endsWith('/profile')) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: merchantProfile }) })
      return
    }
    if (path.endsWith('/audience/overview')) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { total_audience: 0, new_subscribers: 0, unsubscribed_users: 0, unsubscribe_rate: 0, muted_subscribers: 0, reachable_subscribers: 0, broadcast_reach: 0, transactional_reach: 0, comparison: { current: {}, previous: {} }, trend: [], comparison_trend: [] } }) })
      return
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: { items: [], next: null } }) })
  })
  await page.goto(`${baseUrl}/pending`)
  await page.waitForFunction(path => location.pathname === path, expectedPath)
  assert.equal(new URL(page.url()).pathname, expectedPath, label)
  assert.deepEqual(unexpectedMutations, [], `${label}: access checks never mutate data`)
  assert.deepEqual(pageErrors, [], `${label}: route handling has no browser errors`)
  await context.close()
  console.log(`PASS ${label}`)
}

try {
  for (const width of [375, 1440]) {
    await verifyPendingAccess({ label: `${width}px active profile refresh redirects to audience`, width, merchantProfile: profile, expectedPath: '/audience' })
    await verifyPendingAccess({ label: `${width}px non-active profile stays on pending`, width, merchantProfile: { ...profile, is_active: false }, expectedPath: '/pending' })
  }
  await verifyPendingAccess({ label: 'submitted profile is required for pending review', width: 375, merchantProfile: null, expectedPath: '/onboarding' })
  await verifyPendingAccess({ label: 'signed-out visitor is redirected to login', width: 375, merchantProfile: null, expectedPath: '/login', hasSession: false })
} finally {
  await browser.close()
}
