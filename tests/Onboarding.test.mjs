import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { vue, createSourceLoader, renderer, node, findAll, byClass, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const load = createSourceLoader({ '../../config': { getNudgerConfig: () => ({ profileImageSourceMaxBytes: 10 * 1024 * 1024 }) } })
const ChoiceCards = load('src/components/ui/ChoiceCards.vue').default
const AvatarPicker = load('src/components/ui/AvatarPicker.vue').default
const Setup = load('src/components/profile/MerchantProfileSetup.vue').default
const { PROFILE_TYPE_OPTIONS } = load('src/data/merchantProfile.ts')
const text = root => [root.text, ...root.children.map(text)].join(' ')
const flush = async () => { await vue.nextTick(); await Promise.resolve(); await vue.nextTick() }
const file = (name = 'private-file-name.png', type = 'image/png') => new File(['image'], name, { type })
const selectedFiles = root => findAll(root, el => el.props.type === 'file')[0]
const pick = (root, nextFile) => selectedFiles(root).props.onChange({ target: { files: nextFile ? [nextFile] : [], value: 'native-value' } })

function mount(Component, initial, handlers = {}, validation = { valid: true }) {
  const props = vue.reactive(initial)
  const root = node('root')
  const focusCalls = []
  const app = renderer.createApp({ setup: () => () => vue.h(Component, { ...props, ...handlers }) })
  registerVuetifyStubs(app)
  app.component('VForm', {
    setup(_props, { attrs, slots, expose }) {
      expose({ validate: async () => validation })
      return () => vue.h('form', attrs, slots.default?.())
    },
  })
  app.component('VTextField', {
    props: ['modelValue'], emits: ['update:modelValue'],
    setup(props, { attrs, emit, expose }) {
      expose({ focus: () => focusCalls.push(attrs.name) })
      return () => vue.h('input', { ...attrs, value: props.modelValue, onInput: value => emit('update:modelValue', value) })
    },
  })
  app.component('VTextarea', {
    props: ['modelValue'], emits: ['update:modelValue'],
    setup(props, { attrs, emit }) {
      return () => vue.h('textarea', { ...attrs, value: props.modelValue, onInput: value => emit('update:modelValue', value) })
    },
  })
  for (const name of ['VProgressCircular', 'VProgressLinear', 'VCard', 'VAvatar', 'VImg', 'VDivider', 'VAlert']) {
    app.component(name, (props, { slots }) => vue.h('div', props, slots.default?.()))
  }
  app.mount(root)
  return { root, props, focusCalls, dispose: () => app.unmount() }
}

test('account types explain permissions and select with native labelled radio inputs', async () => {
  let harness
  const events = []
  harness = mount(ChoiceCards, { modelValue: 'creator', items: PROFILE_TYPE_OPTIONS, label: 'Account type' }, {
    'onUpdate:modelValue': value => { events.push(value); harness.props.modelValue = value },
  })
  try {
    assert.match(text(harness.root), /social media creators and influencers/)
    assert.match(text(harness.root), /Transactional notifications to specific users/)
    const radios = findAll(harness.root, el => el.props.type === 'radio')
    assert.equal(radios.length, 2)
    assert.equal(radios[0].props.checked, true)
    assert.ok(radios.every(el => el.props['aria-labelledby'] && el.props['aria-describedby']))
    radios[1].props.onChange()
    await flush()
    assert.equal(radios[1].props.checked, true)
    assert.deepEqual(events, ['platform'])
    harness.props.isDisabled = true
    await flush()
    radios[0].props.onChange()
    assert.deepEqual(events, ['platform'])
  } finally { harness.dispose() }
})

test('avatar previews and releases selected images without showing file metadata', async t => {
  const created = [], revoked = []
  t.mock.method(URL, 'createObjectURL', blob => { created.push(blob); return `blob:preview-${created.length}` })
  t.mock.method(URL, 'revokeObjectURL', url => revoked.push(url))
  let harness
  harness = mount(AvatarPicker, { modelValue: null, label: 'Profile image', maxBytes: 1024, initials: 'N' }, {
    'onUpdate:modelValue': value => { harness.props.modelValue = value },
  })
  try {
    assert.equal(byClass(harness.root, 'ui-avatar-picker__button')[0].props['aria-label'], 'Upload profile image')
    pick(harness.root, file())
    await flush()
    assert.equal(findAll(harness.root, el => el.type === 'img')[0].props.src, 'blob:preview-1')
    assert.equal(byClass(harness.root, 'ui-avatar-picker__button')[0].props['aria-label'], 'Change profile image')
    assert.doesNotMatch(text(harness.root), /private-file-name|\bKB\b|\bMB\b/)
    pick(harness.root, file('replacement.webp', 'image/webp'))
    await flush()
    assert.deepEqual(revoked, ['blob:preview-1'])
    pick(harness.root, null)
    await flush()
    assert.equal(created.length, 2, 'cancelling selection keeps the existing preview')
  } finally { harness.dispose() }
  assert.deepEqual(revoked, ['blob:preview-1', 'blob:preview-2'])
})

test('invalid, oversized, and corrupt images show errors and can be replaced', async () => {
  let harness
  harness = mount(AvatarPicker, { modelValue: null, label: 'Profile image', maxBytes: 10 * 1024 * 1024 }, {
    'onUpdate:modelValue': value => { harness.props.modelValue = value },
  })
  try {
    pick(harness.root, file('notes.txt', 'text/plain'))
    await flush()
    assert.match(text(harness.root), /Choose an image such as/)
    assert.equal(harness.props.modelValue, null)
    pick(harness.root, { type: 'image/png', size: 11 * 1024 * 1024 })
    await flush()
    assert.match(text(harness.root), /smaller than 10 MB/)
    pick(harness.root, file())
    await flush()
    findAll(harness.root, el => el.type === 'img')[0].props.onError()
    await flush()
    assert.equal(harness.props.modelValue, null)
    assert.match(text(harness.root), /could not be read/)
    pick(harness.root, file('valid.png'))
    await flush()
    assert.equal(byClass(harness.root, 'ui-avatar-picker__error')[0].text, '')
    assert.equal(findAll(harness.root, el => el.type === 'img').length, 1)
    pick(harness.root, file('invalid-replacement.txt', 'text/plain'))
    await flush()
    assert.equal(harness.props.modelValue, null, 'a rejected replacement cannot silently submit the previous file')
    assert.match(text(harness.root), /Choose an image such as/)
  } finally { harness.dispose() }
})

test('the avatar supports an existing image and cannot change while busy', async () => {
  const events = []
  const harness = mount(AvatarPicker, { modelValue: null, label: 'Profile image', src: '/existing.webp', maxBytes: 1024, isBusy: true }, {
    'onUpdate:modelValue': value => events.push(value),
  })
  try {
    assert.equal(findAll(harness.root, el => el.type === 'img')[0].props.src, '/existing.webp')
    assert.equal(byClass(harness.root, 'ui-avatar-picker__button')[0].props.disabled, true)
    pick(harness.root, file())
    assert.deepEqual(events, [])
    assert.match(text(harness.root), /Preparing and uploading/)
  } finally { harness.dispose() }
})

test('onboarding validates required fields before emitting a create request', async () => {
  const events = []
  const harness = mount(Setup, { isBusy: false, uploadProgress: 0 }, { onSubmit: (...args) => events.push(args) }, { valid: false })
  try {
    await findAll(harness.root, el => el.type === 'form')[0].props.onSubmit({ preventDefault() {} })
    assert.deepEqual(events, [])
    assert.match(text(harness.root), /Add a profile image to continue/)
    assert.deepEqual(harness.focusCalls, ['display_name'])
  } finally { harness.dispose() }
})

test('onboarding emits the existing contract, keeps values while busy, and supports retry', async () => {
  const events = []
  const harness = mount(Setup, { isBusy: false, uploadProgress: 0 }, { onSubmit: (...args) => events.push(args) })
  try {
    findAll(harness.root, el => el.props.name === 'display_name')[0].props.onInput('  Example app  ')
    findAll(harness.root, el => el.props.name === 'about')[0].props.onInput('  Practical updates for busy teams.  ')
    findAll(harness.root, el => el.props.name === 'website_url')[0].props.onInput('  https://example.com  ')
    findAll(harness.root, el => el.props.type === 'radio' && el.props.value === 'platform')[0].props.onChange()
    const chosen = file()
    pick(harness.root, chosen)
    await flush()
    const submit = () => findAll(harness.root, el => el.type === 'form')[0].props.onSubmit({ preventDefault() {} })
    await submit()
    assert.equal(events.length, 1)
    assert.deepEqual(events[0], [{ profile_type: 'platform', display_name: 'Example app', about: 'Practical updates for busy teams.', website_url: 'https://example.com', instagram_url: undefined, youtube_url: undefined, facebook_url: undefined, linkedin_url: undefined, x_url: undefined }, chosen])
    harness.props.isBusy = true
    harness.props.uploadProgress = 50
    await flush()
    await submit()
    assert.equal(events.length, 1)
    assert.match(text(harness.root), /Uploading image… 50%/)
    harness.props.isBusy = false
    await flush()
    await submit()
    assert.deepEqual(events[1], events[0], 'a failed save can retry without losing the selected file or form values')
  } finally { harness.dispose() }
})

test('the new setup form is gated to onboarding and does not replace profile or pending views', () => {
  const source = readFileSync(new URL('../src/components/profile/MerchantProfileManager.vue', import.meta.url), 'utf8')
  assert.match(source, /<MerchantProfileSetup v-else-if="isOnboarding"/)
  assert.match(source, /<MerchantProfileDetails\s+v-if="mode === 'profile' && profile && !isEditing"/)
  assert.match(source, /<v-card v-else-if="profile && !isEditing" class="surface-card profile-card"/)
  assert.match(source, /<v-form v-else ref="formRef" class="profile-form"/)
  assert.match(source, /await router.push\(saved.is_active \? '\/audience' : '\/pending'\)/)
})
