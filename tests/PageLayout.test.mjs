import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { vue, loadSource, renderer, node, findAll, byClass, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const PageLayout = loadSource('src/components/ui/PageLayout.vue').default
const { createPageLayoutState, usePagePresentation } = loadSource('src/composables/usePageLayout.ts')
const { WORKSPACE_PAGES } = loadSource('src/data/workspacePages.ts')
const periods = [{ title: '7 days', value: '7d' }, { title: '30 days', value: '30d' }, { title: '90 days', value: '90d' }]
const types = [{ title: 'Broadcast', value: 'broadcast' }, { title: 'Transactional', value: 'transactional' }]

function mountLayout() {
  const activePage = vue.ref('audience')
  const isCreator = vue.ref(false)
  const mounts = { audience: 0, nudges: 0 }
  const makeBody = (name, items, initial) => vue.defineComponent({
    setup() {
      mounts[name]++
      const selected = vue.ref(initial)
      usePagePresentation(() => ({
        metadata: [{ label: name + ' metadata' }],
        filter: name === 'nudges' && isCreator.value ? undefined : {
          label: name + ' filter', items, modelValue: selected.value,
          onSelect: value => { selected.value = value },
        },
      }))
      return () => vue.h('article', { 'data-page': name }, selected.value)
    },
  })
  const views = {
    audience: makeBody('audience', periods, '30d'),
    nudges: makeBody('nudges', types, 'broadcast'),
    profile: () => vue.h('article', { 'data-page': 'profile' }, 'Profile form'),
    compose: () => vue.h('article', { 'data-page': 'compose' }, 'Message form'),
    token: () => vue.h('article', { 'data-page': 'token' }, 'Token status'),
  }
  const root = node('root')
  const app = renderer.createApp({
    setup: () => () => vue.h(PageLayout, {
      pageKey: activePage.value, definition: WORKSPACE_PAGES[activePage.value],
    }, { default: () => vue.h(views[activePage.value], { key: activePage.value }) }),
  })
  registerVuetifyStubs(app)
  app.mount(root)
  return { root, activePage, isCreator, mounts, dispose: () => app.unmount() }
}
async function settle() { await vue.nextTick(); await vue.nextTick() }

test('all five routes retain the same header, filter structure, window and container instances', async () => {
  const harness = mountLayout()
  try {
    await settle()
    const sharedClasses = ['page-layout', 'header', 'header__content', 'header__filters', 'ui-pill-tabs', 'v-slide-group__container', 'v-slide-group__content', 'page-layout__window', 'v-window__container']
    const original = Object.fromEntries(sharedClasses.map(name => [name, byClass(harness.root, name)[0]]))
    for (const page of ['nudges', 'compose', 'profile', 'token', 'audience']) {
      harness.activePage.value = page
      await settle()
      for (const name of sharedClasses) {
        assert.equal(byClass(harness.root, name).length, 1, name + ' must not duplicate')
        assert.equal(byClass(harness.root, name)[0], original[name], name + ' must stay mounted')
      }
      assert.equal(findAll(harness.root, element => element.type === 'h1').length, 1)
      assert.equal(findAll(harness.root, element => element.type === 'h1')[0].text, WORKSPACE_PAGES[page].title)
      assert.equal(findAll(harness.root, element => element.props['data-page']).length, 1)
      assert.equal(findAll(original['v-window__container'], element => element.props['data-page'] === page).length, 1)
    }
  } finally { harness.dispose() }
})

test('filter updates preserve body state and label the shared panel with the selected tab', async () => {
  const harness = mountLayout()
  try {
    await settle()
    const panel = byClass(harness.root, 'v-window-item')[0]
    const body = findAll(harness.root, element => element.props['data-page'] === 'audience')[0]
    const firstTab = findAll(harness.root, element => element.props.role === 'tab')[0]
    firstTab.props.onClick()
    await settle()
    assert.equal(harness.mounts.audience, 1)
    assert.equal(findAll(harness.root, element => element.props['data-page'] === 'audience')[0], body)
    assert.equal(body.text, '7d')
    assert.equal(panel.props['aria-labelledby'], firstTab.props.id)
    assert.equal(firstTab.props['aria-controls'], panel.props.id)
  } finally { harness.dispose() }
})

test('creators and unfiltered pages hide controls without replacing the shared structure', async () => {
  const harness = mountLayout()
  try {
    const filters = byClass(harness.root, 'header__filters')[0]
    harness.activePage.value = 'nudges'
    harness.isCreator.value = true
    await settle()
    assert.equal(filters.props.hidden, true)
    assert.equal(findAll(filters, element => element.props.role === 'tab').length, 0)
    assert.equal(byClass(harness.root, 'v-window-item')[0].props.role, 'region')
    harness.activePage.value = 'profile'
    await settle()
    assert.equal(byClass(harness.root, 'header__filters')[0], filters)
    assert.equal(filters.props.hidden, true)
  } finally { harness.dispose() }
})

test('late updates and cleanup from a departing route cannot overwrite the next header', () => {
  const page = vue.ref('audience')
  const layout = createPageLayoutState(page)
  const oldLabel = vue.ref('Audience')
  const unregisterOld = layout.register(vue.computed(() => ({ metadata: [{ label: oldLabel.value }] })))
  page.value = 'nudges'
  assert.deepEqual(layout.presentation.value, {})
  const unregisterNext = layout.register(vue.computed(() => ({ metadata: [{ label: 'Nudges' }] })))
  oldLabel.value = 'Late audience response'
  unregisterOld()
  assert.equal(layout.presentation.value.metadata[0].label, 'Nudges')
  unregisterNext()
  assert.deepEqual(layout.presentation.value, {})
})

test('layout rejects duplicate, unavailable and unknown filter selections', () => {
  const page = vue.ref('audience')
  const selected = vue.ref('30d')
  const events = []
  const layout = createPageLayoutState(page)
  layout.register(vue.computed(() => ({
    filter: {
      label: 'Period', items: [...periods, { title: 'Unavailable', value: 'disabled', disabled: true }],
      modelValue: selected.value, onSelect(value) { events.push(value); selected.value = value },
    },
  })))
  for (const value of ['30d', 'unknown', 'disabled', '7d', '7d']) layout.selectFilter(value)
  assert.deepEqual(events, ['7d'])
})

test('workspace bodies cannot reintroduce page headers, tab bars or content windows', () => {
  for (const file of ['views/NudgesView.vue', 'views/ComposeNudgeView.vue', 'views/TokenView.vue', 'views/ProfileView.vue', 'components/audience/AudienceOverview.vue']) {
    const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /<(?:header|PageHeader|SectionHeader|PageLayout|PillTabs|v-tabs|v-window)\b/, file)
    assert.doesNotMatch(source, /class="[^"]*\bpage-view\b/, file)
  }
  const manager = readFileSync(new URL('../src/components/profile/MerchantProfileManager.vue', import.meta.url), 'utf8')
  assert.match(manager, /v-if="mode !== 'profile'" class="section-header/)
})

test('mobile shell has no app bar and the shared window owns content scrolling', () => {
  const shell = readFileSync(new URL('../src/layouts/AppShell.vue', import.meta.url), 'utf8')
  const bars = shell.match(/<v-app-bar(?=[\s>])[^>]*>/g) ?? []
  assert.equal(bars.length, 0)
  assert.match(shell, /@content-scroll="handleContentScroll"/)
  assert.doesNotMatch(shell, /window\.addEventListener\('scroll'/)
  const styles = readFileSync(new URL('../src/styles/main.css', import.meta.url), 'utf8')
  const offsets = [...styles.matchAll(/--page-sticky-offset:\s*([^;]+);/g)].map(match => match[1])
  assert.deepEqual(offsets, ['0px'])
})
