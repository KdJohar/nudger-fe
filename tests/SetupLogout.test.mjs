import test from 'node:test'
import assert from 'node:assert/strict'
import { vue, createSourceLoader, renderer, node, findAll, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const flush = async () => { await vue.nextTick(); await Promise.resolve(); await vue.nextTick() }
const logoutButton = root => findAll(root, el => el.type === 'button' && el.props['aria-label'] === 'Log out')[0]

async function mount(t, mode) {
  const previousWindow = globalThis.window
  const storage = new Map()
  globalThis.window = { localStorage: {
    setItem: (key, value) => storage.set(key, value),
    getItem: key => storage.get(key) ?? null,
    removeItem: key => storage.delete(key),
  } }
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  })
  const requests = [], navigation = []
  let finishLogout, failLogout, auth
  const isBusy = vue.ref(false)
  const merchant = mode === 'onboarding' ? null : { display_name: 'Example', profile_type: 'creator', nudger_id: 'example', is_active: false }
  const config = { getNudgerConfig: () => ({ profileImageSourceMaxBytes: 10 * 1024 * 1024 }) }
  const load = createSourceLoader({
    '../config': config,
    '../../config': config,
    '../lib/api': {
      ApiError: class extends Error {},
      requestJson: async (path, init, token) => {
        if (path === '/v1/app-identity/google/exchange') return { data: { user: { name: 'Example' }, merchant_profile: merchant, auth: { access_token: 'test-access', refresh_token: 'test-refresh' } } }
        requests.push({ path, init, token })
        return new Promise((resolve, reject) => { finishLogout = resolve; failLogout = reject })
      },
    },
    'vue-router': { useRouter: () => ({
      replace: async path => {
        assert.equal(auth.isAuthenticated.value, false, 'clear the session before navigating')
        navigation.push(path)
      },
      push() { throw new Error('Logout must replace, not push, the setup route') },
    }) },
    '../../composables/useMerchantProfile': { useMerchantProfile: () => ({
      profile: vue.ref(merchant), isLoading: vue.ref(false), isBusy, isUpdatingDetails: vue.ref(false), uploadProgress: vue.ref(0), errorMessage: vue.ref(null),
      loadProfile: async () => merchant,
      saveProfile() { throw new Error('Logout must never submit the form') },
      updateProfileDetails() { throw new Error('Logout must never update public details') },
      updateProfileImage() { throw new Error('Logout must never change an image') },
    }) },
  })
  auth = load('src/composables/useAuth.ts').useAuth()
  await auth.completeGoogleLogin('test-handoff')
  const Manager = load('src/components/profile/MerchantProfileManager.vue').default
  const root = node('root')
  const app = renderer.createApp({ setup: () => () => vue.h(Manager, { mode }) })
  registerVuetifyStubs(app)
  for (const name of ['VCard', 'VAvatar', 'VImg', 'VDivider', 'VAlert', 'VProgressCircular', 'VProgressLinear', 'VFileInput', 'VRadio', 'VRadioGroup', 'VTextField', 'VCol', 'VRow', 'VForm']) {
    app.component(name, (props, { slots }) => vue.h(name, props, slots.default?.()))
  }
  app.mount(root)
  t.after(() => app.unmount())
  await flush()
  return { root, auth, storage, requests, navigation, isBusy, finish: () => finishLogout(null), fail: () => failLogout(new Error('Server unavailable')) }
}

for (const mode of ['onboarding', 'pending']) {
  for (const outcome of ['success', 'failure']) {
    test(`${mode} logout clears the session and returns to login after server ${outcome}`, async t => {
      const harness = await mount(t, mode)
      const button = logoutButton(harness.root)
      assert.equal(button.props.type, 'button')
      assert.equal(button.props.size, '48')
      assert.equal(button.props.title, 'Log out')
      const first = button.props.onClick()
      const repeated = button.props.onClick()
      await flush()
      assert.equal(logoutButton(harness.root).props.disabled, true)
      assert.equal(logoutButton(harness.root).props.loading, true)
      assert.equal(logoutButton(harness.root).props['aria-busy'], true)
      assert.deepEqual(harness.navigation, [])
      assert.deepEqual(harness.requests, [{ path: '/v1/app-identity/logout', init: { method: 'POST' }, token: 'test-access' }])
      outcome === 'success' ? harness.finish() : harness.fail()
      await Promise.all([first, repeated])
      await flush()
      assert.equal(harness.auth.state.user, null)
      assert.equal(harness.auth.state.accessToken, null)
      assert.equal(harness.auth.state.merchantProfile, null)
      assert.equal(harness.storage.has('nudger.refresh_token'), false)
      assert.deepEqual(harness.navigation, ['/login'])
    })
  }
}

test('logout waits for an in-flight profile save', async t => {
  const harness = await mount(t, 'pending')
  harness.isBusy.value = true
  await flush()
  const button = logoutButton(harness.root)
  assert.equal(button.props.disabled, true)
  assert.equal(button.props.title, 'Wait for your profile to finish saving')
  await button.props.onClick()
  assert.deepEqual(harness.requests, [])
  harness.isBusy.value = false
  await flush()
  assert.equal(logoutButton(harness.root).props.disabled, false)
})

test('workspace profile gets no duplicate logout icon', async t => {
  const workspace = await mount(t, 'profile')
  assert.equal(logoutButton(workspace.root), undefined)
})
