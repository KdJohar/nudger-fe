import test from 'node:test'
import assert from 'node:assert/strict'
import { vue, createSourceLoader, renderer, node, findAll, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const load = createSourceLoader()
const { profileDetailsDraft, profileDetailsPatch, validateProfileDetails, latestProfile } = load('src/lib/profileDetails.ts')
const fixture = { id: 'fixture', user_id: 'owner', display_name: 'Keep my name', nudger_id: 'keep-handle', profile_type: 'creator', about: 'Before', website_url: 'https://example.test/', updated_at: '2026-10-07T12:00:00.000001Z' }
const flush = async () => { await vue.nextTick(); await Promise.resolve(); await vue.nextTick() }

test('draft is isolated and PATCH sends only changed fields with null removals', () => {
  const saved = profileDetailsDraft(fixture), draft = { ...saved, about: ' New description ', website_url: ' ' }
  assert.deepEqual(profileDetailsPatch(draft, saved), { about: 'New description', website_url: null })
  assert.equal(fixture.about, 'Before')
  assert.deepEqual(profileDetailsPatch(saved, saved), {})
  assert.equal('display_name' in saved, false)
})

test('validation matches Unicode limit, requires full web URLs, and permits clearing', () => {
  const draft = profileDetailsDraft(fixture)
  draft.about = '😼'.repeat(500)
  assert.deepEqual(validateProfileDetails(draft), {})
  draft.about += 'a'
  draft.website_url = 'javascript:alert(1)'
  assert.deepEqual(Object.keys(validateProfileDetails(draft)).sort(), ['about', 'website_url'])
  for (const url of ['example.com', 'ftp://example.com', 'https://']) {
    draft.website_url = url
    assert.ok(validateProfileDetails(draft).website_url)
  }
  draft.about = ' '; draft.website_url = ''
  assert.deepEqual(validateProfileDetails(draft), {})
})

test('older session responses cannot replace a newer profile, even within a millisecond', () => {
  const newer = { ...fixture, about: 'Latest', updated_at: '2026-10-07T12:00:00.000002+00:00' }
  assert.equal(latestProfile(newer, fixture), newer)
  assert.equal(latestProfile(fixture, newer), newer)
  assert.equal(latestProfile(newer, { ...fixture, id: 'another-owner' }).id, 'another-owner')
})

function mountEditor(t) {
  const listeners = new Map()
  const originalWindow = globalThis.window
  globalThis.window = { addEventListener: (event, callback) => listeners.set(event, callback), removeEventListener: event => listeners.delete(event), confirm: () => false }
  let routeGuard, finish, fail
  const calls = [], saved = [], cancelled = []
  const source = createSourceLoader({ 'vue-router': { onBeforeRouteLeave: callback => { routeGuard = callback } } })
  const Component = source('src/components/profile/MerchantProfileEditor.vue').default
  const root = node('root')
  const app = renderer.createApp({ setup: () => () => vue.h(Component, {
    profile: fixture, isDisabled: false,
    saveDetails: payload => { calls.push(payload); return new Promise((resolve, reject) => { finish = resolve; fail = reject }) },
    onSaved: () => saved.push(true), onCancel: () => cancelled.push(true),
  }) })
  registerVuetifyStubs(app)
  for (const control of ['VTextField', 'VTextarea']) {
    app.component(control, { props: ['modelValue', 'label', 'errorMessages'], emits: ['update:modelValue'], setup: (props, { attrs, emit }) => () => vue.h('input', { ...attrs, value: props.modelValue, 'aria-label': props.label, errors: props.errorMessages, onInput: value => emit('update:modelValue', value) }) })
  }
  app.mount(root)
  const form = findAll(root, element => element.type === 'form')[0]
  form.querySelector = () => ({ focus() {} })
  const field = name => findAll(root, element => element.props.name === name)[0]
  const submit = () => form.props.onSubmit({ preventDefault() {} })
  const dispose = () => app.unmount()
  t.after(() => { dispose(); globalThis.window = originalWindow })
  return { root, calls, saved, cancelled, listeners, field, submit, guard: () => routeGuard(), finish: value => finish(value), fail: error => fail(error), dispose }
}

test('editor validates before sending and blocks unsaved navigation', async t => {
  const app = mountEditor(t)
  app.field('website_url').props.onInput('javascript:alert(1)')
  await flush(); await app.submit()
  assert.equal(app.calls.length, 0)
  assert.match(app.field('website_url').props.errors, /complete link/)
  assert.equal(app.guard(), false)
  let prevented = false
  app.listeners.get('beforeunload')({ preventDefault: () => { prevented = true } })
  assert.equal(prevented, true)
})

test('editor preserves drafts on failure, prevents duplicate saves and retries successfully', async t => {
  const app = mountEditor(t)
  app.field('about').props.onInput('Updated about')
  app.field('website_url').props.onInput('')
  await flush()
  const first = app.submit()
  await app.submit()
  assert.deepEqual(app.calls, [{ about: 'Updated about', website_url: null }])
  assert.equal(app.guard(), false)
  app.fail({ message: 'Cache synchronization pending. Retry.', fieldErrors: {} })
  await first; await flush()
  assert.equal(app.saved.length, 0)
  assert.equal(app.field('about').props.value, 'Updated about')
  const second = app.submit()
  app.finish({ ...fixture, about: 'Updated about', website_url: null })
  await second; await flush()
  assert.equal(app.saved.length, 1)
  assert.equal(app.guard(), true)
  app.dispose()
  assert.equal(app.listeners.size, 0)
})

test('profile details action uses PATCH and synchronizes shared profile state after success', async () => {
  const state = vue.reactive({ accessToken: 'fixture', merchantProfile: fixture })
  const calls = []
  const loader = createSourceLoader({
    '../lib/profileImages': {},
    './useAuth': { useAuth: () => ({ state, setMerchantProfile: profile => { state.merchantProfile = profile }, authenticatedRequest: async (path, options) => {
      calls.push({ path, ...options })
      return { data: { ...fixture, about: 'Saved', updated_at: '2026-10-07T12:00:01Z' } }
    } }) },
  })
  const profile = loader('src/composables/useMerchantProfile.ts').useMerchantProfile()
  await profile.updateProfileDetails({ about: 'Saved' })
  assert.equal(calls[0].method, 'PATCH')
  assert.equal(calls[0].path, '/v1/app-nudger/profile')
  assert.deepEqual(JSON.parse(calls[0].body), { about: 'Saved' })
  assert.equal(state.merchantProfile.about, 'Saved')
  assert.equal(profile.isBusy.value, false)
  assert.equal(profile.isUpdatingDetails.value, false)
})
