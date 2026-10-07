import test from 'node:test'
import assert from 'node:assert/strict'
import { vue, createSourceLoader, renderer, node, findAll, byClass, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const text = root => [root.text, ...root.children.map(text)].join(' ')
const flush = async () => { await vue.nextTick(); await vue.nextTick() }

test('profile shares header chips, hides transactional for creators, and cleans up on navigation', async () => {
  const state = vue.reactive({ merchantProfile: { profile_type: 'platform', is_active: true } })
  const preference = vue.ref('system'), calls = []
  const source = createSourceLoader({
    vuetify: { useDisplay: () => ({ smAndDown: vue.ref(true) }) },
    '../composables/useAuth': { useAuth: () => ({ state }) },
    '../components/profile/MerchantProfileManager.vue': { default: () => vue.h('section', 'Public profile fixture') },
    '../../composables/useAppTheme': { useAppTheme: () => ({ preference, setTheme: value => { preference.value = value; calls.push(value) } }) },
  })
  const Layout = source('src/components/ui/PageLayout.vue').default, Profile = source('src/views/ProfileView.vue').default
  const { WORKSPACE_PAGES } = source('src/data/workspacePages.ts'), route = vue.ref('profile')
  const root = node('root'), app = renderer.createApp({ setup: () => () => vue.h(Layout, { pageKey: route.value, definition: WORKSPACE_PAGES[route.value] }, { default: () => route.value === 'profile' ? vue.h(Profile) : vue.h('article') }) })
  registerVuetifyStubs(app); app.mount(root)
  try {
    await flush()
    const header = byClass(root, 'header')[0], actions = byClass(root, 'header__actions')[0]
    assert.match(text(actions), /Platform.*Broadcast.*Transactional.*Active/)
    assert.equal(findAll(actions, el => ['button', 'input'].includes(el.type)).length, 0)
    const radios = findAll(root, el => el.props.type === 'radio')
    assert.deepEqual(radios.map(el => el.props.value), ['light', 'dark', 'system'])
    assert.equal(radios[2].props.checked, true)
    assert.ok(radios.every(el => el.props['aria-describedby'] === undefined))
    radios[0].props.onChange(); await flush(); assert.equal(radios[0].props.checked, true); assert.deepEqual(calls, ['light'])
    state.merchantProfile = { profile_type: 'creator', is_active: false }; await flush()
    assert.match(text(actions), /Creator.*Broadcast.*Pending review/); assert.doesNotMatch(text(actions), /Transactional/)
    assert.equal(byClass(root, 'header')[0], header)
    route.value = 'token'; await flush(); assert.equal(byClass(root, 'header')[0], header)
    assert.match(text(actions), /Platform only/); assert.doesNotMatch(text(actions), /Creator|Broadcast|Pending review/)
  } finally { app.unmount() }
})

test('public identity, about and links render in one card without an account-type panel', () => {
  const Component = createSourceLoader({ 'vue-router': { onBeforeRouteLeave() {} } })('src/components/profile/MerchantProfileDetails.vue').default
  const root = node('root'), app = renderer.createApp({ setup: () => () => vue.h(Component, {
    profile: { display_name: 'Studio Notes', nudger_id: 'studio', profile_type: 'platform', about: 'Updates worth reading', website_url: 'https://example.test' },
    imageFile: null, maxImageBytes: 1024, isBusy: false, isDisabled: false, uploadProgress: 0,
    saveDetails: () => { throw new Error('Rendering must not save') },
  }) })
  registerVuetifyStubs(app)
  for (const name of ['VProgressLinear', 'VProgressCircular']) app.component(name, props => vue.h('span', props))
  app.mount(root)
  try {
    assert.equal(byClass(root, 'ui-detail-card').length, 1)
    assert.equal(findAll(root, el => el.type === 'h2').length, 1)
    assert.match(text(root), /Public profile.*Studio Notes.*Updates worth reading.*Website/)
    assert.doesNotMatch(text(root), /Account type|chosen during setup|About & links|Public identity/)
    assert.equal(byClass(root, 'ui-avatar-picker').length, 1)
    assert.equal(findAll(root, el => el.type === 'input' && el.props.type !== 'file').length, 0)
  } finally { app.unmount() }
})
