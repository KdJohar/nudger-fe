import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSourceLoader } from './helpers/vueHarness.mjs'

function createProfile(isActive) {
  return { id: 'merchant-id', user_id: 'user-id', profile_type: 'creator', display_name: 'Example', nudger_id: 'example', is_active: isActive, profile_image_url: null, created_at: '', updated_at: '' }
}

const routeAccess = createSourceLoader()('src/lib/profileRoute.ts')

test('pending review accepts a non-active merchant profile', async () => {
  assert.equal(routeAccess.getPendingProfileRedirect(createProfile(false)), null)
})

test('pending review redirects an active merchant to audience', () => {
  assert.equal(routeAccess.getPendingProfileRedirect(createProfile(true)), '/audience')
})

test('pending review sends an account without a merchant profile to onboarding', () => {
  assert.equal(routeAccess.getPendingProfileRedirect(null), '/onboarding')
})

test('the pending route is authenticated and delegates eligibility to the shared access helper', () => {
  const routerSource = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')
  assert.match(routerSource, /requiresAuth: true, requiresPendingProfile: true/)
  assert.match(routerSource, /const pendingRedirect = getPendingProfileRedirect\(profile\)/)
  assert.match(routerSource, /if \(pendingRedirect\) return pendingRedirect/)
})
