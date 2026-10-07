import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createSourceLoader, vue, renderer, node, findAll } from './helpers/vueHarness.mjs'

test('history FAB is a desktop route link and a mobile sheet action, including after resize', async () => {
  const smAndDown = vue.ref(false)
  const load = createSourceLoader({
    vuetify: { useDisplay: () => ({ smAndDown }) },
    '../composables/useAuth': { useAuth: () => ({ state: { merchantProfile: { profile_type: 'platform' } } }) },
    '../composables/useNudgeHistory': { useNudgeHistory: () => ({
      items: vue.ref([]), nextLink: vue.ref(null), isLoading: vue.ref(false), isLoadingMore: vue.ref(false),
      errorMessage: vue.ref(''), loadHistory() {},
    }) },
    '../composables/usePageLayout': { usePagePresentation() {} },
    '../components/nudges/NudgeHistoryPanel.vue': { default: () => vue.h('div') },
    '../components/nudges/NudgeComposerSheet.vue': { default: {
      props: ['modelValue'],
      setup: props => () => vue.h('div', { 'data-sheet-open': props.modelValue }),
    } },
  })
  const NudgesView = load('src/views/NudgesView.vue').default
  const root = node('root')
  const app = renderer.createApp(NudgesView)
  app.component('VBtn', (props, { slots }) => vue.h('button', props, slots.default?.()))
  app.component('VAlert', (props, { slots }) => vue.h('div', props, slots.default?.()))
  app.mount(root)
  const fab = () => findAll(root, el => el.props['aria-label'] === 'Send a nudge')[0]
  const sheet = () => findAll(root, el => 'data-sheet-open' in el.props)[0]
  try {
    assert.equal(fab().props.to, '/compose')
    assert.equal(fab().props['aria-haspopup'], undefined)
    fab().props.onClick()
    await flush()
    assert.equal(sheet().props['data-sheet-open'], false)

    smAndDown.value = true
    await flush()
    assert.equal(fab().props.to, undefined)
    assert.equal(fab().props['aria-haspopup'], 'dialog')
    assert.equal(findAll(root, el => el.props['aria-label'] === 'Send a nudge').length, 1)
    fab().props.onClick()
    await flush()
    assert.equal(sheet().props['data-sheet-open'], true)

    smAndDown.value = false
    await flush()
    assert.equal(fab().props.to, '/compose')
    // Resizing must not discard an already-open mobile draft.
    assert.equal(sheet().props['data-sheet-open'], true)
  } finally { app.unmount() }
})

const flush = async () => { await Promise.resolve(); await vue.nextTick() }
function harness() {
  const requests = []
  const profile = vue.ref({ id: 'fixture', display_name: 'Demo Creator', is_active: true, profile_type: 'creator' })
  const request = (path, init) => new Promise((resolve, reject) => requests.push({ path, init, resolve, reject }))
  const scope = vue.effectScope()
  const model = scope.run(() => createSourceLoader()('src/composables/useBroadcastComposer.ts').useBroadcastComposer(profile, request))
  return { model, profile, requests, dispose: () => scope.stop() }
}

test('broadcast composer validates empty and oversized messages without sending', () => {
  const h = harness(), m = h.model
  try {
    for (const message of ['', ' \n ', 'x'.repeat(4097)]) {
      m.message.value = message
      assert.equal(m.handleReview(), false)
      assert.ok(m.fieldError.value)
      assert.equal(m.isReviewing.value, false)
    }
    m.message.value = 'x'.repeat(4096)
    assert.equal(m.handleReview(), true)
    assert.equal(m.fieldError.value, '')
    assert.equal(h.requests.length, 0)
  } finally { h.dispose() }
})

test('review freezes the trimmed message; sending requires confirmation and prevents duplicates', async () => {
  const h = harness(), m = h.model
  try {
    m.message.value = ' Hello subscribers 😼 \n'
    assert.equal(await m.handleSend(), false)
    assert.equal(m.handleReview(), true)
    m.message.value = 'Unreviewed edit'
    const pending = m.handleSend()
    assert.equal(m.isSending.value, true)
    assert.equal(await m.handleSend(), false)
    assert.equal(m.handleReview(), false)
    m.handleReset()
    m.handleEdit()
    assert.equal(m.isReviewing.value, true)
    assert.equal(h.requests.length, 1)
    assert.equal(h.requests[0].path, '/v1/app-nudger/nudge/broadcast')
    assert.equal(h.requests[0].init.method, 'POST')
    assert.deepEqual(JSON.parse(h.requests[0].init.body), { message: 'Hello subscribers 😼' })
    h.requests[0].resolve({ data: { status: 'queued' } })
    assert.equal(await pending, true)
    assert.equal(m.isQueued.value, true)
    assert.equal(m.isReviewing.value, false)
    assert.equal(m.isSending.value, false)
    assert.equal(await m.handleSend(), false)
  } finally { h.dispose() }
})

test('editing a confirmation keeps the draft and requires a new review', async () => {
  const h = harness(), m = h.model
  try {
    m.message.value = 'Original'
    m.handleReview()
    m.handleEdit()
    assert.equal(m.message.value, 'Original')
    assert.equal(m.isReviewing.value, false)
    m.message.value = 'Revised'
    assert.equal(await m.handleSend(), false)
    m.handleReview()
    assert.equal(m.confirmedMessage.value, 'Revised')
  } finally { h.dispose() }
})

test('a failed send preserves the draft, allows explicit retry, and never retries automatically', async () => {
  const h = harness(), m = h.model
  try {
    m.message.value = 'Keep this draft'
    m.handleReview()
    const first = m.handleSend()
    h.requests[0].reject(new Error('Queue unavailable'))
    assert.equal(await first, false)
    assert.equal(m.message.value, 'Keep this draft')
    assert.equal(m.sendError.value, 'Queue unavailable')
    assert.equal(m.isReviewing.value, true)
    assert.equal(m.isQueued.value, false)
    assert.equal(h.requests.length, 1)
    const retry = m.handleSend()
    assert.equal(m.sendError.value, '')
    h.requests[1].resolve({ data: { status: 'queued' } })
    assert.equal(await retry, true)
    m.handleReset()
    assert.equal(m.message.value, '')
    assert.equal(m.confirmedMessage.value, '')
    assert.equal(m.isQueued.value, false)
  } finally { h.dispose() }
})

test('both creator and platform may broadcast; missing or inactive profiles cannot send', async () => {
  const h = harness(), m = h.model
  try {
    m.message.value = 'Hello'
    for (const profile of [null, { display_name: '', is_active: true }, {display_name:'Inactive',is_active:false}, {display_name:'x'.repeat(121),is_active:true}]) {
      h.profile.value = profile
      assert.equal(m.isProfileReady.value, false)
      assert.equal(m.handleReview(), false)
      assert.equal(await m.handleSend(), false)
    }
    for (const profile_type of ['creator','platform']) {
      h.profile.value = { display_name:'Sender',is_active:true,profile_type }
      assert.equal(m.handleReview(), true)
      m.handleEdit()
    }
    h.profile.value.is_active = false
    assert.equal(await m.handleSend(), false)
    assert.equal(h.requests.length,0)
  } finally { h.dispose() }
})

test('leaving the composer ignores late success/failure responses', async () => {
  for (const fail of [false,true]) {
    const h = harness(), m = h.model
    m.message.value = 'Pending message'
    m.handleReview()
    const pending = m.handleSend()
    h.dispose()
    if (fail) h.requests[0].reject(new Error('Late error'))
    else h.requests[0].resolve({ data:{status:'queued'} })
    assert.equal(await pending,false)
    assert.equal(m.isQueued.value,false)
    assert.equal(m.sendError.value,'')
    assert.equal(await m.handleSend(),false)
  }
})

test('editing clears field errors without clearing the message', async () => {
  const h = harness(), m = h.model
  try {
    m.handleReview()
    assert.ok(m.fieldError.value)
    m.message.value = 'Fixed'
    await flush()
    assert.equal(m.fieldError.value,'')
    assert.equal(m.characterCount.value,5)
  } finally {h.dispose()}
})

test('shared message field associates its visible label, limit, helper and validation error', async () => {
  const MessageField = createSourceLoader()('src/components/ui/MessageField.vue').default
  const updates = [], props = vue.reactive({modelValue:'Hello',limit:4096,error:'',isDisabled:false})
  const root = node('root')
  const app = renderer.createApp({setup:()=>()=>vue.h(MessageField,{...props,'onUpdate:modelValue':value=>updates.push(value)})})
  app.mount(root)
  try {
    const input = findAll(root, el=>el.type==='textarea')[0]
    const label = findAll(root, el=>el.type==='label')[0]
    assert.equal(label.props.for,input.props.id)
    assert.equal(input.props.name,'message')
    assert.equal(input.props.rows,'3')
    assert.equal(input.props.maxlength,4096)
    assert.equal(input.props['aria-invalid'],false)
    input.props.onInput({target:{value:'New text'}})
    assert.deepEqual(updates,['New text'])
    props.error = 'Write a message.'
    props.isDisabled = true
    await flush()
    assert.equal(input.props.disabled,true)
    assert.equal(input.props['aria-invalid'],true)
    const describedIds=input.props['aria-describedby'].split(' ')
    assert.equal(describedIds.length,2)
    assert.ok(describedIds.every(id=>findAll(root,el=>el.props.id===id).length===1))
  } finally {app.unmount()}
})

test('page and sheet share the same broadcast state and field while the route stays body-only', () => {
  for (const file of ['BroadcastComposer','NudgeComposerSheet']) {
    const source=readFileSync(new URL('../src/components/nudges/'+file+'.vue',import.meta.url),'utf8')
    assert.match(source,/useBroadcastComposer\(profile, authenticatedRequest\)/)
    assert.match(source,/<MessageField/)
    assert.match(source,/<NotificationPreview/)
    assert.doesNotMatch(source,/<style|:style=|\sstyle=/)
  }
  const route=readFileSync(new URL('../src/views/ComposeNudgeView.vue',import.meta.url),'utf8')
  assert.match(route,/<BroadcastComposer \/>/)
  assert.doesNotMatch(route,/<header|<main|<v-window|<PageHeader|<PillTabs/)
})
