import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/vueHarness.mjs'

const { initializeGoogleAnalytics } = createSourceLoader()('src/lib/googleAnalytics.ts')

function fixture() {
  const scripts = [], hooks = []
  let resolveReady
  const ready = new Promise(resolve => { resolveReady = resolve })
  const browser = { location: { origin: 'https://plugandnudge.com', pathname: '/privacy' } }
  const page = { title: 'Privacy Policy', referrer: 'https://plugandnudge.com/login?code=secret', querySelector: () => scripts[0], createElement: () => ({ dataset: {} }), head: { appendChild: script => scripts.push(script) } }
  const router = { afterEach: hook => hooks.push(hook), isReady: () => ready, currentRoute: { value: { path: '/privacy' } } }
  return { browser, page, router, hooks, scripts, resolveReady, events: () => browser.dataLayer.map(args => [...args]).filter(args => args[0] === 'event') }
}

test('GA uses the supported arguments queue, loads once, and records the first page once', async () => {
  const fixtureState = fixture()
  const { browser, page, router, hooks, scripts, resolveReady, events } = fixtureState
  initializeGoogleAnalytics('G-TEST123', router, browser, page)
  hooks[0]({ path: '/privacy' }, {}, undefined)
  resolveReady()
  await Promise.resolve()
  assert.equal(events().length, 1)
  assert.equal(Array.isArray(browser.dataLayer[0]), false, 'gtag consumes the documented arguments queue')
  assert.equal([...browser.dataLayer[1]][2].send_page_view, false)
  initializeGoogleAnalytics('G-TEST123', router, browser, page)
  assert.equal(scripts.length, 1)
  assert.equal(hooks.length, 1)
})

test('SPA analytics follows successful navigation with titles and omits OAuth/query data', async () => {
  const { browser, page, router, hooks, resolveReady, events } = fixture()
  initializeGoogleAnalytics('G-TEST123', router, browser, page)
  resolveReady()
  await Promise.resolve()
  page.title = 'Account deletion'
  hooks[0]({ path: '/delete-account', fullPath: '/delete-account?code=do-not-record' }, {}, undefined)
  hooks[0]({ path: '/login' }, {}, new Error('cancelled navigation'))
  hooks[0]({ path: '/privacy' }, {}, undefined)
  assert.deepEqual(events().map(event => event[2].page_path), ['/privacy', '/delete-account', '/privacy'])
  assert.equal(events()[1][2].page_title, 'Account deletion')
  assert.equal(events()[1][2].page_referrer, 'https://plugandnudge.com/privacy')
  assert.doesNotMatch(JSON.stringify(browser.dataLayer), /secret|do-not-record|\?code=/)
})

test('an empty or invalid local measurement ID loads no analytics script', () => {
  for (const id of ['', 'not-an-id']) {
    const { browser, page, router, scripts } = fixture()
    initializeGoogleAnalytics(id, router, browser, page)
    assert.equal(scripts.length, 0)
  }
})
