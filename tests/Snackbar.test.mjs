import test from 'node:test'
import assert from 'node:assert/strict'
import { vue, loadSource, renderer, node, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const { createSnackbarQueue } = loadSource('src/lib/snackbar.ts')
const Feedback = loadSource('src/components/ui/SnackbarFeedback.vue').default
function mount(overrides = {}) {
  const props = vue.reactive({ message: '', tone: 'error', ...overrides })
  const events = []
  const app = renderer.createApp({ setup: () => () => vue.h(Feedback, { ...props, onAction: () => events.push('action') }) })
  const queue = registerVuetifyStubs(app)
  app.mount(node('root'))
  return { props, queue, events, dispose: () => app.unmount() }
}

test('queue is app-owned, FIFO and shows one notice at a time', () => {
  const queue = createSnackbarQueue(), otherApp = createSnackbarQueue()
  const first = queue.show({ tone: 'success', message: 'Saved.' })
  const second = queue.show({ tone: 'error', message: 'Unavailable.' })
  assert.equal(queue.current.value.id, first)
  assert.equal(queue.count.value, 2)
  assert.equal(otherApp.count.value, 0)
  queue.dismiss(first)
  assert.equal(queue.current.value.id, second)
  queue.clear()
  assert.equal(queue.current.value, null)
})
test('updating the same source replaces its notice without duplicating or reordering', () => {
  const queue = createSnackbarQueue()
  const first = queue.show({ tone: 'error', message: 'Old message.' })
  queue.show({ tone: 'success', message: 'Queued success.' })
  queue.show({ tone: 'error', message: 'Updated message.' }, first)
  assert.equal(queue.count.value, 2)
  assert.equal(queue.current.value.message, 'Updated message.')
  queue.dismiss(first)
  assert.equal(queue.current.value.message, 'Queued success.')
})
test('feedback clears resolved failures and repeated failed attempts can notify again', async () => {
  const harness = mount({ message: 'Unavailable.', actionText: 'Try again' })
  try {
    const first = harness.queue.current.value.id
    harness.props.isActionDisabled = true
    await vue.nextTick()
    assert.equal(harness.queue.current.value.isActionDisabled(), true)
    harness.props.isActionDisabled = false
    await vue.nextTick()
    assert.equal(harness.queue.current.value.isActionDisabled(), false)
    harness.queue.current.value.onAction()
    assert.deepEqual(harness.events, ['action'])
    harness.props.message = ''
    await vue.nextTick()
    assert.equal(harness.queue.current.value, null)
    harness.props.message = 'Unavailable.'
    await vue.nextTick()
    assert.notEqual(harness.queue.current.value.id, first)
    assert.equal(harness.queue.count.value, 1)
  } finally { harness.dispose() }
})
test('dismissed errors stay dismissed until a new operation or changed message', async () => {
  const harness = mount({ message: 'Unavailable.' })
  try {
    harness.queue.dismiss(harness.queue.current.value.id)
    harness.props.isActionDisabled = true
    await vue.nextTick()
    assert.equal(harness.queue.current.value, null)
    harness.props.message = 'Another failure.'
    await vue.nextTick()
    assert.equal(harness.queue.current.value.message, 'Another failure.')
  } finally { harness.dispose() }
})
test('route disposal removes errors and retry callbacks but preserves redirect success', () => {
  for (const props of [
    { tone: 'error' }, { tone: 'warning' }, { tone: 'info' },
    { tone: 'success', actionText: 'Retry callback' },
  ]) {
    const harness = mount({ message: 'Feedback.', ...props })
    harness.dispose()
    assert.equal(harness.queue.current.value, null)
  }
  const harness = mount({ message: 'Profile created.', tone: 'success', actionText: 'View profile', actionTo: '/profile' })
  harness.dispose()
  assert.equal(harness.queue.current.value.message, 'Profile created.')
  assert.equal(harness.queue.current.value.onAction, undefined)
})
