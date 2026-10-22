import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

function workerFixture() {
  const handlers = {}, stores = new Map(), deleted = []
  const cache = name => {
    if (!stores.has(name)) stores.set(name, new Map())
    const entries = stores.get(name)
    return {
      put: async (url, response) => entries.set(String(url), response),
      addAll: async urls => urls.forEach(url => entries.set(url, new Response(`precache:${url}`))),
    }
  }
  const caches = {
    open: async name => cache(name), keys: async () => [...stores.keys()],
    delete: async name => { deleted.push(name); return stores.delete(name) },
    match: async url => { for (const entries of stores.values()) if (entries.has(String(url))) return entries.get(String(url)).clone() },
  }
  let fetchResponse = new Response('fresh'), isOffline = false
  const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
    .replace('__BUILD_ID__', 'fixture-v2').replace('/*PUBLIC_PAGE_PATHS*/ []', '["/","/privacy","/delete-account"]')
  runInNewContext(source, {
    URL, Response, caches,
    fetch: async () => { if (isOffline) throw new Error('offline'); return fetchResponse.clone() },
    self: { location: { origin: 'https://example.test' }, addEventListener: (name, handler) => { handlers[name] = handler }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
  })
  async function lifecycle(name) {
    const pending = []
    handlers[name]({ waitUntil: task => pending.push(task) })
    await Promise.all(pending)
  }
  async function request(path, options = {}) {
    let result
    const pending = []
    handlers.fetch({ request: { url: new URL(path, 'https://example.test').href, method: 'GET', mode: 'navigate', ...options }, waitUntil: task => pending.push(task), respondWith: task => { result = task } })
    const response = await result
    await Promise.all(pending)
    return response
  }
  return { lifecycle, request, stores, deleted, offline: () => { isOffline = true }, response: response => { fetchResponse = response } }
}

test('public pages bypass the workspace worker, including offline and query navigation', async () => {
  const fixture = workerFixture()
  await fixture.lifecycle('install')
  for (const path of ['/', '/privacy', '/privacy?query=ignored', '/delete-account', '/for-nudgers', '/marketing/site.js', '/showcase/app-inbox.webp', '/unknown']) assert.equal(await fixture.request(path), undefined)
  fixture.offline()
  assert.equal(await fixture.request('/privacy'), undefined)
  assert.equal(await (await fixture.request('/audience')).text(), 'precache:/app.html')
})

test('API, runtime config, other origins and non-GET requests bypass worker caching', async () => {
  const fixture = workerFixture()
  await fixture.lifecycle('install')
  for (const path of ['/v1/private', '/runtime-config.js', '/sw.js', '/docs', '/openapi.json', 'https://another.example/privacy']) assert.equal(await fixture.request(path), undefined, path)
  assert.equal(await fixture.request('/privacy', { method: 'POST' }), undefined)
  assert.equal(await fixture.request('/v1/data.json', { mode: 'cors' }), undefined)
})

test('private navigation and failed responses never enter the public cache', async () => {
  const fixture = workerFixture()
  await fixture.lifecycle('install')
  await fixture.request('/audience')
  fixture.response(new Response('Not found', { status: 404 }))
  assert.equal(await fixture.request('/privacy'), undefined)
  const entries = fixture.stores.get('nudger-shell-fixture-v2')
  assert.equal(entries.has('/audience'), false)
  assert.equal(entries.has('/privacy'), false)
})

test('activation removes older app caches while preserving unrelated caches', async () => {
  const fixture = workerFixture()
  await fixture.lifecycle('install')
  fixture.stores.set('nudger-shell-v1', new Map())
  fixture.stores.set('unrelated-cache', new Map())
  await fixture.lifecycle('activate')
  assert.deepEqual(fixture.deleted, ['nudger-shell-v1'])
  assert.equal(fixture.stores.has('unrelated-cache'), true)
})
