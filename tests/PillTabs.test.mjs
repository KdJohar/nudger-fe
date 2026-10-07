import test from 'node:test'
import assert from 'node:assert/strict'
import { vue, loadSource, renderer, node, findAll, registerVuetifyStubs } from './helpers/vueHarness.mjs'

const PillTabs = loadSource('src/components/ui/PillTabs.vue').default
const periods = [{ title: '7 days', value: '7d' }, { title: '30 days', value: '30d' }, { title: '90 days', value: '90d' }]
const types = [{ title: 'Broadcast', value: 'broadcast', icon: 'mdi-bullhorn-outline' }, { title: 'Transactional', value: 'transactional', icon: 'mdi-message-processing-outline' }]

function mount(items, initialValue, copies = 1) {
  const selected = vue.ref(initialValue)
  const events = []
  const root = node('root')
  const selections = []
  const app = renderer.createApp({
    setup: () => () => vue.h('main', Array.from({ length: copies }, (_, index) => vue.h(PillTabs, {
      items, modelValue: selected.value, label: 'Choose a filter', tabsId: 'tabs-' + index, panelId: 'panel-' + index,
      'onUpdate:modelValue': value => { events.push(value); selected.value = value },
    }))),
  })
  registerVuetifyStubs(app, selections)
  app.mount(root)
  return { root, selected, events, select: value => selections[0](value), dispose: () => app.unmount() }
}

test('one shared control renders icon-free periods and icon-bearing types without creating a window', () => {
  for (const [items, value] of [[periods, '30d'], [types, 'broadcast']]) {
    const harness = mount(items, value)
    try {
      assert.equal(findAll(harness.root, element => element.props.role === 'tab').length, items.length)
      assert.equal(findAll(harness.root, element => element.type === 'i').length, items.filter(item => item.icon).length)
      const tablist = findAll(harness.root, element => element.props.role === 'tablist')[0]
      assert.equal(tablist.props['aria-label'], 'Choose a filter')
      assert.equal(tablist.props['slider-transition'], 'grow')
      assert.equal(findAll(harness.root, element => element.props.role === 'tabpanel').length, 0)
      assert.deepEqual(harness.events, [])
    } finally { harness.dispose() }
  }
})

test('selection emits one update without replacing the control', async () => {
  const harness = mount(periods, '30d')
  try {
    const control = findAll(harness.root, element => element.props.role === 'tablist')[0]
    harness.select('7d')
    await vue.nextTick()
    harness.select('7d')
    await vue.nextTick()
    assert.deepEqual(harness.events, ['7d'])
    assert.equal(harness.selected.value, '7d')
    assert.equal(findAll(harness.root, element => element.props.role === 'tablist')[0], control)
  } finally { harness.dispose() }
})

test('disabled, unknown, and empty selections cannot change the filter', async () => {
  const harness = mount([...periods, { title: 'Unavailable', value: 'disabled', disabled: true }], '30d')
  try {
    for (const value of ['disabled', 'unknown', null, undefined, '30d']) harness.select(value)
    await vue.nextTick()
    assert.equal(harness.selected.value, '30d')
    assert.deepEqual(harness.events, [])
  } finally { harness.dispose() }
})

test('tabs use the layout-owned IDs and point to the external shared panel', () => {
  const harness = mount(types, 'broadcast', 2)
  try {
    const tabs = findAll(harness.root, element => element.props.role === 'tab')
    assert.equal(new Set(tabs.map(element => element.props.id)).size, tabs.length)
    for (const tab of tabs) {
      const instance = tab.props.id.startsWith('tabs-0-') ? '0' : '1'
      assert.equal(tab.props['aria-controls'], 'panel-' + instance)
    }
  } finally { harness.dispose() }
})
