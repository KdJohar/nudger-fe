import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader, vue, renderer, node, byClass } from './helpers/vueHarness.mjs'

const load = createSourceLoader()
const DialogFrame = load('src/components/ui/DialogFrame.vue').default
const MessageSummary = load('src/components/ui/MessageSummary.vue').default
const ContentSummary = load('src/components/ui/ContentSummary.vue').default
const rich = { notification_format: 'rich', media_url: 'https://assets.example.com/image.webp', destination_url: 'https://example.com/watch', cta_label: 'watch_now' }

test('dialog frame separates header, labelled keyboard-scroll body and actions, including busy state', async () => {
  const props = vue.reactive({ bodyLabel: 'Broadcast review details', isBusy: false })
  const root = node('root')
  const app = renderer.createApp({ setup: () => () => vue.h(DialogFrame, props, {
    header: () => vue.h('h2', 'Send to your subscribers?'),
    default: () => vue.h(MessageSummary, { message: 'A complete update 👋' }),
    footer: () => vue.h('button', 'Send nudge'),
  }) })
  app.mount(root)
  try {
    const frame = byClass(root, 'ui-dialog')[0]
    const header = byClass(root, 'ui-dialog__header')[0], body = byClass(root, 'ui-dialog__body')[0], footer = byClass(root, 'ui-dialog__footer')[0]
    assert.equal(header.parent, frame)
    assert.equal(body.parent, frame)
    assert.equal(footer.parent, frame)
    assert.equal(header.type, 'header')
    assert.equal(footer.type, 'footer')
    assert.equal(body.props.role, 'region')
    assert.equal(body.props['aria-label'], props.bodyLabel)
    assert.equal(body.props.tabindex, '0')
    assert.equal(byClass(body, 'ui-message-summary__text')[0].text, 'A complete update 👋')
    props.isBusy = true
    await vue.nextTick()
    assert.equal(frame.props['aria-busy'], true)
    assert.equal(byClass(root, 'ui-dialog__body')[0], body, 'Busy state preserves the review scroll owner')
  } finally { app.unmount() }
})

test('shared message summary retains full multiline Unicode text and escapes markup', () => {
  const message = '<b>Literal text</b> 👋\n' + 'x'.repeat(4096)
  const root = node('root'), app = renderer.createApp({ setup: () => () => vue.h(MessageSummary, { message }) })
  app.mount(root)
  try {
    const text = byClass(root, 'ui-message-summary__text')[0]
    assert.equal(text.text, message)
    assert.equal(text.children.length, 0, 'Message is plain text, never HTML')
    assert.equal(byClass(root, 'ui-message-summary__title').length, 0)
  } finally { app.unmount() }
})

test('review suppresses duplicate media while preserving CTA; history media remains on by default', async () => {
  const props = vue.reactive({ content: { ...rich }, isMediaVisible: undefined, isFormatVisible: undefined })
  const root = node('root'), app = renderer.createApp({ setup: () => () => vue.h(ContentSummary, props) })
  app.component('VIcon', attrs => vue.h('i', attrs))
  app.mount(root)
  try {
    assert.equal(byClass(root, 'ui-media').length, 1)
    assert.equal(byClass(root, 'ui-status-tag').length, 1, 'History retains format metadata by default')
    props.isMediaVisible = false
    props.isFormatVisible = false
    await vue.nextTick()
    assert.equal(byClass(root, 'ui-media').length, 0)
    assert.equal(byClass(root, 'ui-status-tag').length, 0)
    assert.equal(byClass(root, 'ui-content-summary__destination')[0].children[0].text, 'Watch now')
    assert.equal(byClass(root, 'ui-content-summary__destination')[0].children[1].text, rich.destination_url)
    props.content.notification_format = 'basic'
    await vue.nextTick()
    assert.equal(byClass(root, 'ui-content-summary').length, 0)
  } finally { app.unmount() }
})
