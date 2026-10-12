import test from 'node:test'
import assert from 'node:assert/strict'
import { vue, createSourceLoader, renderer, node, findAll, byClass, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const isMobile = vue.ref(true)
const loadSource = createSourceLoader({
  vuetify: { useDisplay: () => ({ smAndDown: isMobile }) },
  '../ui/ImageViewer.vue': { default: { props: ['modelValue', 'src', 'alt'], setup: () => () => null } },
})
const NudgeHistoryPanel = loadSource('src/components/nudges/NudgeHistoryPanel.vue').default
const item = (id = 'broadcast-1', type = 'broadcast') => ({
  id, title: 'Example creator', message: 'A short notification.', sender: 'platform', nudge_type: type,
  status: 'completed', created_at: '2026-10-06T09:00:00Z', completed_at: '2026-10-06T09:00:02Z',
  stats: { total_audience: 12, total_devices: 12, delivered_users: 10, muted_users: 1, failed_deliveries: 1 },
})

function mount(overrides = {}) {
  const props = vue.reactive({ items: [], nextLink: null, isLoading: false, isLoadingMore: false, errorMessage: null, ...overrides })
  const events = []
  const root = node('root')
  const app = renderer.createApp({
    setup: () => () => vue.h(NudgeHistoryPanel, { ...props, onRetry: () => events.push('retry'), onLoadMore: () => events.push('loadMore') }),
  })
  const snackbar = registerVuetifyStubs(app)
  for (const name of ['VCard', 'VAlert', 'VAvatar', 'VSkeletonLoader']) {
    app.component(name, (attrs, { slots }) => vue.h('div', { ...attrs, 'data-component': name }, slots.default?.()))
  }
  app.mount(root)
  return { root, props, events, snackbar, dispose: () => app.unmount() }
}
const status = root => findAll(root, element => element.props.role === 'status')[0].text
const pagination = root => findAll(byClass(root, 'ui-record-list__footer')[0], element => element.type === 'button')[0]

test('only initial loading shows skeletons and announces progress', () => {
  const harness = mount({ isLoading: true })
  try {
    assert.equal(findAll(harness.root, element => element.props['data-component'] === 'VSkeletonLoader').length, 5)
    assert.equal(byClass(harness.root, 'ui-record-list__content')[0].props['aria-busy'], true)
    assert.equal(byClass(harness.root, 'empty-state').length, 0)
    assert.equal(status(harness.root), 'Loading nudges.')
  } finally { harness.dispose() }
})

test('filter refresh keeps the exact list and cards mounted rather than collapsing them into skeletons', async () => {
  const harness = mount({ items: [item(), item('broadcast-2')] })
  try {
    const list = byClass(harness.root, 'ui-record-list__content')[0]
    const cards = byClass(harness.root, 'ui-record-card')
    harness.props.isLoading = true
    await vue.nextTick()
    assert.equal(byClass(harness.root, 'ui-record-list__content')[0], list)
    assert.equal(byClass(harness.root, 'ui-record-card')[0], cards[0])
    assert.equal(byClass(harness.root, 'ui-record-card')[1], cards[1])
    assert.equal(byClass(harness.root, 'ui-record-list__loading').length, 0)
    assert.equal(list.props['aria-busy'], true)
    assert.match(status(harness.root), /Updating nudges.*previous results/)
    harness.props.items = [item('transactional-1', 'transactional')]
    harness.props.isLoading = false
    await vue.nextTick()
    assert.equal(byClass(harness.root, 'ui-record-list__content')[0], list)
    assert.equal(byClass(harness.root, 'ui-record-card').length, 1)
    assert.notEqual(byClass(harness.root, 'ui-record-card')[0], cards[0])
    assert.equal(list.props['aria-busy'], false)
    assert.equal(status(harness.root), '1 nudges loaded.')
  } finally { harness.dispose() }
})

test('pagination cannot emit requests while refreshing or appending', async () => {
  const harness = mount({ items: [item()], nextLink: '/next-page' })
  try {
    for (const busyState of [{ isLoading: true }, { isLoadingMore: true }]) {
      Object.assign(harness.props, { isLoading: false, isLoadingMore: false, errorMessage: null }, busyState)
      await vue.nextTick()
      assert.equal(pagination(harness.root).props.disabled, true)
      pagination(harness.root).props.onClick()
      assert.deepEqual(harness.events, [])
    }
    harness.props.isLoadingMore = false
    await vue.nextTick()
    assert.equal(pagination(harness.root).props.disabled, false)
    pagination(harness.root).props.onClick()
    assert.deepEqual(harness.events, ['loadMore'])
  } finally { harness.dispose() }
})

test('failed refresh retains previous cards, explains their state, and allows retry', async () => {
  const harness = mount({ items: [item()], isLoading: true })
  try {
    const card = byClass(harness.root, 'ui-record-card')[0]
    harness.props.isLoading = false
    harness.props.errorMessage = 'Connection unavailable.'
    await vue.nextTick()
    assert.equal(byClass(harness.root, 'ui-record-card')[0], card)
    assert.equal(status(harness.root), '', 'the snackbar owns the error announcement')
    const notice = harness.snackbar.current.value
    assert.match(notice.message, /Still showing previous results/)
    assert.equal(notice.tone, 'error')
    assert.equal(notice.actionText, 'Try again')
    notice.onAction()
    assert.deepEqual(harness.events, ['retry'])
    harness.snackbar.dismiss(notice.id)
    assert.equal(pagination(harness.root).children[0].text, 'Reload nudges')
    pagination(harness.root).props.onClick()
    assert.deepEqual(harness.events, ['retry', 'retry'], 'recovery remains available after dismissal')
    assert.equal(findAll(harness.root, element => element.props['data-component'] === 'VAlert').length, 0)
  } finally { harness.dispose() }
})

test('an empty successful response replaces the cards with the existing empty state', async () => {
  const harness = mount({ items: [item()], isLoading: true })
  try {
    harness.props.items = []
    harness.props.isLoading = false
    await vue.nextTick()
    assert.equal(byClass(harness.root, 'ui-record-card').length, 0)
    assert.equal(byClass(harness.root, 'ui-record-list__loading').length, 0)
    assert.equal(byClass(harness.root, 'empty-state').length, 1)
    assert.equal(status(harness.root), 'No nudges found.')
  } finally { harness.dispose() }
})

test('table and mobile cards share values and retain expanded messages on resize', async () => {
  const message = 'Long message 👋 '.repeat(40)
  const harness = mount({ items: [{ ...item(), message, notification_format: 'rich', destination_url: 'https://example.com/watch', cta_label: 'watch_now', media_url: 'https://assets.example.com/test.webp' }] })
  try {
    const expand = findAll(harness.root, element => element.type === 'button' && element.props['aria-expanded'] === false)[0]
    expand.props.onClick()
    await vue.nextTick()
    assert.equal(byClass(harness.root, 'ui-expandable-text__copy')[0].text, message)
    isMobile.value = false
    await vue.nextTick()
    assert.equal(byClass(harness.root, 'ui-record-card').length, 0)
    assert.equal(findAll(harness.root, element => element.type === 'table').length, 1)
    assert.equal(findAll(harness.root, element => element.type === 'th').length, 11)
    assert.equal(byClass(harness.root, 'ui-expandable-text__copy')[0].text, message)
    assert.equal(findAll(harness.root, element => element.type === 'img').length, 0, 'No history image is fetched before opening')
    const action = findAll(harness.root, element => element.type === 'a')[0]
    assert.equal(action.props.href, 'https://example.com/watch')
    assert.equal(action.props.rel, 'noopener noreferrer')
    assert.equal(harness.events.length, 0, 'Presentation changes never fetch again')
  } finally { harness.dispose(); isMobile.value = true }
})

const { presentNudgeHistory, completionDuration } = loadSource('src/lib/nudgeHistoryPresentation.ts')
test('failure and missing engagement are represented honestly, including zero audiences', () => {
  const row = presentNudgeHistory({ ...item(), status: 'failed', notification_format: 'rich',
    stats: { total_audience: 0, total_devices: 0, delivered_users: 0, muted_users: 0, failed_deliveries: 1 } })
  assert.equal(row.statusDetails.label, 'Failed')
  assert.equal(row.completionLabel, '—')
  assert.equal(row.audience, '0')
  assert.equal(row.delivered, '0')
  assert.equal(row.engagementLabel, 'Not available yet')
  assert.match(row.failed, /1 failed/)
  assert.equal(presentNudgeHistory(item()).engagementLabel, 'Not applicable to Basic')
})

test('completion requires a completed status and ordered valid timestamps', () => {
  const completed = item()
  assert.equal(completionDuration(completed), '2s')
  assert.equal(completionDuration({ ...completed, completed_at: '2026-10-06T09:00:00.500Z' }), '<1s')
  assert.equal(completionDuration({ ...completed, completed_at: '2026-10-06T09:01:05Z' }), '1m 5s')
  assert.equal(completionDuration({ ...completed, completed_at: '2026-10-06T11:01:05Z' }), '2h 1m')
  for (const changes of [{ status: 'created' }, { status: 'processing' }, { completed_at: null }, { created_at: 'invalid' }, { completed_at: 'invalid' }, { completed_at: '2026-10-06T08:59:59Z' }]) {
    assert.equal(completionDuration({ ...completed, ...changes }), null)
  }
  assert.equal(presentNudgeHistory({ ...completed, created_at: 'invalid' }).sentLabel, 'Date unavailable')
})

test('Basic never exposes rich actions and absent or invalid media does not break history', () => {
  const rich = { ...item(), notification_format: 'rich', destination_url: 'https://example.com/watch', cta_label: 'watch_now', media_url: 'https://assets.example.com/image.webp' }
  assert.equal(presentNudgeHistory(rich).actionLabel, 'Watch now')
  assert.equal(presentNudgeHistory({ ...rich, cta_label: 'learn_more' }).actionLabel, 'Learn more')
  const basic = presentNudgeHistory({ ...rich, notification_format: 'basic' })
  assert.equal(basic.mediaUrl, undefined)
  assert.equal(basic.actionUrl, undefined)
  for (const media_url of [null, '', 'javascript:alert(1)', 'https://localhost/test']) {
    const row = presentNudgeHistory({ ...rich, media_url })
    assert.equal(row.mediaUrl, undefined)
    assert.equal(row.actionLabel, 'Watch now')
    assert.equal(row.message, rich.message)
  }
})
