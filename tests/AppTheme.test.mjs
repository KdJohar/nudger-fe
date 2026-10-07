import test from 'node:test'
import assert from 'node:assert/strict'
import { vue, createSourceLoader, renderer, node } from './helpers/vueHarness.mjs'

const { createAppThemeState } = createSourceLoader()('src/lib/appTheme.ts')
const key = 'plug-nudge-theme'

function browserFixture(saved = null, isDark = false) {
  const mediaListeners = new Set(), storageListeners = new Set(), writes = []
  const media = { matches: isDark, addEventListener: (_, fn) => mediaListeners.add(fn), removeEventListener: (_, fn) => mediaListeners.delete(fn) }
  const localStorage = { getItem: () => saved, setItem: (name, value) => { writes.push([name, value]); saved = value } }
  const browser = { matchMedia: query => { assert.equal(query, '(prefers-color-scheme: dark)'); return media }, localStorage,
    addEventListener: (_, fn) => storageListeners.add(fn), removeEventListener: (_, fn) => storageListeners.delete(fn) }
  return { browser, writes, mediaListeners, storageListeners,
    changeSystem(value) { media.matches = value; for (const callback of mediaListeners) callback({ matches: value }) },
    changeStorage(value, name = key, area = localStorage) { for (const callback of storageListeners) callback({ key: name, newValue: value, storageArea: area }) },
  }
}

test('System is the default and follows OS changes with one listener', () => {
  const fixture = browserFixture(null, true), active = vue.ref('light'), state = createAppThemeState(active, fixture.browser)
  state.initializeTheme(); state.initializeTheme()
  assert.equal(state.preference.value, 'system'); assert.equal(active.value, 'dark')
  assert.equal(fixture.mediaListeners.size, 1); assert.equal(fixture.storageListeners.size, 1)
  fixture.changeSystem(false); assert.equal(active.value, 'light')
  assert.deepEqual(fixture.writes, [])
  state.dispose(); assert.equal(fixture.mediaListeners.size, 0); assert.equal(fixture.storageListeners.size, 0)
})

test('explicit existing choices survive initialization; System can be restored', () => {
  for (const preference of ['light', 'dark']) {
    const fixture = browserFixture(preference, preference !== 'dark'), active = vue.ref('light'), state = createAppThemeState(active, fixture.browser)
    state.initializeTheme(); assert.equal(state.preference.value, preference); assert.equal(active.value, preference)
    fixture.changeSystem(true); fixture.changeSystem(false); assert.equal(active.value, preference)
    state.setTheme('system'); fixture.changeSystem(true); assert.equal(active.value, 'dark')
    assert.deepEqual(fixture.writes, [[key, 'system']]); state.dispose()
  }
})

test('quick toggles explicitly select the opposite resolved theme and persist it', () => {
  const fixture = browserFixture(null, true), state = createAppThemeState(vue.ref('light'), fixture.browser)
  state.initializeTheme(); state.toggleTheme()
  assert.equal(state.preference.value, 'light'); assert.equal(state.isDark.value, false)
  fixture.changeSystem(false); fixture.changeSystem(true); assert.equal(state.themeName.value, 'light')
  state.toggleTheme(); assert.equal(state.preference.value, 'dark')
  assert.deepEqual(fixture.writes, [[key, 'light'], [key, 'dark']]); state.dispose()
})

test('other tabs synchronize choices, removal and clear without echoing writes', () => {
  const fixture = browserFixture('light', true), state = createAppThemeState(vue.ref('light'), fixture.browser)
  state.initializeTheme(); fixture.changeStorage('dark'); assert.equal(state.preference.value, 'dark')
  fixture.changeStorage('light', 'unrelated'); fixture.changeStorage('light', key, {})
  assert.equal(state.preference.value, 'dark')
  fixture.changeStorage(null); assert.equal(state.preference.value, 'system'); assert.equal(state.isDark.value, true)
  fixture.changeStorage('light'); fixture.changeStorage(null, null); assert.equal(state.preference.value, 'system')
  assert.deepEqual(fixture.writes, []); state.dispose()
})

test('invalid storage, blocked storage and no browser still allow safe appearance changes', () => {
  const invalid = browserFixture('unexpected', true), state = createAppThemeState(vue.ref('light'), invalid.browser)
  state.initializeTheme(); assert.equal(state.preference.value, 'system'); assert.equal(state.isDark.value, true); state.dispose()
  const fixture = browserFixture()
  Object.defineProperty(fixture.browser, 'localStorage', { get() { throw new Error('Storage blocked') } })
  const blocked = createAppThemeState(vue.ref('light'), fixture.browser)
  blocked.initializeTheme(); blocked.setTheme('dark'); assert.equal(blocked.isDark.value, true); blocked.dispose()
  const server = createAppThemeState(vue.ref('light'))
  server.initializeTheme(); server.setTheme('dark'); assert.equal(server.isDark.value, true); server.dispose()
})

test('provider shares state across mounted consumers and cleans up at app unmount', () => {
  const previous = globalThis.window, fixture = browserFixture(null, true), active = vue.ref('light')
  globalThis.window = fixture.browser
  const source = createSourceLoader({ vuetify: { useTheme: () => ({ global: { name: active } }) } })
  const { provideAppTheme, useAppTheme } = source('src/composables/useAppTheme.ts'), consumers = []
  const Child = { setup() { consumers.push(useAppTheme()); return () => vue.h('span') } }
  const app = renderer.createApp({ setup() { provideAppTheme(); return () => vue.h('div', [vue.h(Child), vue.h(Child)]) } })
  try {
    app.mount(node('root'))
    assert.equal(consumers[0], consumers[1]); assert.equal(fixture.mediaListeners.size, 1)
    consumers[0].setTheme('light'); assert.equal(consumers[1].preference.value, 'light')
  } finally { app.unmount(); globalThis.window = previous }
  assert.equal(fixture.mediaListeners.size, 0); assert.equal(fixture.storageListeners.size, 0)
})
