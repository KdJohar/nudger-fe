import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/vueHarness.mjs'

function createHarness() {
  const synced = []
  let requestJson
  const load = createSourceLoader({
    '../config': { getNudgerConfig: () => ({ apiBaseUrl: 'https://example.test' }) },
    '../lib/profileImages': {},
    './useAuth': { useAuth: () => ({
      state: { accessToken: 'test-only', merchantProfile: null },
      authenticatedRequest: (...args) => requestJson(...args),
      setMerchantProfile: profile => synced.push(profile),
    }) },
  })
  const api = load('src/lib/api.ts')
  requestJson = api.requestJson
  return { ...api, synced, profile: load('src/composables/useMerchantProfile.ts').useMerchantProfile() }
}

function respond(t, status, payload) {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(payload), {
    status, headers: { 'Content-Type': 'application/json' },
  }))
}

test('missing profiles are a normal empty state for object and legacy array error payloads', async t => {
  for (const errors of [{ code: 'MERCHANT_PROFILE_NOT_FOUND' }, [{ code: 'MERCHANT_PROFILE_NOT_FOUND' }]]) {
    respond(t, 404, { message: 'Merchant profile not found.', data: null, errors })
    const harness = createHarness()
    assert.equal(await harness.profile.loadProfile(), null)
    assert.equal(harness.profile.errorMessage.value, null)
    assert.equal(harness.profile.isLoading.value, false)
    assert.deepEqual(harness.synced, [null])
  }
})

test('structured error codes and retryability survive parsing', async t => {
  respond(t, 503, { errors: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Try again later.', retryable: true } })
  const { requestJson, ApiError } = createHarness()
  await assert.rejects(requestJson('/test'), error => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.code, 'TEMPORARILY_UNAVAILABLE')
    assert.equal(error.retryable, true)
    assert.equal(error.status, 503)
    assert.equal(error.message, 'Try again later.')
    return true
  })
})

test('unrelated 404, authorization, network, and server failures remain visible', async t => {
  for (const [status, message, errors] of [
    [404, 'Endpoint not found.', { code: 'ROUTE_NOT_FOUND' }],
    [401, 'Please sign in again.', { code: 'SESSION_EXPIRED' }],
    [403, 'Access denied.', { code: 'FORBIDDEN' }],
    [503, 'Service unavailable.', { code: 'TEMPORARILY_UNAVAILABLE' }],
    [404, 'Merchant profile not found.', null],
  ]) {
    respond(t, status, { message, errors })
    const { profile, synced } = createHarness()
    await profile.loadProfile()
    assert.equal(profile.errorMessage.value, message)
    assert.deepEqual(synced, [])
  }
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Failed to fetch') })
  const { profile } = createHarness()
  await profile.loadProfile()
  assert.equal(profile.errorMessage.value, 'Failed to fetch')
})

test('save failures are not suppressed even when they use the missing-profile code', async t => {
  respond(t, 404, { message: 'Merchant profile not found.', errors: { code: 'MERCHANT_PROFILE_NOT_FOUND' } })
  const { profile } = createHarness()
  assert.equal(await profile.saveProfile({ profile_type: 'creator', display_name: 'Example' }), null)
  assert.equal(profile.errorMessage.value, 'Merchant profile not found.')
  assert.equal(profile.isBusy.value, false)
})

test('empty and absent error details fall back safely to the HTTP status', async t => {
  for (const errors of [null, [], undefined]) {
    respond(t, 500, { errors })
    const { requestJson } = createHarness()
    await assert.rejects(requestJson('/test'), /Request failed with status 500/)
  }
})
