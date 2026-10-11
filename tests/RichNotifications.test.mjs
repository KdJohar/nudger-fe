import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader, vue } from './helpers/vueHarness.mjs'
import { notificationCapabilities as caps } from './helpers/notificationFixtures.mjs'
const load = createSourceLoader()
const content = load('src/lib/notificationContent.ts')
const media = load('src/lib/notificationMedia.ts')
const richDraft = () => ({ notificationFormat: 'rich', destinationUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ctaLabel: 'watch_now', mediaUrl: null })
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const flush = async () => { await Promise.resolve(); await vue.nextTick() }

test('Basic omits every Rich key; Rich supports either CTA with and without finalized media', () => {
  for (const ctaLabel of ['watch_now', 'learn_more']) for (const mediaUrl of [null, 'https://assets.example.com/image.webp']) {
    const draft = { ...richDraft(), ctaLabel, mediaUrl }
    assert.deepEqual(content.validateNotificationDraft(draft, caps), {})
    const payload = content.buildNotificationRequest('  Hello 😼  ', draft)
    assert.equal(payload.message, 'Hello 😼')
    assert.equal(payload.cta_label, ctaLabel)
    assert.equal(payload.media_url, mediaUrl || undefined)
    draft.notificationFormat = 'basic'
    assert.deepEqual(content.buildNotificationRequest(' Hello ', draft), { message: 'Hello', notification_format: 'basic' })
  }
})
test('unsafe destinations, invalid CTA, capability denial and incomplete options fail review', () => {
  const urls = ['', 'http://example.com', 'javascript:alert(1)', 'data:text/html,x', 'https://u:p@example.com', 'https://127.0.0.1', 'https://[::1]', 'https://2130706433', 'https://localhost', 'https://api.internal', 'https://bad.local', 'https://example.com:444', 'https://example.com./', 'https://-bad.example.com', 'https://example.com/ has space', 'https://example.com/\\x', 'https://éxample.com', 'https://example.com/' + 'x'.repeat(2048)]
  for (const url of urls) assert.ok(content.validateNotificationDraft({ ...richDraft(), destinationUrl: url }, caps).destinationUrl, url)
  assert.ok(content.safeNotificationUrl('https://example.com:443/path?x=1#section'))
  assert.ok(content.validateNotificationDraft({ ...richDraft(), ctaLabel: 'custom' }, caps).ctaLabel)
  assert.ok(content.validateNotificationDraft(richDraft(), { ...caps, allowed_formats: ['basic'] }).notificationFormat)
  assert.ok(content.validateNotificationDraft(richDraft(), null).notificationFormat)
})
test('YouTube helper recognizes only the supported fixed-provider URL grammar', () => {
  for (const url of ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com/shorts/dQw4w9WgXcQ', 'https://m.youtube.com/embed/dQw4w9WgXcQ', 'https://youtube.com/live/dQw4w9WgXcQ']) assert.equal(content.isYouTubeDestination(url), true)
  for (const url of ['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://example.com', 'https://youtu.be/invalid', 'http://youtube.com/watch?v=dQw4w9WgXcQ']) assert.equal(content.isYouTubeDestination(url), false)
})
test('capabilities and finalized media responses are validated before consumption', async () => {
  assert.deepEqual(await media.getNotificationCapabilities(async () => ({ data: caps })), caps)
  for (const invalid of [null, { ...caps, allowed_formats: [] }, { ...caps, allowed_formats: ['video'] }, { ...caps, max_dimension: 0 }, { ...caps, cta_presets: [{ value: 'custom' }] }]) await assert.rejects(media.getNotificationCapabilities(async () => ({ data: invalid })))
  const asset = { asset_id: 'asset', media_url: 'https://assets.example.com/image.webp', content_type: 'image/webp', size_bytes: 4000, width: 1280, height: 720 }
  assert.equal(media.finalizedMediaUrl({ data: asset }, caps), asset.media_url)
  for (const invalid of [{ ...asset, media_url: 'data:image/png,x' }, { ...asset, width: 1281 }, { ...asset, size_bytes: 1000001 }, { ...asset, content_type: 'text/html' }]) assert.throws(() => media.finalizedMediaUrl({ data: invalid }, caps))
})
test('source images reject spoofed formats, corrupt chunks and animation before conversion', async () => {
  const { readFileSync } = await import('node:fs')
  media.validateNotificationImageBytes(readFileSync(new URL('../public/icon-192.png', import.meta.url)), 'image/png')
  assert.throws(() => media.validateNotificationImageBytes(new TextEncoder().encode('GIF89a'), 'image/png'))
  assert.throws(() => media.validateNotificationImageBytes(new Uint8Array([255, 216]), 'image/jpeg'))
  media.validateNotificationImageBytes(new Uint8Array([255, 216, 255, 224]), 'image/jpeg')
  const animatedPng = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0, 97, 99, 84, 76, 0, 0, 0, 0])
  assert.throws(() => media.validateNotificationImageBytes(animatedPng, 'image/png'), /static image/)
  const animatedWebp = new Uint8Array([82, 73, 70, 70, 12, 0, 0, 0, 87, 69, 66, 80, 65, 78, 73, 77, 0, 0, 0, 0])
  assert.throws(() => media.validateNotificationImageBytes(animatedWebp, 'image/webp'), /static image/)
  await assert.rejects(media.prepareNotificationImage(new File(['<svg />'], 'image.svg', { type: 'image/svg+xml' }), caps), /JPEG/)
  await assert.rejects(media.prepareNotificationImage(new File([], 'empty.png', { type: 'image/png' }), caps), /MB/)
})
function harness() {
  const uploads = [], imports = [], capRequests = [], identity = vue.ref('merchant-one'), scope = vue.effectScope()
  const loader = createSourceLoader({ vue: { ...vue, onMounted() {} }, '../lib/notificationMedia': {
    getNotificationCapabilities: (_request, signal) => { const job = deferred(); capRequests.push({ ...job, signal }); return job.promise },
    prepareNotificationImage: async file => new Blob([file.name], { type: 'image/webp' }),
    uploadNotificationMedia: (_request, blob, _caps, signal) => { const job = deferred(); uploads.push({ ...job, blob, signal }); return job.promise },
    importYouTubeMedia: (_request, url, _caps, signal) => { const job = deferred(); imports.push({ ...job, url, signal }); return job.promise },
  } })
  const model = scope.run(() => loader('src/composables/useNotificationDraft.ts').useNotificationDraft(async () => {}, identity))
  model.capabilities.value = structuredClone(caps)
  Object.assign(model.draft, richDraft())
  return { model, uploads, imports, capRequests, identity, dispose: () => scope.stop() }
}
test('replaced uploads are aborted and late completions cannot overwrite the newer image', async () => {
  const h = harness(), m = h.model
  try {
    const first = m.selectImage(new File(['one'], 'one.png', { type: 'image/png' })); await flush()
    assert.equal(m.validate(), false)
    const second = m.selectImage(new File(['two'], 'two.png', { type: 'image/png' })); await flush()
    assert.equal(h.uploads[0].signal.aborted, true)
    h.uploads[1].resolve('https://assets.example.com/two.webp'); await second
    h.uploads[0].resolve('https://assets.example.com/one.webp'); await first
    assert.equal(m.draft.mediaUrl, 'https://assets.example.com/two.webp')
    assert.equal(m.validate(), true)
  } finally { h.dispose() }
})
test('YouTube URL changes and manual overrides invalidate stale thumbnail work', async () => {
  const h = harness(), m = h.model
  try {
    const first = m.importThumbnail()
    m.draft.destinationUrl = 'https://example.com/article'
    assert.equal(h.imports[0].signal.aborted, true)
    h.imports[0].resolve('https://assets.example.com/stale.webp'); await first
    assert.equal(m.draft.mediaUrl, null)
    m.draft.destinationUrl = richDraft().destinationUrl
    const imported = m.importThumbnail()
    const manual = m.selectImage(new File(['x'], 'manual.png', { type: 'image/png' })); await flush()
    h.uploads[0].resolve('https://assets.example.com/manual.webp'); await manual
    h.imports[1].resolve('https://assets.example.com/youtube.webp'); await imported
    assert.equal(m.draft.mediaUrl, 'https://assets.example.com/manual.webp')
  } finally { h.dispose() }
})
test('failed optional media can retry, be removed or remain image-less Rich; Basic drops it', async () => {
  const h = harness(), m = h.model
  try {
    const failed = m.importThumbnail(); h.imports[0].reject(new Error('Unavailable')); await failed
    assert.match(m.mediaError.value, /Unavailable/)
    assert.equal(m.validate(), true)
    const retry = m.retryMedia(); h.imports[1].resolve('https://assets.example.com/ready.webp'); await retry
    assert.ok(m.draft.mediaUrl)
    m.draft.notificationFormat = 'basic'
    assert.equal(m.draft.mediaUrl, null)
    assert.equal(m.mediaError.value, '')
  } finally { h.dispose() }
})
test('capability retries, account changes and disposal cancel stale state', async () => {
  const h = harness(), m = h.model
  const first = m.loadCapabilities(), second = m.loadCapabilities()
  assert.equal(h.capRequests[0].signal.aborted, true)
  h.capRequests[1].resolve(caps); await second
  h.capRequests[0].reject(new Error('stale')); await first
  assert.equal(m.capabilityError.value, '')
  const pending = m.importThumbnail()
  h.identity.value = 'merchant-two'
  assert.equal(m.draft.notificationFormat, 'basic')
  assert.equal(m.capabilities.value, null)
  h.imports[0].resolve('https://assets.example.com/stale.webp'); await pending
  assert.equal(m.draft.mediaUrl, null)
  m.capabilities.value = caps; m.draft.notificationFormat = 'rich'
  const late = m.importThumbnail(); h.dispose()
  assert.equal(h.imports[1].signal.aborted, true)
  h.imports[1].resolve('https://assets.example.com/late.webp'); await late
  assert.equal(m.draft.mediaUrl, null)
})
test('Rich broadcast confirmation freezes all content fields, not just text', async () => {
  let payload
  const scope = vue.effectScope()
  const profile = vue.ref({ id: 'one', display_name: 'Studio', is_active: true })
  const model = scope.run(() => createSourceLoader({ vue: { ...vue, onMounted() {} } })('src/composables/useBroadcastComposer.ts').useBroadcastComposer(profile, async (_path, init) => { payload = JSON.parse(init.body); return { data: { status: 'queued' } } }))
  try {
    model.notification.capabilities.value = caps; Object.assign(model.notification.draft, richDraft(), { mediaUrl: 'https://assets.example.com/image.webp' }); model.message.value = 'Hello'
    assert.equal(model.handleReview(), true)
    model.notification.draft.destinationUrl = 'https://other.example.com'; model.notification.draft.mediaUrl = null; model.notification.draft.ctaLabel = 'learn_more'
    assert.equal(await model.handleSend(), true)
    assert.equal(payload.destination_url, richDraft().destinationUrl)
    assert.equal(payload.cta_label, 'watch_now')
    assert.equal(payload.media_url, 'https://assets.example.com/image.webp')
  } finally { scope.stop() }
})
test('Rich API examples in every language include content and preserve delivery targeting', () => {
  const api = createSourceLoader({ './apiUrl': { resolveApiUrl: path => 'https://api.example.com' + path } })('src/lib/nudgeApi.ts')
  for (const nudgeType of ['broadcast', 'transactional']) for (const language of ['curl', 'javascript', 'python', 'go', 'java']) {
    const request = api.buildApiNudgeRequest({ message: 'New tutorial 👋', nudgeType, recipientId: '123456' }, { ...richDraft(), mediaUrl: 'https://assets.example.com/image.webp' })
    const example = api.buildNudgeExample(request, language, 'fixture-token')
    for (const field of ['notification_format', 'destination_url', 'cta_label', 'media_url']) assert.ok(example.includes(field))
    assert.equal(request.nudge_user_id, nudgeType === 'transactional' ? 123456 : undefined)
  }
  assert.deepEqual(api.validateApiNudge({ message: '  ' + '😼'.repeat(4096) + '  ', nudgeType: 'broadcast', recipientId: '' }), {})
})
test('server content validation remains editable without automatically retrying a rejected send', async () => {
  const loader = createSourceLoader({ vue: { ...vue, onMounted() {} } })
  const { ApiError } = loader('src/lib/api.ts'), scope = vue.effectScope()
  let sends = 0
  const model = scope.run(() => loader('src/composables/useBroadcastComposer.ts').useBroadcastComposer(vue.ref({ id: 'one', display_name: 'Studio', is_active: true }), async () => {
    sends++; throw new ApiError('Image expired', 422, undefined, false, { media_url: 'Upload this image again.' })
  }))
  try {
    model.notification.capabilities.value = caps; Object.assign(model.notification.draft, richDraft()); model.message.value = 'Hello'
    assert.equal(model.handleReview(), true); assert.equal(await model.handleSend(), false)
    assert.equal(model.isReviewing.value, false); assert.equal(model.notification.errors.value.mediaUrl, 'Upload this image again.')
    assert.equal(model.message.value, 'Hello'); assert.equal(sends, 1)
  } finally { scope.stop() }
})
test('a pending broadcast result cannot become success feedback for a switched merchant', async () => {
  const pending = deferred(), scope = vue.effectScope(), profile = vue.ref({ id: 'one', display_name: 'Studio', is_active: true })
  const model = scope.run(() => createSourceLoader({ vue: { ...vue, onMounted() {} } })('src/composables/useBroadcastComposer.ts').useBroadcastComposer(profile, async () => pending.promise))
  try {
    model.notification.capabilities.value = caps; model.message.value = 'Old owner'; model.handleReview()
    const sending = model.handleSend(); profile.value = { ...profile.value, id: 'two' }
    assert.equal(model.message.value, ''); pending.resolve({ data: { status: 'queued' } })
    assert.equal(await sending, false); assert.equal(model.isQueued.value, false)
  } finally { scope.stop() }
})
