import assert from 'node:assert/strict'
import { readFileSync, mkdirSync } from 'node:fs'
import { notificationCapabilities } from '../helpers/notificationFixtures.mjs'
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const { default: AxeBuilder } = await import(process.env.AXE_MODULE || '@axe-core/playwright')
const browser = process.env.BROWSER_ENGINE === 'webkit' ? await webkit.launch({ headless: true }) : await chromium.launch({ headless: true, channel: 'chrome' })
const base = process.env.UI_BASE_URL || 'http://localhost:5174'
const output = process.env.RICH_SCREENSHOT_DIR || '/tmp/nudger-rich-qa'
const widths = (process.env.RICH_VIEWPORTS || '320,375,414,768,1440').split(',').map(Number)
mkdirSync(output, { recursive: true })
const image = readFileSync(new URL('../../public/icon-192.png', import.meta.url))
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Studio Notes', nudger_id: 'studio-notes', profile_type: 'platform', is_active: true, profile_image_url: '/icon-192.png' }
const richHistory = { id: 'fixture-nudge', title: profile.display_name, message: 'A new tutorial is ready.', sender: 'platform', nudge_type: 'broadcast', status: 'completed', created_at: new Date().toISOString(), completed_at: new Date().toISOString(), stats: { total_audience: 0, total_devices: 0, delivered_users: 0, muted_users: 0, failed_deliveries: 0 }, notification_format: 'rich', destination_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', cta_label: 'watch_now', media_url: 'https://assets.example.com/ready.webp' }
const errors = []
async function select(page, name) {
  const radio = page.getByRole('radio', { name, exact: typeof name === 'string' })
  await radio.locator('..').click()
  assert.ok(await radio.isChecked())
}
async function setup(width, theme, options = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, colorScheme: theme, reducedMotion: 'reduce', hasTouch: width < 960 })
  const calls = [], controls = { failImport: false, failCapabilities: false, failSend: false, uploadCount: 0, uploadMime: 'image/webp' }
  await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-refresh'))
  await context.addInitScript(() => {
    const send = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function(body) {
      if (body instanceof Blob) (window.__fixtureUploads ||= []).push({ size: body.size, type: body.type })
      return send.call(this, body)
    }
  })
  await context.route('**/runtime-config.js', route => route.fulfill({ contentType: 'application/javascript', body: 'window.__NUDGER_CONFIG__={apiBaseUrl:"/",profileImageSourceMaxBytes:10485760,profileImageFinalMaxBytes:1000000,profileImageMaxDimension:1280,profileImageWebpQuality:0.86}' }))
  await context.route('https://assets.example.com/**', route => route.fulfill({ contentType: 'image/png', body: image }))
  await context.route('https://storage.example.com/**', route => {
    assert.equal(route.request().method(), 'PUT')
    assert.equal(route.request().headers().authorization, undefined)
    assert.equal(route.request().headers().cookie, undefined)
    assert.equal(route.request().headers()['content-type'], controls.uploadMime)
    assert.ok(['image/webp', 'image/png'].includes(controls.uploadMime))
    // WebKit's protocol omits Blob request bodies. Inspect the actual Blob at
    // the browser boundary below rather than confusing this with an empty PUT.
    const body = route.request().postDataBuffer()
    if (body) assert.ok(body.length <= (controls.uploadMime === 'image/webp' ? notificationCapabilities.final_max_bytes : notificationCapabilities.source_max_bytes))
    else assert.equal(process.env.BROWSER_ENGINE, 'webkit')
    controls.uploadCount++
    return route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' })
  })
  await context.route('**/v1/**', route => {
    const request = route.request(), path = new URL(request.url()).pathname, payload = request.postData() ? request.postDataJSON() : null
    calls.push({ path, method: request.method(), payload })
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ message: status >= 400 ? `Request failed with status ${status}` : 'Fixture', data, errors: {} }) })
    const merchant = { ...profile, profile_type: options.creator ? 'creator' : 'platform' }
    if (path.endsWith('/refresh')) return respond({ auth: { access_token: 'fixture-session', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Studio', email: 'fixture@example.test' }, merchant_profile: merchant })
    if (path.endsWith('/profile')) return respond(merchant)
    if (path.endsWith('/capabilities')) return respond(controls.failCapabilities ? null : { ...notificationCapabilities, delivery_types: options.creator ? ['broadcast'] : ['broadcast', 'transactional'] })
    if (path.endsWith('/media/presign')) { controls.uploadMime = payload.content_type; return respond({ asset_id: 'asset', method: 'PUT', upload_url: 'https://storage.example.com/asset?signature=fixture', headers: { 'Content-Type': controls.uploadMime }, expires_in: 300 }) }
    if (path.endsWith('/media/finalize') || path.endsWith('/media/youtube')) return respond(controls.failImport ? null : { asset_id: 'asset', media_url: 'https://assets.example.com/ready.webp', content_type: 'image/webp', size_bytes: 8000, width: 192, height: 192 }, controls.failImport ? 503 : 200)
    if (path.endsWith('/nudge/broadcast') || path.endsWith('/nudge/send')) return respond(controls.failSend ? null : { status: 'queued', message_id: 'fixture-message', merchant_profile_id: merchant.id, nudge_type: payload?.nudge_type }, controls.failSend ? 503 : 202)
    if (path.endsWith('/nudges')) return respond({ items: [richHistory], next: null, page_size: 20 })
    if (path.endsWith('/token')) return respond({ has_token: true, token: 'nudge_live_fixture', token_prefix: 'fixture', created_at: new Date().toISOString(), rotated_at: null })
    errors.push(`Unexpected fixture request: ${request.method()} ${path}`)
    return respond(null, 404)
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  return { context, page, calls, controls }
}
async function checkFrame(page, width) {
  const dimensions = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }))
  assert.ok(dimensions.document <= dimensions.viewport + 1, `No horizontal overflow at ${width}`)
  assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1)
  if (width < 960) {
    assert.equal(Math.round((await page.locator('.header__content').boundingBox()).height), 1)
    assert.equal(await page.locator('.v-toolbar__content').count(), 0)
  }
}
try {
  for (const width of widths) for (const theme of ['light', 'dark']) {
    const { context, page, calls } = await setup(width, theme)
    await page.goto(`${base}/compose`)
    await page.getByRole('radio', { name: 'Rich', exact: true }).waitFor()
    await checkFrame(page, width)
    await select(page, 'Rich')
    await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('A new tutorial is ready. 👋')
    await page.getByRole('button', { name: 'Review & send', exact: true }).click()
    assert.equal(await page.getByRole('dialog').count(), 0, 'Missing destination cannot open confirmation')
    await page.getByRole('textbox', { name: 'Destination URL' }).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await page.getByRole('button', { name: 'Use YouTube thumbnail' }).click()
    await page.getByText('Image ready.', { exact: true }).waitFor()
    await select(page, 'Learn more')
    await page.locator('input[type=file]').setInputFiles({ name: 'image.png', mimeType: 'image/png', buffer: image })
    await page.getByText('Image ready.', { exact: true }).waitFor()
    await page.waitForFunction(() => !document.querySelector('.ui-content-fields__status[role=status]'))
    const upload = await page.evaluate(() => window.__fixtureUploads.at(-1)), presign = calls.findLast(item => item.path.endsWith('/media/presign')).payload
    assert.equal(upload.size, presign.size_bytes); assert.equal(upload.type, presign.content_type)
    assert.ok(upload.size <= (upload.type === 'image/webp' ? notificationCapabilities.final_max_bytes : notificationCapabilities.source_max_bytes))
    const axe = await new AxeBuilder({ page }).include('.ui-content-fields').analyze()
    assert.deepEqual(axe.violations.map(item => ({ id: item.id, impact: item.impact })), [], `Rich form accessibility ${width}/${theme}`)
    await checkFrame(page, width)
    if (width >= 960) {
      const preview = await page.locator('.device-preview__frame').boundingBox(), action = await page.locator('.device-preview__action').boundingBox()
      assert.ok(action.y + action.height < preview.y + preview.height - 8, 'Rich CTA fits in the phone preview')
    }
    await page.screenshot({ path: `${output}/composer-${width}-${theme}.png`, fullPage: width >= 960 })
    await page.getByRole('button', { name: 'Review & send', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    assert.ok(await dialog.getByText('Learn more', { exact: true }).count())
    await dialog.getByRole('button', { name: 'Send nudge', exact: true }).click()
    await page.getByRole('heading', { name: 'Your nudge is queued.' }).waitFor()
    const sent = calls.filter(item => item.path.endsWith('/nudge/broadcast'))
    assert.equal(sent.length, 1)
    assert.equal(sent[0].payload.notification_format, 'rich')
    assert.equal(sent[0].payload.cta_label, 'learn_more')
    assert.equal(sent[0].payload.media_url, 'https://assets.example.com/ready.webp')
    await page.getByRole('button', { name: 'Write another' }).click()
    await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('Basic update')
    await page.getByRole('button', { name: 'Review & send', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Send nudge', exact: true }).click()
    await page.getByRole('heading', { name: 'Your nudge is queued.' }).waitFor()
    assert.deepEqual(calls.filter(item => item.path.endsWith('/nudge/broadcast'))[1].payload, { message: 'Basic update', notification_format: 'basic' })
    await context.close()
    console.log(`PASS composer ${width}px ${theme}`)
  }
  {
    const { context, page, calls, controls } = await setup(375, 'light', { creator: true })
    controls.failCapabilities = true
    await page.goto(`${base}/compose`)
    await page.getByRole('button', { name: 'Load options' }).waitFor()
    await page.getByRole('textbox', { name: 'Your message' }).fill('Retry options, not a send')
    await page.getByRole('button', { name: 'Review & send' }).click()
    assert.equal(calls.filter(item => item.path.endsWith('/nudge/broadcast')).length, 0)
    controls.failCapabilities = false
    await page.getByRole('button', { name: 'Load options' }).click()
    await select(page, 'Rich')
    await page.getByRole('textbox', { name: 'Destination URL' }).fill('https://example.com/article')
    controls.failSend = true
    await page.getByRole('button', { name: 'Review & send' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Send nudge' }).click()
    await page.locator('.v-snackbar__content').getByText('Request failed with status 503').waitFor()
    assert.equal(calls.filter(item => item.path.endsWith('/nudge/broadcast')).length, 1)
    await page.getByRole('dialog').getByRole('button', { name: 'Keep editing' }).click()
    assert.equal(await page.getByRole('textbox', { name: 'Your message' }).inputValue(), 'Retry options, not a send')
    await context.close(); console.log('PASS creator options retry and rejected send')
  }
  for (const width of [375, 1440]) {
    const { context, page, calls, controls } = await setup(width, 'dark')
    await page.goto(`${base}/token`)
    await select(page, 'Rich')
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Rich transaction')
    await page.getByRole('textbox', { name: 'Destination URL' }).fill('https://example.com/article')
    await select(page, 'Learn more')
    await select(page, /Transactional/)
    await page.getByRole('textbox', { name: 'Recipient Nudge ID' }).fill('482193')
    await checkFrame(page, width)
    const code = page.locator('pre').first()
    assert.ok((await code.innerText()).includes('notification_format'))
    assert.ok(!(await code.innerText()).includes('nudge_live_fixture'))
    await page.getByRole('button', { name: 'Send test nudge' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm & send' }).click()
    await page.locator('.v-snackbar__content').getByText('Nudge queued. Check nudge history for delivery progress.').waitFor()
    const sent = calls.filter(item => item.path.endsWith('/nudge/send'))
    assert.equal(sent.length, 1); assert.equal(sent[0].payload.nudge_user_id, 482193); assert.equal(sent[0].payload.notification_format, 'rich'); assert.equal(sent[0].payload.media_url, undefined)
    await page.goto(`${base}/nudges`)
    await page.getByText('A new tutorial is ready.', { exact: true }).waitFor()
    assert.equal(await page.getByText('Watch now', { exact: true }).count(), 1)
    if (width < 960) {
      await page.getByRole('button', { name: 'Send a nudge', exact: true }).click()
      const sheet = page.getByRole('dialog')
      await select(sheet, 'Rich')
      await sheet.getByRole('textbox', { name: 'Destination URL' }).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      controls.failImport = true
      await sheet.getByRole('button', { name: 'Use YouTube thumbnail' }).click()
      await sheet.getByRole('button', { name: 'Retry image' }).waitFor()
      await sheet.getByRole('textbox', { name: 'Your message', exact: true }).fill('Image-less Rich still works')
      await sheet.getByRole('button', { name: 'Review & send', exact: true }).click()
      await sheet.getByRole('button', { name: 'Send nudge', exact: true }).click()
      await sheet.getByText('Your update is on its way.').waitFor()
      await page.screenshot({ path: `${output}/mobile-sheet-result.png` })
    }
    await context.close(); console.log(`PASS playground/history/sheet ${width}px`)
  }
  assert.deepEqual(errors, [])
} finally { await browser.close() }
console.log('Rich sender browser checks passed; all network writes were fixtures.')
