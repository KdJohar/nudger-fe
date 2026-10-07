import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader, vue } from './helpers/vueHarness.mjs'

function harness() {
  const requests = []
  let mounted, unmounted
  const scope = vue.effectScope(), filter = vue.ref('broadcast')
  const load = createSourceLoader({
    vue: { ...vue, onMounted: callback => { mounted = callback }, onUnmounted: callback => { unmounted = callback } },
    '../lib/nudges': { getNudgeHistory: (request, options) => request('/history', { options }) },
    './useAuth': { useAuth: () => ({ state: { accessToken: 'fixture-token' }, authenticatedRequest: (_path, init) => new Promise((resolve, reject) => requests.push({ ...init.options, signal: init.signal, resolve, reject })) }) },
  })
  const state = scope.run(() => load('src/composables/useNudgeHistory.ts').useNudgeHistory(filter))
  const initial = mounted()
  return { state, requests, initial, filter, dispose() { unmounted(); scope.stop() } }
}
const page = (ids, next = null) => ({ items: ids.map(id => ({ id })), next })
const flush = async () => { await Promise.resolve(); await vue.nextTick() }

test('load more appends once, deduplicates overlaps, and stops at the last page', async () => {
  const h = harness()
  try {
    h.requests[0].resolve(page(['a', 'b'], '/next')); await h.initial
    const loading = h.state.loadHistory(true)
    await h.state.loadHistory(true)
    assert.equal(h.requests.length, 2); assert.equal(h.requests[1].nextLink, '/next')
    h.requests[1].resolve(page(['b', 'c'])); await loading
    assert.deepEqual(h.state.items.value.map(item => item.id), ['a', 'b', 'c'])
    await h.state.loadHistory(true); assert.equal(h.requests.length, 2)
  } finally { h.dispose() }
})

test('failed pagination keeps cards and retries the exact failed cursor', async () => {
  const h = harness()
  try {
    h.requests[0].resolve(page(['a'], '/next')); await h.initial
    const loading = h.state.loadHistory(true)
    h.requests[1].reject(new Error('Temporary API failure')); await loading
    assert.deepEqual(h.state.items.value.map(item => item.id), ['a'])
    assert.equal(h.state.nextLink.value, '/next')
    const retry = h.state.retryHistory()
    assert.equal(h.requests[2].nextLink, '/next')
    h.requests[2].resolve(page(['b'])); await retry
    assert.deepEqual(h.state.items.value.map(item => item.id), ['a', 'b'])
    assert.equal(h.state.errorMessage.value, null)
  } finally { h.dispose() }
})

test('filter changes abort pagination, ignore late replies, and prevent stale cursor use after a failed refresh', async () => {
  const h = harness()
  try {
    h.requests[0].resolve(page(['broadcast'], '/old-cursor')); await h.initial
    const more = h.state.loadHistory(true)
    h.filter.value = 'transactional'; await vue.nextTick()
    assert.equal(h.requests[1].signal.aborted, true)
    assert.equal(h.state.isLoadingMore.value, false)
    assert.equal(h.state.isLoading.value, true)
    assert.deepEqual(h.state.items.value.map(item => item.id), ['broadcast'])
    h.requests[2].reject(new Error('Refresh failed')); await flush()
    await h.state.loadHistory(true); assert.equal(h.requests.length, 3)
    h.requests[1].resolve(page(['stale'])); await more
    assert.deepEqual(h.state.items.value.map(item => item.id), ['broadcast'])
    const retry = h.state.retryHistory()
    assert.equal(h.requests[3].nextLink, null); assert.equal(h.requests[3].nudgeType, 'transactional')
    h.requests[3].resolve(page(['transactional'])); await retry
    assert.deepEqual(h.state.items.value.map(item => item.id), ['transactional'])
  } finally { h.dispose() }
})

test('unmount cancels active work and ignores late responses', async () => {
  const h = harness()
  h.dispose()
  assert.equal(h.requests[0].signal.aborted, true)
  h.requests[0].resolve(page(['late'])); await h.initial
  assert.deepEqual(h.state.items.value, [])
})
