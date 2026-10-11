import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader, vue, renderer, node, findAll, byClass } from './helpers/vueHarness.mjs'

const Preview = createSourceLoader()('src/components/ui/NotificationPreview.vue').default
const rich = { notification_format: 'rich', media_url: 'https://assets.example.com/tutorial.webp', destination_url: 'https://example.com/tutorial', cta_label: 'watch_now' }
function mount(initial = {}) {
  const props = vue.reactive({ title: 'Studio Notes', message: 'Going live in 15 minutes 🔥', imageUrl: 'https://assets.example.com/avatar.webp', ...initial })
  const root = node('root'), app = renderer.createApp({ setup: () => () => vue.h(Preview, props) })
  app.component('VIcon', attrs => vue.h('i', attrs))
  app.mount(root)
  return { root, props, dispose: () => app.unmount() }
}
const images = root => findAll(root, element => element.type === 'img')
const first = (root, name) => byClass(root, name)[0]

test('notification identity uses merchant avatar and a separate small Nudge badge', () => {
  const h = mount()
  try {
    assert.equal(first(h.root, 'ui-notification-preview__title').text, h.props.title)
    assert.equal(first(h.root, 'ui-notification-preview__message').text, h.props.message)
    assert.equal(images(first(h.root, 'ui-notification-preview__sender'))[0].props.src, h.props.imageUrl)
    assert.equal(images(first(h.root, 'ui-notification-preview__badge'))[0].props.src, '/nudge.png')
    assert.equal(byClass(h.root, 'ui-media').length, 0)
    assert.equal(first(h.root, 'ui-notification-preview__time').text, 'now')
  } finally { h.dispose() }
})

test('Rich media occupies its own content slot; Basic and image-less Rich have no empty thumbnail', async () => {
  const h = mount({ content: { ...rich } })
  try {
    assert.equal(images(first(h.root, 'ui-notification-preview__body'))[0].props.src, rich.media_url)
    assert.equal(images(first(h.root, 'ui-notification-preview__sender'))[0].props.src, h.props.imageUrl)
    for (const content of [{ ...rich, notification_format: 'basic' }, { ...rich, media_url: null }, { ...rich, media_url: 'javascript:alert(1)' }]) {
      h.props.content = content
      await vue.nextTick()
      assert.equal(byClass(h.root, 'ui-media').length, 0)
      assert.equal(first(h.root, 'ui-notification-preview__message').text, h.props.message)
    }
  } finally { h.dispose() }
})

test('avatar and media errors fall back independently and recover on replacement', async () => {
  const h = mount({ content: { ...rich } })
  try {
    const sender = first(h.root, 'ui-notification-preview__sender')
    images(sender)[0].props.onError()
    await vue.nextTick()
    assert.equal(images(sender).length, 1, 'Only Nudge badge remains; sender uses the account fallback')
    assert.equal(images(first(h.root, 'ui-media')).length, 1)
    images(first(h.root, 'ui-media'))[0].props.onError()
    await vue.nextTick()
    assert.equal(byClass(h.root, 'ui-media__fallback').length, 1)
    h.props.imageUrl = 'https://assets.example.com/new-avatar.webp'
    h.props.content.media_url = 'https://assets.example.com/new-thumbnail.webp'
    await vue.nextTick()
    assert.equal(images(sender).length, 2)
    assert.equal(images(first(h.root, 'ui-media'))[0].props.src, h.props.content.media_url)
    h.props.imageUrl = null
    await vue.nextTick()
    assert.equal(images(sender).length, 1)
  } finally { h.dispose() }
})

test('empty drafts have hints; long Unicode/multiline text is preserved and review is not labelled live', async () => {
  const h = mount({ title: ' ', message: '\n' })
  try {
    assert.equal(first(h.root, 'ui-notification-preview__title').text, 'Your profile name')
    assert.match(first(h.root, 'ui-notification-preview__message').text, /as you write/)
    h.props.title = 'A longer merchant name '.repeat(5).trim()
    h.props.message = ('Hello 👋\nA useful update. '.repeat(100)).trim()
    h.props.isLive = false
    await vue.nextTick()
    assert.equal(first(h.root, 'ui-notification-preview__title').props.title, h.props.title)
    assert.equal(first(h.root, 'ui-notification-preview__message').text, h.props.message)
    assert.equal(byClass(h.root, 'ui-notification-preview__live').length, 0)
  } finally { h.dispose() }
})
