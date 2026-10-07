import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createSourceLoader, vue, renderer, node, findAll, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const api = createSourceLoader({ '../config': { getNudgerConfig: () => ({ apiBaseUrl: 'http://example.test' }) } })('src/lib/nudgeApi.ts')
const fixtureToken = 'nudge_live_fixture-current-key'
const flush = async () => { await Promise.resolve(); await vue.nextTick() }

test('API validation matches message and recipient limits, including emoji code points', () => {
  const draft = { message: 'hello', nudgeType: 'transactional', recipientId: '' }
  for (const recipientId of ['', '012345', '12345', '1234567', '1e5', '123.45']) assert.ok(api.validateApiNudge({ ...draft, recipientId }).recipientId)
  for (const recipientId of ['100000', '999999', ' 482193 ']) assert.deepEqual(api.validateApiNudge({ ...draft, recipientId }), {})
  assert.ok(api.validateApiNudge({ ...draft, message: ' \n ' }).message)
  assert.ok(api.validateApiNudge({ ...draft, message: 'x'.repeat(4097) }).message)
  assert.equal(api.validateApiNudge({ ...draft, message: '😼'.repeat(4096) }).message, undefined)
  assert.deepEqual(api.buildApiNudgeRequest({ ...draft, message: ' hello ', nudgeType: 'broadcast', recipientId: '482193' }), { message: 'hello', nudge_type: 'broadcast' })
  assert.deepEqual(api.buildApiNudgeRequest({ ...draft, recipientId: '482193' }), { message: 'hello', nudge_type: 'transactional', nudge_user_id: 482193 })
})

test('copied cURL and Node.js examples define the current token and keep payloads literal', async () => {
  const payload = { message: 'It\'s ready.\n"Hello" $HOME `ignored` $(ignored) 👋', nudge_type: 'broadcast' }
  const curl = api.buildNudgeExample(payload, 'curl', fixtureToken)
  execFileSync('/bin/sh', ['-n'], { input: curl })
  assert.match(curl, /NUDGE_API_TOKEN='nudge_live_fixture-current-key'/)
  assert.ok(curl.includes('Authorization: Bearer $NUDGE_API_TOKEN'))
  assert.match(curl, /'"'"'/)
  const javascript = api.buildNudgeExample(payload, 'javascript', fixtureToken)
  let capturedRequest
  const run = new (Object.getPrototypeOf(async function () {}).constructor)('fetch', 'console', javascript)
  await run(async (_url, request) => { capturedRequest = request; return { status: 202, json: async () => ({}) } }, { log() {} })
  assert.equal(capturedRequest.headers.Authorization, `Bearer ${fixtureToken}`)
  assert.deepEqual(JSON.parse(capturedRequest.body), payload)
})

test('send uses merchant Bearer credentials, preserves error envelopes and never retries', async t => {
  const calls = []
  const body = { message: 'Invalid token', errors: { code: 'MERCHANT_API_TOKEN_INVALID' } }
  t.mock.method(globalThis, 'fetch', async (...args) => { calls.push(args); return new Response(JSON.stringify(body), { status: 401, headers: { 'Content-Type': 'application/json' } }) })
  const signal = new AbortController().signal
  assert.deepEqual(await api.sendApiNudge('fixture-key', { message: 'Hello', nudge_type: 'broadcast' }, signal), { status: 401, body })
  assert.equal(calls.length, 1)
  assert.equal(calls[0][1].headers.get('Authorization'), 'Bearer fixture-key')
  assert.equal(calls[0][1].credentials, 'omit')
  assert.equal(calls[0][1].cache, 'no-store')
  assert.equal(calls[0][1].signal.aborted, false)
})

test('Python, Go and Java examples preserve JSON messages and transactional recipient IDs', () => {
  const message = 'It\'s ready.\n"Hello" \\path 👋 and `literal` ${literal}'
  for (const payload of [
    { message, nudge_type: 'broadcast' },
    { message, nudge_type: 'transactional', nudge_user_id: 482193 },
  ]) {
    const python = api.buildNudgeExample(payload, 'python', fixtureToken)
    const pythonBody = python.match(/payload = ([\s\S]*?)\n\nrequest =/)[1]
    assert.deepEqual(JSON.parse(pythonBody), payload)
    const go = api.buildNudgeExample(payload, 'go', fixtureToken)
    const goLiteral = go.match(/strings.NewReader\(("(?:\\.|[^"\\])*")\)/)[1]
    assert.deepEqual(JSON.parse(JSON.parse(goLiteral)), payload)
    const java = api.buildNudgeExample(payload, 'java', fixtureToken)
    const javaLiteral = java.match(/String payload = ("(?:\\.|[^"\\])*");/)[1]
    assert.deepEqual(JSON.parse(JSON.parse(javaLiteral)), payload)
    for (const snippet of [python, go, java]) {
      assert.match(snippet, /NUDGE_API_TOKEN/)
      assert.ok(snippet.includes(fixtureToken))
      assert.doesNotMatch(snippet, /os\.environ|os\.Getenv|System\.getenv|process\.env|YOUR_API_TOKEN/)
      assert.match(snippet, /http:\/\/example.test\/v1\/app-nudger\/nudge\/send/)
      assert.match(snippet, /application\/json/)
    }
  }
})

function playgroundHarness() {
  const requests = [], token = vue.ref('fixture-key'), busy = vue.ref(false), isRevealed = vue.ref(false)
  const scope = vue.effectScope()
  const load = createSourceLoader({
    '../lib/apiUrl': { resolveApiUrl: path => `http://example.test${path}` },
    '../lib/nudgeApi': { ...api, sendApiNudge: (...args) => new Promise((resolve, reject) => requests.push({ args, resolve, reject })) },
  })
  const model = scope.run(() => load('src/composables/useNudgeApiPlayground.ts').useNudgeApiPlayground(token, busy, isRevealed))
  return { model, requests, token, busy, isRevealed, dispose: () => scope.stop() }
}

test('all languages share visibility, copy the current key while masked, and follow replacement', () => {
  const h = playgroundHarness(), m = h.model
  try {
    for (const { value } of api.NUDGE_EXAMPLE_LANGUAGES) {
      m.language.value = value
      assert.ok(!m.requestExample.value.includes('fixture-key'))
      assert.ok(m.requestExample.value.includes('••••'))
      assert.ok(m.requestCopyExample.value.includes('fixture-key'))
    }
    h.isRevealed.value = true
    for (const { value } of api.NUDGE_EXAMPLE_LANGUAGES) {
      m.language.value = value
      assert.equal(m.requestExample.value, m.requestCopyExample.value)
      assert.ok(m.requestExample.value.includes('fixture-key'))
    }
    h.isRevealed.value = false
    h.token.value = 'replacement-key'
    assert.ok(!m.requestExample.value.includes('replacement-key'))
    assert.ok(m.requestCopyExample.value.includes('replacement-key'))
    assert.ok(!m.requestCopyExample.value.includes('fixture-key'))
    h.token.value = null
    assert.match(m.requestExample.value, /Create or load your API token/)
    assert.equal(m.requestCopyExample.value, '')
  } finally { h.dispose() }
})

test('code block renders only masked text, copies the separate value, and blocks unavailable copies', async () => {
  const copied = []
  const load = createSourceLoader({ '../../lib/clipboard': { copyText: async value => copied.push(value) } })
  const CodeBlock = load('src/components/ui/CodeBlock.vue').default
  const props = vue.reactive({ code: 'NUDGE_API_TOKEN = "••••"', copyCode: `NUDGE_API_TOKEN = "${fixtureToken}"`, label: 'Request example', isCopyDisabled: false })
  const root = node('root')
  const app = renderer.createApp({ setup: () => () => vue.h(CodeBlock, props) })
  registerVuetifyStubs(app)
  app.mount(root)
  const copyButton = () => findAll(root, el => el.props['aria-label'] === 'Copy Request example')[0]
  try {
    const visible = findAll(root, el => el.text.includes(fixtureToken) || Object.values(el.props).some(value => typeof value === 'string' && value.includes(fixtureToken)))
    assert.deepEqual(visible, [], 'the secret cannot appear in rendered text or attributes')
    await copyButton().props.onClick()
    assert.deepEqual(copied, [props.copyCode])
    props.isCopyDisabled = true
    await flush()
    await copyButton().props.onClick()
    assert.equal(copied.length, 1)
    props.copyCode = 'NUDGE_API_TOKEN = "replacement-key"'
    props.isCopyDisabled = false
    await flush()
    await copyButton().props.onClick()
    assert.equal(copied[1], props.copyCode)
  } finally { app.unmount() }
})

test('only confirmation sends, duplicate clicks are blocked, and the reviewed payload is immutable', async () => {
  const h = playgroundHarness(), m = h.model
  try {
    await m.handleSend()
    assert.equal(h.requests.length, 0)
    assert.equal(m.handleReview(), false)
    m.draft.message = 'Reviewed message'
    await flush()
    assert.equal(m.handleReview(), true)
    assert.equal(h.requests.length, 0)
    m.draft.message = 'Later edit'
    const sending = m.handleSend()
    await m.handleSend()
    assert.equal(h.requests.length, 1)
    assert.equal(h.requests[0].args[1].message, 'Reviewed message')
    h.requests[0].resolve({ status: 202, body: { data: { status: 'queued' } } })
    await sending
    assert.equal(m.isConfirmationOpen.value, false)
    assert.match(m.statusMessage.value, /queued/)
  } finally { h.dispose() }
})

test('cancel, unavailable credential, credential changes and busy state prevent sending', async () => {
  const h = playgroundHarness(), m = h.model
  try {
    m.draft.message = 'Hello'
    m.handleReview()
    m.isConfirmationOpen.value = false
    await m.handleSend()
    assert.equal(h.requests.length, 0)
    h.busy.value = true
    assert.equal(m.handleReview(), false)
    h.busy.value = false
    m.handleReview()
    h.token.value = 'rotated-key'
    await flush()
    assert.equal(m.isConfirmationOpen.value, false)
    await m.handleSend()
    assert.equal(h.requests.length, 0)
    h.token.value = null
    await flush()
    assert.equal(m.handleReview(), false)
    assert.match(m.requestError.value, /API token/)
  } finally { h.dispose() }
})

test('network uncertainty preserves input and does not retry; disposing aborts pending work', async () => {
  const h = playgroundHarness(), m = h.model
  m.draft.message = 'Keep this draft'
  m.handleReview()
  const sending = m.handleSend()
  h.requests[0].reject(new Error('Network lost'))
  await sending
  assert.match(m.requestError.value, /may have been accepted/)
  assert.equal(m.draft.message, 'Keep this draft')
  assert.equal(h.requests.length, 1)
  m.handleReview()
  const next = m.handleSend()
  h.dispose()
  assert.equal(h.requests[1].args[2].aborted, true)
  h.requests[1].resolve({ status: 202, body: { message: 'stale' } })
  await next
  assert.equal(m.result.value, null)
})

test('tokens load masked, creation and rotation reset visibility, and unmount clears secrets', async () => {
  let mounted
  const copied = []
  const load = createSourceLoader({
    vue: { ...vue, onMounted: callback => { mounted = callback } },
    '../lib/clipboard': { copyText: async value => { copied.push(value) } },
  })
  const scope = vue.effectScope()
  const request = async (_path, options) => ({ data: { has_token: true, token: options?.method === 'POST' ? 'new-key' : 'existing-key' } })
  const m = scope.run(() => load('src/composables/useApiToken.ts').useApiToken(request))
  await mounted()
  assert.equal(m.isRevealed.value, false)
  await m.handleCopy()
  assert.deepEqual(copied, ['existing-key'])
  for (const operation of ['create', 'rotate']) {
    m.isRevealed.value = true
    assert.equal(await m.handleChange(operation), true)
    assert.equal(m.isRevealed.value, false)
  }
  scope.stop()
  assert.equal(m.tokenData.value, null)
})

test('failed rotation keeps the previous key and busy changes cannot reveal or copy it', async () => {
  let mounted, rejectRotation
  const copied = []
  const load = createSourceLoader({
    vue: { ...vue, onMounted: callback => { mounted = callback } },
    '../lib/clipboard': { copyText: async value => copied.push(value) },
  })
  const scope = vue.effectScope()
  const request = (_path, options) => options?.method === 'POST'
    ? new Promise((_resolve, reject) => { rejectRotation = reject })
    : Promise.resolve({ data: { has_token: true, token: fixtureToken } })
  const m = scope.run(() => load('src/composables/useApiToken.ts').useApiToken(request))
  try {
    await mounted()
    m.handleToggleReveal()
    assert.equal(m.isRevealed.value, true)
    const changing = m.handleChange('rotate')
    m.handleToggleReveal()
    await m.handleCopy()
    assert.equal(m.isRevealed.value, false)
    assert.deepEqual(copied, [])
    rejectRotation(new Error('Rotation unavailable'))
    assert.equal(await changing, false)
    assert.equal(m.tokenData.value.token, fixtureToken)
    m.handleToggleReveal()
    assert.equal(m.isRevealed.value, true)
  } finally { scope.stop() }
})
