import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { compileFunction } from 'node:vm'
import ts from 'typescript'
import * as vue from 'vue'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../src/composables/useAudienceOverview.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

// Exercise real Vue refs and watchers, isolating only auth, network and mount boundaries.
function createHarness() {
  const requests = []
  let handleMounted
  let handleBeforeUnmount
  const scope = vue.effectScope()
  const module = { exports: {} }
  const dependencies = {
    vue: { ...vue, onMounted: callback => { handleMounted = callback }, onBeforeUnmount: callback => { handleBeforeUnmount = callback } },
    '../lib/audience': {
      getAudienceOverview: period => new Promise((resolve, reject) => requests.push({ period, resolve, reject })),
    },
    './useAuth': { useAuth: () => ({ state: { accessToken: 'test-only' }, authenticatedRequest: () => {} }) },
  }
  compileFunction(compiled, ['require', 'exports', 'module'])(
    name => dependencies[name] ?? require(name), module.exports, module,
  )
  const state = scope.run(() => module.exports.useAudienceOverview())
  const mounted = handleMounted()
  return { state, requests, mounted, dispose() { handleBeforeUnmount(); scope.stop() } }
}

async function flush() { await Promise.resolve(); await vue.nextTick() }

test('initial loading resolves to an empty audience without becoming an error', async () => {
  const harness = createHarness()
  try {
    assert.equal(harness.state.isLoading.value, true)
    assert.equal(harness.requests[0].period, '30d')
    harness.requests[0].resolve({ period: '30d', total_audience: 0, trend: [] })
    await harness.mounted
    assert.equal(harness.state.overview.value.total_audience, 0)
    assert.equal(harness.state.isLoading.value, false)
    assert.equal(harness.state.errorMessage.value, null)
  } finally { harness.dispose() }
})

test('refresh keeps existing data on failure and supports retry', async () => {
  const harness = createHarness()
  try {
    harness.requests[0].resolve({ period: '30d', total_audience: 15 })
    await harness.mounted
    harness.state.period.value = '7d'
    await vue.nextTick()
    assert.equal(harness.requests[1].period, '7d')
    assert.equal(harness.state.overview.value.period, '30d')
    assert.equal(harness.state.isLoading.value, true)
    harness.requests[1].reject(new Error('Connection unavailable'))
    await flush()
    assert.equal(harness.state.errorMessage.value, 'Connection unavailable')
    assert.equal(harness.state.overview.value.total_audience, 15)
    assert.equal(harness.state.isLoading.value, false)
    const retry = harness.state.loadOverview()
    harness.requests[2].resolve({ period: '7d', total_audience: 16 })
    await retry
    assert.equal(harness.state.errorMessage.value, null)
    assert.equal(harness.state.overview.value.period, '7d')
  } finally { harness.dispose() }
})

test('rapid filter changes ignore late results and errors from older windows', async () => {
  const harness = createHarness()
  try {
    harness.state.period.value = '7d'
    await vue.nextTick()
    harness.state.period.value = '90d'
    await vue.nextTick()
    harness.requests[2].resolve({ period: '90d', total_audience: 90 })
    await flush()
    harness.requests[0].resolve({ period: '30d', total_audience: 30 })
    harness.requests[1].reject(new Error('Stale failure'))
    await harness.mounted
    await flush()
    assert.equal(harness.state.overview.value.period, '90d')
    assert.equal(harness.state.errorMessage.value, null)
    assert.equal(harness.state.isLoading.value, false)
  } finally { harness.dispose() }
})

test('unmount ignores an in-flight response', async () => {
  const harness = createHarness()
  harness.dispose()
  harness.requests[0].resolve({ period: '30d', total_audience: 10 })
  await harness.mounted
  assert.equal(harness.state.overview.value, null)
})
