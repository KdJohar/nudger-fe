import test from 'node:test'
import assert from 'node:assert/strict'
import { vue, createSourceLoader, renderer, node, byClass, registerVuetifyStubs } from './helpers/vueHarness.mjs'

function mountOverview(current = 3, previous = 2) {
  const overview = vue.ref({ period: '30d', total_audience: 42, new_subscribers: current,
    reachable_subscribers: 40, muted_subscribers: 2, broadcast_reach: 40, transactional_reach: 40,
    breakdown: { broadcast_subscribed: 42, broadcast_unsubscribed: 0, transactional_subscribed: 42, transactional_unsubscribed: 0 },
    comparison: { current: { unsubscribed_users: 1, unsubscribe_rate: 2 }, previous: { total_audience: 12, new_subscribers: previous } },
    trend: [], comparison_trend: [], generated_at: '2026-10-14T00:00:00Z' })
  const state = { overview, period: vue.ref('30d'), isLoading: vue.ref(false), errorMessage: vue.ref(null), loadOverview() {} }
  const load = createSourceLoader({
    '../../composables/useAudienceOverview': { useAudienceOverview: () => state },
    '../../composables/usePageLayout': { usePagePresentation() {} },
    '../ui/LineChart.vue': { default: () => vue.h('div', { 'data-chart': true }) },
  })
  const root = node('root')
  const app = renderer.createApp(load('src/components/audience/AudienceOverview.vue').default)
  registerVuetifyStubs(app)
  for (const name of ['VSkeletonLoader', 'VProgressCircular', 'VProgressLinear']) {
    app.component(name, props => vue.h('div', props))
  }
  app.mount(root)
  return { root, overview, state, dispose: () => app.unmount() }
}

function textContent(element) {
  return element.text + element.children.map(textContent).join('')
}

test('live Total audience has no comparison; only New subscribers compares the preceding period', async () => {
  const harness = mountOverview()
  try {
    const original = byClass(harness.root, 'ui-stat')[0]
    for (const period of ['7d', '30d', '90d']) {
      harness.overview.value = { ...harness.overview.value, period }
      await vue.nextTick()
      const cards = byClass(harness.root, 'ui-stat')
      assert.equal(cards.length, 4)
      assert.equal(cards[0], original, 'The shared card must not remount on period changes')
      assert.equal(byClass(cards[0], 'ui-stat__change').length, 0)
      assert.equal(textContent(byClass(cards[0], 'ui-stat__detail')[0]), 'Currently active subscribers')
      assert.equal(textContent(byClass(cards[0], 'ui-stat__value')[0]), '4242')
      assert.equal(byClass(harness.root, 'ui-stat__change').length, 1)
      assert.equal(textContent(byClass(cards[1], 'ui-stat__change')[0]), '+50.0%')
      assert.equal(textContent(byClass(cards[1], 'ui-stat__detail')[0]), `vs previous ${period.slice(0, -1)} days`)
    }
  } finally { harness.dispose() }
})

test('New subscribers compares increase, decrease, unchanged and zero baselines without invalid percentages', () => {
  for (const [current, previous, expected] of [[3, 2, '+50.0%'], [1, 2, '-50.0%'], [2, 2, 'No change'], [0, 2, '-100.0%'], [3, 0, 'New this period'], [0, 0, 'No change']]) {
    const harness = mountOverview(current, previous)
    try {
      assert.equal(textContent(byClass(harness.root, 'ui-stat__change')[0]), expected)
      assert.doesNotMatch(textContent(harness.root), /NaN|Infinity/)
    } finally { harness.dispose() }
  }
})

test('failed/in-flight refresh retains the loaded period and its comparison', async () => {
  const harness = mountOverview()
  try {
    harness.state.period.value = '7d'
    harness.state.isLoading.value = true
    await vue.nextTick()
    assert.equal(textContent(byClass(harness.root, 'ui-stat__detail')[1]), 'vs previous 30 days')
    harness.state.isLoading.value = false
    harness.state.errorMessage.value = 'Fixture failure'
    await vue.nextTick()
    assert.equal(textContent(byClass(harness.root, 'ui-stat__detail')[1]), 'vs previous 30 days')
  } finally { harness.dispose() }
})
