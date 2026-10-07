import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/vueHarness.mjs'

const runtime = {
  apiBaseUrl: '/', profileImageSourceMaxBytes: '10485760', profileImageFinalMaxBytes: '2097152',
  profileImageMaxDimension: '1600', profileImageWebpQuality: '0.82',
}
const path = '/v1/app-nudger/nudges'
function harness(t, apiBaseUrl = '/') {
  const previous = globalThis.window
  globalThis.window = { location: { origin: 'http://192.168.68.102:5174' }, __NUDGER_CONFIG__: { ...runtime, apiBaseUrl } }
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous })
  const load = createSourceLoader()
  return { ...load('src/lib/api.ts'), ...load('src/lib/apiUrl.ts'), load }
}
const json = (body, status = 200, type = 'application/json') => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': type } })

test('environment endpoint is authoritative for every API path and is resolved at request time', async t => {
  const api = harness(t)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => { calls.push({ url, init }); return json({ data: {} }) })
  for (const route of ['/v1/app-identity/refresh', path, '/v1/app-nudger/profile', '/v1/app-nudger/token', '/v1/app-nudger/audience/overview', '/v1/app-nudger/nudge/broadcast']) {
    await api.requestJson(route)
    assert.equal(calls.at(-1).url, `http://192.168.68.102:5174${route}`)
  }
  window.__NUDGER_CONFIG__.apiBaseUrl = 'https://api.example.test/gateway/'
  await api.requestJson(path)
  assert.equal(calls.at(-1).url, `https://api.example.test/gateway${path}`)
  assert.equal(api.resolveApiUrl('/docs'), 'https://api.example.test/gateway/docs')
  for (const base of ['/gateway/', 'https://api.example.test/', '/']) {
    window.__NUDGER_CONFIG__.apiBaseUrl = base
    assert.ok(!api.resolveApiUrl(path).includes('/http'))
  }
  for (const route of ['https://untrusted.test/v1', '//untrusted.test/v1', '/\\untrusted.test', '/v1#fragment', '/../v1', '/%2e%2e/v1', '/%2f%2funtrusted.test']) {
    assert.throws(() => api.resolveApiUrl(route))
  }
})

test('pagination supports absolute, root-relative, relative and query cursors without changing the API host', t => {
  const api = harness(t)
  const query = '?page_size=20&nudge_type=broadcast&cursor=abc%2B%2F%3D'
  for (const base of ['/', '/gateway', 'https://api.example.test/gateway/']) {
    window.__NUDGER_CONFIG__.apiBaseUrl = base
    for (const link of [`http://localhost:5174${path}${query}`, `http://internal-worker:8000${path}${query}`, `${path}${query}`, `${path.slice(1)}${query}`, query, `${api.resolveApiUrl(path)}${query}`]) {
      assert.equal(api.parseNextLink(link, path), path + query)
      assert.equal(new URL(api.resolveApiUrl(api.parseNextLink(link, path))).origin, new URL(api.resolveApiUrl(path)).origin)
    }
  }
  for (const link of ['', '/http://localhost:5174/v1/app-nudger/nudges', '//evil.test/v1', 'javascript:alert(1)', '/v1/app-nudger/token', `${path}#fragment`, 'https://user:password@api.test' + path, ' https://api.test' + path]) {
    assert.throws(() => api.parseNextLink(link, path), /invalid pagination link/)
  }
})

test('missing or invalid runtime values fail instead of using a fallback; runtime image values are honored', t => {
  const api = harness(t)
  const { getNudgerConfig } = api.load('src/config.ts')
  assert.equal(getNudgerConfig().profileImageSourceMaxBytes, 10485760)
  for (const key of Object.keys(runtime)) {
    window.__NUDGER_CONFIG__ = { ...runtime }
    delete window.__NUDGER_CONFIG__[key]
    assert.throws(getNudgerConfig)
  }
  for (const apiBaseUrl of ['', 'localhost:8001', '//other.test', 'ftp://other.test', 'https://user:pass@api.test', '/?query=1', '/#fragment']) {
    window.__NUDGER_CONFIG__ = { ...runtime, apiBaseUrl }
    assert.throws(getNudgerConfig)
  }
  window.__NUDGER_CONFIG__ = { ...runtime, profileImageSourceMaxBytes: '12345' }
  assert.equal(getNudgerConfig().profileImageSourceMaxBytes, 12345)
  delete window.__NUDGER_CONFIG__
  assert.throws(getNudgerConfig, /VITE_API_BASE_URL/)
})

test('HTML, empty, null, primitive and malformed JSON successes cannot masquerade as API payloads', async t => {
  const api = harness(t)
  for (const response of [
    () => new Response('<html>SPA fallback</html>', { headers: { 'Content-Type': 'text/html' } }),
    () => new Response('', { headers: { 'Content-Type': 'application/json' } }),
    () => new Response('{broken', { headers: { 'Content-Type': 'application/json' } }),
    () => json(null), () => json('text'),
  ]) {
    t.mock.method(globalThis, 'fetch', async () => response())
    await assert.rejects(api.requestJson(path), error => error.code === 'API_INVALID_RESPONSE' && error.status === 200)
  }
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }))
  assert.equal(await api.requestJson('/v1/app-identity/logout', { method: 'POST' }), undefined)
})

test('structured errors, validation fields, and non-JSON HTTP error statuses survive the shared client', async t => {
  const api = harness(t)
  t.mock.method(globalThis, 'fetch', async () => json({ message: 'Try later', errors: { code: 'BUSY', retryable: true, field_errors: { message: 'Too long' } } }, 503, 'application/problem+json'))
  await assert.rejects(api.requestJson(path), error => {
    assert.equal(error.status, 503); assert.equal(error.code, 'BUSY'); assert.equal(error.retryable, true)
    assert.deepEqual(error.fieldErrors, { message: 'Too long' }); return true
  })
  for (const status of [401, 403, 404, 429, 500, 502, 503]) {
    t.mock.method(globalThis, 'fetch', async () => new Response('<html>proxy error</html>', { status }))
    await assert.rejects(api.requestJson(path), error => error.status === status && !error.message.includes('<html>'))
  }
  t.mock.method(globalThis, 'fetch', async () => json({ detail: [null, { loc: ['body', 'message'], msg: 'Required' }] }, 422))
  await assert.rejects(api.requestJson(path), error => error.fieldErrors.message === 'Required')
})

test('headers, form uploads, cancellation and private request policies are consistent', async t => {
  const api = harness(t)
  let captured
  t.mock.method(globalThis, 'fetch', async (_url, init) => { captured = init; return json({ data: {} }) })
  await api.requestJson(path, { method: 'POST', headers: { 'X-Custom': 'value' }, body: '{}' }, 'fixture-session')
  assert.equal(captured.headers.get('Authorization'), 'Bearer fixture-session')
  assert.equal(captured.headers.get('Content-Type'), 'application/json')
  assert.equal(captured.headers.get('X-Custom'), 'value')
  assert.equal(captured.cache, 'no-store'); assert.equal(captured.credentials, 'omit'); assert.equal(captured.redirect, 'error')
  await api.requestJson(path, { method: 'POST', body: new FormData() })
  assert.equal(captured.headers.has('Content-Type'), false)
  const controller = new AbortController()
  t.mock.method(globalThis, 'fetch', (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true })))
  const pending = api.requestJson(path, { signal: controller.signal })
  controller.abort()
  await assert.rejects(pending, error => error.name === 'AbortError')
})

test('timeouts and network failures are bounded and do not retry sends', async t => {
  const api = harness(t)
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let calls = 0
  t.mock.method(globalThis, 'fetch', (_url, init) => {
    calls += 1
    return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true }))
  })
  const pending = api.requestJson('/v1/app-nudger/nudge/broadcast', { method: 'POST', body: '{}' })
  t.mock.timers.tick(api.API_REQUEST_TIMEOUT_MS)
  await assert.rejects(pending, error => error.code === 'API_TIMEOUT' && !error.retryable && error.message.includes('may have been accepted'))
  assert.equal(calls, 1)
  t.mock.method(globalThis, 'fetch', async () => { calls += 1; throw new TypeError('Failed to fetch') })
  await assert.rejects(api.requestJson(path), error => error.code === 'API_UNREACHABLE')
  assert.equal(calls, 2)
})

test('all example languages and merchant-token sends use the configured absolute endpoint', async t => {
  const api = harness(t)
  const nudge = api.load('src/lib/nudgeApi.ts')
  const payload = { message: 'Fixture only', nudge_type: 'broadcast' }
  for (const base of ['/', 'https://api.example.test/gateway']) {
    window.__NUDGER_CONFIG__.apiBaseUrl = base
    const endpoint = api.resolveApiUrl(nudge.NUDGE_SEND_PATH)
    for (const { value } of nudge.NUDGE_EXAMPLE_LANGUAGES) assert.ok(nudge.buildNudgeExample(payload, value, 'fixture-token').includes(endpoint))
    let calls = 0
    t.mock.method(globalThis, 'fetch', async (url, init) => {
      calls += 1
      assert.equal(url, endpoint); assert.equal(init.headers.get('Authorization'), 'Bearer fixture-token')
      return json({ errors: { code: 'INVALID_TOKEN' } }, 401)
    })
    assert.equal((await nudge.sendApiNudge('fixture-token', payload, new AbortController().signal)).status, 401)
    assert.equal(calls, 1)
  }
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>not queued</html>', { status: 202 }))
  await assert.rejects(nudge.sendApiNudge('fixture-token', payload, new AbortController().signal), error => error.code === 'API_INVALID_RESPONSE')
})

test('history validates its envelope before returning data to the list', async t => {
  const api = harness(t)
  const { getNudgeHistory } = api.load('src/lib/nudges.ts')
  for (const response of [null, {}, { data: null }, { data: { items: null, next: null } }, { data: { items: [], next: 123 } }]) {
    await assert.rejects(getNudgeHistory(async () => response), error => error.code === 'API_INVALID_RESPONSE')
  }
  let requested
  await getNudgeHistory(async route => { requested = route; return { data: { items: [], next: null } } }, { nextLink: `http://localhost:5174${path}?cursor=next&nudge_type=broadcast` })
  assert.equal(requested, `${path}?cursor=next&nudge_type=broadcast`)
})
