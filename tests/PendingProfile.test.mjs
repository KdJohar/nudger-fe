import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { vue, createSourceLoader, renderer, node, findAll, byClass, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const flush = async () => { await vue.nextTick(); await Promise.resolve(); await vue.nextTick() }
const text = root => [root.text, ...root.children.map(text)].join(' ')
const image = root => findAll(root, el => el.type === 'img')[0]
const picker = root => byClass(root, 'ui-avatar-picker__button')[0]
const pick = (root, file) => findAll(root, el => el.props.type === 'file')[0].props.onChange({ target: { files: file ? [file] : [], value: '' } })
const makeFile = () => new File(['image'], 'private-image-name.png', { type: 'image/png' })

function mount(mode = 'pending', src = '/saved.webp') {
  const profile = vue.ref({ display_name: 'Example creator', nudger_id: 'example', profile_type: 'creator', profile_image_url: src, is_active: false })
  const isBusy = vue.ref(false), errorMessage = vue.ref(null), calls = []
  let finish
  const load = createSourceLoader({
    '../../composables/useAuth': { useAuth: () => ({ logout: async () => {} }) },
    'vue-router': { useRouter: () => ({ push() { throw new Error('Image replacement must not navigate') } }) },
    '../../config': { getNudgerConfig: () => ({ profileImageSourceMaxBytes: 1024 }) },
    '../../composables/useMerchantProfile': { useMerchantProfile: () => ({
      profile, isBusy, isUpdatingDetails: vue.ref(false), errorMessage, isLoading: vue.ref(false), uploadProgress: vue.ref(0),
      loadProfile: async () => profile.value,
      saveProfile() { throw new Error('Image replacement must not save profile details') },
      updateProfileDetails() { throw new Error('Image replacement must not update profile details') },
      updateProfileImage(file) {
        calls.push(file)
        isBusy.value = true
        errorMessage.value = null
        return new Promise(resolve => {
          finish = saved => {
            if (saved) profile.value = saved
            else errorMessage.value = 'Unable to update the profile image. Please try again.'
            isBusy.value = false
            resolve(saved)
          }
        })
      },
    }) },
  })
  const Manager = load('src/components/profile/MerchantProfileManager.vue').default
  const root = node('root')
  const app = renderer.createApp({ setup: () => () => vue.h(Manager, { mode }) })
  const snackbar = registerVuetifyStubs(app)
  for (const name of ['VCard', 'VAvatar', 'VImg', 'VDivider', 'VAlert', 'VProgressCircular', 'VProgressLinear', 'VFileInput', 'VRadio', 'VRadioGroup', 'VTextField', 'VCol', 'VRow', 'VForm']) {
    app.component(name, (props, { slots }) => vue.h(name, props, slots.default?.()))
  }
  app.mount(root)
  return { root, calls, profile, snackbar, finish: value => finish(value), dispose: () => app.unmount() }
}

test('pending and profile share one avatar picker without file metadata inputs', async () => {
  const pending = mount(), saved = mount('profile')
  try {
    await flush()
    assert.equal(image(pending.root).props.src, '/saved.webp')
    assert.equal(picker(pending.root).props['aria-label'], 'Change profile image')
    assert.equal(findAll(pending.root, el => el.type === 'VFileInput').length, 0)
    assert.equal(byClass(saved.root, 'ui-avatar-picker').length, 1)
    assert.equal(image(saved.root).props.src, '/saved.webp')
    assert.equal(findAll(saved.root, el => el.type === 'VFileInput').length, 0)
    assert.doesNotMatch(text(pending.root), /WebP images up to|Choose a new image/)
  } finally { pending.dispose(); saved.dispose() }
})

for (const mode of ['pending', 'profile']) {
test(`${mode} previews during upload, prevents duplicates, and switches to the saved image`, async t => {
  const revoked = []
  t.mock.method(URL, 'createObjectURL', () => 'blob:pending-preview')
  t.mock.method(URL, 'revokeObjectURL', url => revoked.push(url))
  const harness = mount(mode)
  try {
    await flush()
    const file = makeFile()
    pick(harness.root, file)
    await flush()
    assert.deepEqual(harness.calls, [file])
    assert.equal(image(harness.root).props.src, 'blob:pending-preview')
    assert.equal(picker(harness.root).props.disabled, true)
    assert.match(text(harness.root), /Preparing and uploading/)
    assert.doesNotMatch(text(harness.root), /private-image-name|\bKB\b|\bMB\b/)
    pick(harness.root, makeFile())
    assert.equal(harness.calls.length, 1)
    harness.finish({ ...harness.profile.value, profile_image_url: '/updated.webp' })
    await flush()
    assert.equal(image(harness.root).props.src, '/updated.webp')
    assert.equal(picker(harness.root).props.disabled, false)
    assert.match(harness.snackbar.current.value.message, /Profile image updated/)
    assert.equal(harness.snackbar.current.value.tone, 'success')
    assert.deepEqual(revoked, ['blob:pending-preview'])
  } finally { harness.dispose() }
})

test(`${mode} failed image uploads restore the previous image and allow retry`, async () => {
  const harness = mount(mode)
  try {
    await flush()
    const file = makeFile()
    pick(harness.root, file)
    await flush()
    harness.finish(null)
    await flush()
    assert.equal(image(harness.root).props.src, '/saved.webp')
    assert.equal(picker(harness.root).props.disabled, false)
    assert.match(harness.snackbar.current.value.message, /Unable to update the profile image/)
    assert.equal(harness.snackbar.current.value.tone, 'error')
    assert.doesNotMatch(text(harness.root), /Profile image updated/)
    pick(harness.root, file)
    await flush()
    assert.equal(harness.calls.length, 2)
    harness.finish({ ...harness.profile.value, profile_image_url: '/retry.webp' })
    await flush()
    assert.equal(image(harness.root).props.src, '/retry.webp')
  } finally { harness.dispose() }
})

test(`${mode} shows initials without an image and never uploads cancelled or invalid selections`, async () => {
  const harness = mount(mode, null)
  try {
    await flush()
    assert.equal(byClass(harness.root, 'ui-avatar-picker__initials')[0].text, 'E')
    assert.equal(picker(harness.root).props['aria-label'], 'Upload profile image')
    pick(harness.root, null)
    pick(harness.root, new File(['text'], 'notes.txt', { type: 'text/plain' }))
    await flush()
    assert.match(text(harness.root), /Choose an image such as/)
    pick(harness.root, { type: 'image/png', size: 2048 })
    await flush()
    assert.match(text(harness.root), /Choose an image smaller than/)
    assert.equal(picker(harness.root).props['aria-invalid'], true)
    assert.equal(harness.calls.length, 0)
  } finally { harness.dispose() }
})
}

test('profile body leaves account capabilities to the shared header and keeps identity read-only', async () => {
  const harness = mount('profile')
  try {
    await flush()
    assert.match(text(harness.root), /Public profile/)
    assert.match(text(harness.root), /Display name and handle are read-only/)
    assert.doesNotMatch(text(harness.root), /Account type|chosen during setup|Creator accounts send/)
    assert.equal(findAll(harness.root, el => el.type === 'h1').length, 0, 'the workspace owns the page heading')
    assert.equal(findAll(harness.root, el => el.props.type === 'radio').length, 0)
    harness.profile.value = { ...harness.profile.value, profile_type: 'platform' }
    await flush()
    assert.doesNotMatch(text(harness.root), /For organisations|Transactional nudges|specific user/)
    assert.equal(findAll(harness.root, el => el.props.type === 'radio').length, 0)
  } finally { harness.dispose() }
})

test('an image upload finishing after leaving the profile does not publish stale success', async () => {
  const harness = mount('profile')
  await flush()
  pick(harness.root, makeFile())
  await flush()
  harness.dispose()
  harness.finish({ ...harness.profile.value, profile_image_url: '/late.webp' })
  await flush()
  assert.equal(harness.snackbar.current.value, null)
})

test('profile handles empty and long public links and keeps non-web URLs non-interactive', async () => {
  const harness = mount('profile')
  try {
    await flush()
    assert.match(text(harness.root), /No public links yet/)
    harness.profile.value = { ...harness.profile.value, website_url: 'https://example.com/' + 'long-path-'.repeat(30), instagram_url: 'javascript:alert(1)', youtube_url: 'not-a-url' }
    await flush()
    const links = findAll(harness.root, el => el.type === 'a')
    assert.equal(links.length, 1)
    assert.match(links[0].props.href, /^https:\/\/example.com/)
    assert.equal(links[0].props.target, '_blank')
    assert.equal(links[0].props.rel, 'noopener noreferrer')
    assert.match(text(harness.root), /Instagram/)
    assert.match(text(harness.root), /not-a-url/)
    assert.equal(harness.calls.length, 0)
  } finally { harness.dispose() }
})

test('logo containers have no added fill and the shared camera button stays visible', () => {
  const css = readFileSync(new URL('../src/styles/main.css', import.meta.url), 'utf8')
  for (const selector of ['.ui-avatar-picker__button', '.ui-avatar-picker__avatar', '.ui-avatar.v-avatar']) {
    const rule = css.split(selector + ' {')[1]?.split('}')[0]
    assert.ok(rule, `Missing ${selector}`)
    assert.match(rule, /background: transparent;/)
  }
  assert.match(css, /\.ui-avatar-picker__camera \{[^}]*background: var\(--app-secondary\)/)
  const manager = readFileSync(new URL('../src/components/profile/MerchantProfileManager.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(manager, /<v-avatar[^>]*color=/)
})
