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
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Studio Notes', nudger_id: 'studio-notes', profile_type: 'platform', is_active: true, profile_image_url: 'https://assets.example.com/avatar.svg' }
// Deliberately distinct sender/content fixtures catch accidental Nudge-logo reuse.
const avatarImage = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="48" fill="#4338CA"/><text x="48" y="61" text-anchor="middle" fill="white" font-family="sans-serif" font-size="36">SN</text></svg>'
const thumbnailImage = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#154E61"/><circle cx="160" cy="90" r="42" fill="#DDF4ED"/><path d="M150 67 L150 113 L183 90Z" fill="#154E61"/></svg>'
const richHistory = { id: 'fixture-nudge', title: profile.display_name, message: 'A new tutorial is ready.', sender: 'platform', nudge_type: 'broadcast', status: 'completed', created_at: new Date().toISOString(), completed_at: new Date().toISOString(), stats: { total_audience: 0, total_devices: 0, delivered_users: 0, muted_users: 0, failed_deliveries: 0 }, notification_format: 'rich', destination_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', cta_label: 'watch_now', media_url: 'https://assets.example.com/ready.webp' }
const errors = []
async function select(page, name) {
  const radio = page.getByRole('radio', { name, exact: typeof name === 'string' })
  await radio.locator('..').click()
  assert.ok(await radio.isChecked())
}
async function setup(width, theme, options = {}) {
  const context = await browser.newContext({ viewport: { width, height: options.height || Number(process.env.RICH_HEIGHT) || 844 }, colorScheme: theme, reducedMotion: 'reduce', hasTouch: width < 960 })
  const calls = [], controls = { failImport: false, failCapabilities: false, failSend: false, sendGate: null, uploadCount: 0, uploadMime: 'image/webp' }
  await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-refresh'))
  await context.addInitScript(() => {
    const send = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function(body) {
      if (body instanceof Blob) (window.__fixtureUploads ||= []).push({ size: body.size, type: body.type })
      return send.call(this, body)
    }
  })
  await context.route('**/runtime-config.js', route => route.fulfill({ contentType: 'application/javascript', body: 'window.__NUDGER_CONFIG__={apiBaseUrl:"/",profileImageSourceMaxBytes:10485760,profileImageFinalMaxBytes:1000000,profileImageMaxDimension:1280,profileImageWebpQuality:0.86}' }))
  await context.route('https://assets.example.com/**', route => options.brokenImages
    ? route.fulfill({ status: 404, body: '' })
    : route.fulfill({ contentType: 'image/svg+xml', body: route.request().url().endsWith('avatar.svg') ? avatarImage : thumbnailImage }))
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
  await context.route('**/v1/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname, payload = request.postData() ? request.postDataJSON() : null
    calls.push({ path, method: request.method(), payload })
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ message: status >= 400 ? `Request failed with status ${status}` : 'Fixture', data, errors: {} }) })
    const merchant = { ...profile, ...options.profile, profile_type: options.creator ? 'creator' : 'platform' }
    if (path.endsWith('/refresh')) return respond({ auth: { access_token: 'fixture-session', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Studio', email: 'fixture@example.test' }, merchant_profile: merchant })
    if (path.endsWith('/profile')) return respond(merchant)
    if (path.endsWith('/capabilities')) return respond(controls.failCapabilities ? null : { ...notificationCapabilities, delivery_types: options.creator ? ['broadcast'] : ['broadcast', 'transactional'] })
    if (path.endsWith('/media/presign')) { controls.uploadMime = payload.content_type; return respond({ asset_id: 'asset', method: 'PUT', upload_url: 'https://storage.example.com/asset?signature=fixture', headers: { 'Content-Type': controls.uploadMime }, expires_in: 300 }) }
    if (path.endsWith('/media/finalize') || path.endsWith('/media/youtube')) return respond(controls.failImport ? null : { asset_id: 'asset', media_url: 'https://assets.example.com/ready.webp', content_type: 'image/webp', size_bytes: 8000, width: 192, height: 192 }, controls.failImport ? 503 : 200)
    if (path.endsWith('/nudge/broadcast') || path.endsWith('/nudge/send')) {
      if (controls.sendGate) await controls.sendGate
      return respond(controls.failSend ? null : { status: 'queued', message_id: 'fixture-message', merchant_profile_id: merchant.id, nudge_type: payload?.nudge_type }, controls.failSend ? 503 : 202)
    }
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
async function checkPreview(root, hasMedia) {
  const preview = root.locator('.ui-notification-preview').first()
  const geometry = await preview.evaluate(el => {
    const box = selector => {
      const r = el.querySelector(selector).getBoundingClientRect()
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
    }
    const text = el.querySelector('.ui-notification-preview__message'), style = getComputedStyle(text)
    return { card: box('.ui-notification-preview__card'), sender: box('.ui-notification-preview__sender'), badge: box('.ui-notification-preview__badge'), message: box('.ui-notification-preview__message'),
      media: el.querySelector('.ui-media') ? box('.ui-media') : null,
      fontSize: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight), clamp: style.webkitLineClamp }
  })
  assert.ok(geometry.fontSize >= 14, 'Readable preview type at every width')
  assert.equal(geometry.clamp, '4')
  assert.ok(geometry.message.height <= geometry.lineHeight * 4 + 1)
  assert.ok(geometry.sender.width >= 40, 'Sender has a prominent avatar')
  assert.ok(geometry.badge.x > geometry.sender.x && geometry.badge.x < geometry.sender.right, 'Small Nudge badge overlaps sender bottom-right')
  assert.ok(geometry.badge.y > geometry.sender.y && geometry.badge.y < geometry.sender.bottom)
  assert.equal(Boolean(geometry.media), hasMedia)
  if (hasMedia) {
    assert.ok(geometry.media.x >= geometry.message.right, 'Content thumbnail sits to the right, not below the text')
    assert.ok(geometry.media.right < geometry.card.right && geometry.media.bottom < geometry.card.bottom)
  }
  assert.equal(await root.locator('.device-preview__frame').count(), 0, 'No phone frame')
  return geometry
}
async function checkFieldOrder(root) {
  const fields = root.locator('.ui-content-fields')
  const layout = await fields.evaluate(el => {
    const format = el.querySelector('fieldset'), message = el.querySelector('textarea'), destination = el.querySelector('input[name=destination_url]')
    const legend = format.querySelector('legend').getBoundingClientRect(), choices = format.querySelector('.ui-choice-cards__grid').getBoundingClientRect()
    return { beforeMessage: Boolean(format.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING), beforeDestination: !destination || Boolean(message.compareDocumentPosition(destination) & Node.DOCUMENT_POSITION_FOLLOWING), labelGap: choices.top - legend.bottom,
      targets: [...el.querySelectorAll('.ui-choice-cards__option')].map(option => option.getBoundingClientRect().height) }
  })
  assert.ok(layout.beforeMessage && layout.beforeDestination, 'Format → message → Rich fields')
  assert.ok(layout.labelGap >= 11, 'Format label has deliberate spacing before its controls')
  assert.ok(layout.targets.every(height => height >= 48), 'Choices retain touch targets')
}
async function checkConfirmation(dialog) {
  const geometry = await dialog.evaluate(el => {
    const frame = el.querySelector('.ui-dialog')
    const bounds = frame.getBoundingClientRect()
    const body = frame.querySelector('.ui-dialog__body'), message = frame.querySelector('.ui-message-summary')
    const buttons = [...frame.querySelectorAll('.ui-dialog__footer button')].map(button => button.getBoundingClientRect())
    return { bottom: bounds.bottom, viewport: innerHeight, bodyHeight: body.clientHeight, overflow: frame.scrollHeight > frame.clientHeight + 1,
      messageClipped: message.scrollHeight > message.clientHeight + 1, horizontalOverflow: body.scrollWidth > body.clientWidth + 1,
      buttons: buttons.map(box => ({ top: box.top, bottom: box.bottom, height: box.height })) }
  })
  assert.equal(geometry.buttons.length, 2)
  assert.ok(geometry.buttons.every(box => box.top >= 0 && box.bottom <= Math.min(geometry.bottom, geometry.viewport) + 1), 'Confirmation actions must remain inside the visible modal, without scrolling')
  assert.ok(geometry.buttons.every(box => box.height >= 48), 'Confirmation actions retain 48px targets')
  assert.ok(geometry.bodyHeight >= 32, 'There is usable space for the scrollable review')
  assert.equal(geometry.overflow, false, 'Frame itself does not scroll or clip controls')
  assert.equal(geometry.messageClipped, false, 'Full message cannot shrink or have its own scrollbar')
  assert.equal(geometry.horizontalOverflow, false, 'Long messages and destinations wrap inside the body')
}
async function checkSheetReview(sheet) {
  const geometry = await sheet.evaluate(el => {
    const body = el.querySelector('.ui-sheet__body'), footer = el.querySelector('.ui-sheet__footer').getBoundingClientRect(), message = el.querySelector('.ui-message-summary')
    return { footerBottom: footer.bottom, viewport: innerHeight, bodyBottom: body.getBoundingClientRect().bottom,
      footerTop: footer.top, messageClipped: message.scrollHeight > message.clientHeight + 1,
      horizontalOverflow: body.scrollWidth > body.clientWidth + 1 }
  })
  assert.ok(geometry.footerBottom <= geometry.viewport + 1)
  assert.ok(geometry.bodyBottom <= geometry.footerTop + 1, 'Sheet content stays above pinned actions')
  assert.equal(geometry.messageClipped, false, 'Sheet full message has no nested scroll or clamp')
  assert.equal(geometry.horizontalOverflow, false)
  assert.equal(await sheet.locator('.ui-content-summary .ui-media').count(), 0, 'Sheet does not repeat the preview thumbnail')
}
try {
  for (const width of widths) for (const theme of ['light', 'dark']) {
    const { context, page, calls } = await setup(width, theme)
    await page.goto(`${base}/compose`)
    await page.getByRole('radio', { name: 'Rich', exact: true }).waitFor()
    await checkFrame(page, width)
    if (width === widths[0]) {
      await page.getByRole('radio', { name: 'Basic', exact: true }).focus()
      await page.keyboard.press('ArrowRight')
      assert.ok(await page.getByRole('radio', { name: 'Rich', exact: true }).isChecked(), 'Format choices work with native keyboard navigation')
    } else await select(page, 'Rich')
    await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('A new tutorial is ready. 👋')
    await page.getByRole('button', { name: 'Review & send', exact: true }).click()
    assert.equal(await page.getByRole('dialog').count(), 0, 'Missing destination cannot open confirmation')
    assert.ok(await page.getByRole('textbox', { name: 'Destination URL' }).evaluate(el => el === document.activeElement), 'Invalid destination gets focus')
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
    const axe = await new AxeBuilder({ page }).include('.ui-content-fields').include('.ui-notification-preview').analyze()
    assert.deepEqual(axe.violations.map(item => ({ id: item.id, impact: item.impact })), [], `Rich form accessibility ${width}/${theme}`)
    await checkFrame(page, width)
    await checkPreview(page, true)
    await checkFieldOrder(page)
    await page.locator('.ui-notification-preview').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${output}/composer-${width}-${theme}.png`, fullPage: width >= 960 })
    await page.getByRole('button', { name: 'Review & send', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    await checkPreview(dialog, true)
    await checkConfirmation(dialog)
    assert.equal(await dialog.locator('.ui-notification-preview__live').count(), 0)
    assert.ok(await dialog.getByText('Learn more', { exact: true }).count())
    await dialog.getByRole('button', { name: 'Send nudge', exact: true }).click()
    await page.getByRole('heading', { name: 'Your nudge is queued.' }).waitFor()
    const sent = calls.filter(item => item.path.endsWith('/nudge/broadcast'))
    assert.equal(sent.length, 1)
    assert.equal(sent[0].payload.notification_format, 'rich')
    assert.equal(sent[0].payload.cta_label, 'learn_more')
    assert.equal(sent[0].payload.media_url, 'https://assets.example.com/ready.webp')
    await page.getByRole('button', { name: 'Write another' }).click()
    await checkPreview(page, false)
    await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('Basic update')
    await page.getByRole('button', { name: 'Review & send', exact: true }).click()
    await checkConfirmation(page.getByRole('dialog'))
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
    await checkFieldOrder(page)
    const code = page.locator('pre').first()
    assert.ok((await code.innerText()).includes('notification_format'))
    assert.ok(!(await code.innerText()).includes('nudge_live_fixture'))
    await page.getByRole('button', { name: 'Send test nudge' }).click()
    await checkConfirmation(page.getByRole('dialog'))
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
      await sheet.getByRole('textbox', { name: 'Your message', exact: true }).fill('A new tutorial is ready. 👋')
      await sheet.getByRole('button', { name: 'Use YouTube thumbnail' }).click()
      await sheet.getByText('Image ready.', { exact: true }).waitFor()
      await checkPreview(sheet, true)
      await checkFieldOrder(sheet)
      await sheet.locator('.ui-notification-preview').scrollIntoViewIfNeeded()
      await page.screenshot({ path: `${output}/mobile-sheet-rich.png` })
      const sheetMessage = 'A useful update 👋\n'.repeat(90) + 'The final line.'
      await sheet.getByRole('textbox', { name: 'Your message', exact: true }).fill(sheetMessage)
      await sheet.getByRole('button', { name: 'Review & send', exact: true }).click()
      await sheet.getByRole('heading', { name: 'Ready to send?' }).waitFor()
      assert.equal(await sheet.locator('.ui-message-summary__text').textContent(), sheetMessage)
      await checkSheetReview(sheet)
      const footerBefore = await sheet.locator('.ui-sheet__footer').boundingBox()
      await sheet.locator('.ui-content-summary__destination').scrollIntoViewIfNeeded()
      await checkSheetReview(sheet)
      assert.ok(Math.abs((await sheet.locator('.ui-sheet__footer').boundingBox()).y - footerBefore.y) < 1)
      await page.setViewportSize({ width, height: 500 })
      // The existing sheet follows visualViewport asynchronously after a resize.
      await page.waitForFunction(() => Math.abs(document.querySelector('.ui-sheet__footer').getBoundingClientRect().bottom - innerHeight) <= 1)
      await checkSheetReview(sheet)
      await page.screenshot({ path: `${output}/mobile-sheet-review-short.png` })
      await page.setViewportSize({ width, height: 844 })
      await page.waitForFunction(() => Math.abs(document.querySelector('.ui-sheet__footer').getBoundingClientRect().bottom - innerHeight) <= 1)
      await sheet.getByRole('button', { name: 'Edit message', exact: true }).click()
      assert.equal(await sheet.getByRole('textbox', { name: 'Your message', exact: true }).inputValue(), sheetMessage)
      await sheet.getByRole('button', { name: 'Remove image', exact: true }).click()
      controls.failImport = true
      await sheet.getByRole('button', { name: 'Use YouTube thumbnail' }).click()
      await sheet.getByRole('button', { name: 'Retry image' }).waitFor()
      await sheet.getByRole('textbox', { name: 'Your message', exact: true }).fill('Image-less Rich still works')
      await checkPreview(sheet, false)
      await sheet.getByRole('button', { name: 'Review & send', exact: true }).click()
      await checkPreview(sheet, false)
      await checkSheetReview(sheet)
      await sheet.getByRole('button', { name: 'Send nudge', exact: true }).click()
      await sheet.getByText('Your update is on its way.').waitFor()
      await page.screenshot({ path: `${output}/mobile-sheet-result.png` })
    }
    await context.close(); console.log(`PASS playground/history/sheet ${width}px`)
  }
  for (const width of [320, 1440]) {
    const longMessage = 'Update 👋\n' + 'An unbroken link or name must wrap: ' + 'x'.repeat(400)
    const { context, page, calls } = await setup(width, 'light', { brokenImages: true, profile: { display_name: 'Studio Notes with a long merchant name '.repeat(3).trim() } })
    await page.goto(`${base}/compose`)
    await select(page, 'Rich')
    await page.getByRole('textbox', { name: 'Your message', exact: true }).fill(longMessage)
    await page.getByRole('textbox', { name: 'Destination URL' }).fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await page.getByRole('button', { name: 'Use YouTube thumbnail' }).click()
    const preview = page.locator('.ui-notification-preview')
    await preview.locator('.ui-media__fallback').waitFor()
    assert.equal(await preview.locator('.ui-avatar-image img').count(), 0)
    assert.equal(await preview.locator('.ui-notification-preview__badge img').count(), 1)
    await checkPreview(page, true)
    await checkFrame(page, width)
    assert.equal(await preview.locator('.ui-notification-preview__message').textContent(), longMessage)
    await page.getByRole('button', { name: 'Review & send' }).click()
    const dialog = page.getByRole('dialog')
    assert.equal(await dialog.locator('.ui-message-summary__text').textContent(), longMessage, 'Full text is not truncated in review')
    await checkConfirmation(dialog)
    await dialog.getByRole('button', { name: 'Keep editing' }).click()
    await select(page, 'Basic')
    await checkPreview(page, false)
    assert.equal(await page.getByRole('textbox', { name: 'Your message' }).inputValue(), longMessage)
    assert.equal(calls.filter(item => item.path.endsWith('/nudge/broadcast')).length, 0, 'Preview and editing never send')
    await context.close(); console.log(`PASS long text, image failures, full review and Basic reset ${width}px`)
  }
  // Real Vuetify geometry: a textContent assertion alone missed the clipped footer.
  for (const [width, height] of [[1728, 761], [1440, 600], [768, 600], [375, 500], [320, 568], [844, 390]]) for (const theme of ['light', 'dark']) {
    const { context, page, calls, controls } = await setup(width, theme, { height })
    await page.goto(`${base}/compose`)
    await select(page, 'Rich')
    const messageInput = page.getByRole('textbox', { name: 'Your message', exact: true })
    await messageInput.fill('I am going live in the next 15 minutes. 👋')
    await page.getByRole('textbox', { name: 'Destination URL' }).fill(richHistory.destination_url)
    await page.getByRole('button', { name: 'Use YouTube thumbnail' }).click()
    await page.getByText('Image ready.', { exact: true }).waitFor()
    const reviewButton = page.getByRole('button', { name: 'Review & send', exact: true })
    await reviewButton.click()
    const dialog = page.getByRole('dialog'), body = dialog.getByRole('region', { name: 'Broadcast review details' })
    await checkConfirmation(dialog)
    assert.equal(await dialog.locator('.ui-media').count(), 1, 'Review must not repeat a large image below the thumbnail')
    await page.waitForFunction(() => document.activeElement?.matches('.ui-dialog__header h2'))
    const axe = await new AxeBuilder({ page }).include('.ui-dialog').analyze()
    assert.deepEqual(axe.violations.map(item => ({ id: item.id, impact: item.impact })), [], `Confirmation accessibility ${width}x${height}/${theme}`)
    await page.screenshot({ path: `${output}/confirmation-${width}x${height}-${theme}.png` })
    // Keyboard focus stays within the dialog, including backwards navigation.
    for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
      // macOS WebKit's default keyboard mode uses Option-Tab for all controls.
      await page.keyboard.press(process.env.BROWSER_ENGINE === 'webkit' ? `Alt+${key}` : key)
      await page.waitForFunction(() => document.querySelector('.v-dialog.v-overlay--active')?.contains(document.activeElement), null, { timeout: 3000 })
    }
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('Review & send'))
    const longMessage = 'A detailed update 👋\n'.repeat(100) + 'x'.repeat(300) + '\nEnd of full message.'
    const longDestination = 'https://example.com/' + 'destination-'.repeat(60)
    await messageInput.fill(longMessage)
    await page.getByRole('textbox', { name: 'Destination URL' }).fill(longDestination)
    await reviewButton.click()
    await page.waitForFunction(() => document.activeElement?.matches('.ui-dialog__header h2'))
    await checkConfirmation(dialog)
    assert.equal(await dialog.locator('.ui-message-summary__text').textContent(), longMessage)
    assert.equal(await dialog.locator('.ui-content-summary__destination > span').textContent(), longDestination)
    const footerBefore = await dialog.locator('.ui-dialog__footer').boundingBox()
    await body.focus()
    await page.keyboard.press('End')
    await page.waitForFunction(() => { const el = document.querySelector('.ui-dialog__body'); return el.scrollTop > 0 })
    await dialog.locator('.ui-content-summary__destination').scrollIntoViewIfNeeded()
    await checkConfirmation(dialog)
    const footerAfter = await dialog.locator('.ui-dialog__footer').boundingBox()
    assert.ok(Math.abs(footerAfter.y - footerBefore.y) < 1, 'Actions do not move when the content scrolls')
    await page.screenshot({ path: `${output}/confirmation-long-${width}x${height}-${theme}.png` })
    if (width === 1728 && theme === 'light') {
      let releaseSend
      controls.sendGate = new Promise(resolve => { releaseSend = resolve })
      controls.failSend = true
      await dialog.getByRole('button', { name: 'Send nudge', exact: true }).click()
      assert.ok(await dialog.getByRole('button', { name: 'Keep editing' }).isDisabled())
      assert.ok(await dialog.getByRole('button', { name: 'Send nudge', exact: true }).isDisabled())
      await page.keyboard.press('Escape')
      assert.ok(await dialog.isVisible(), 'Busy confirmation cannot be dismissed')
      await checkConfirmation(dialog)
      releaseSend()
      await page.locator('.v-snackbar__content').getByText('Request failed with status 503').waitFor()
      await dialog.getByRole('button', { name: 'Keep editing' }).click()
      assert.equal(await messageInput.inputValue(), longMessage, 'A failed send retains the full draft')
      assert.equal(calls.filter(item => item.path.endsWith('/nudge/broadcast')).length, 1)
    } else {
      await dialog.getByRole('button', { name: 'Keep editing' }).click()
      assert.equal(calls.filter(item => item.path.endsWith('/nudge/broadcast')).length, 0)
    }
    await context.close(); console.log(`PASS confirmation geometry, full text, keyboard and actions ${width}x${height} ${theme}`)
  }
  for (const width of [375, 1440]) for (const theme of ['light', 'dark']) {
    const { context, page, calls } = await setup(width, theme, { height: 500 })
    await page.goto(`${base}/token`)
    await select(page, 'Rich')
    const longMessage = 'A detailed API update 👋\n'.repeat(80)
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill(longMessage)
    await page.getByRole('textbox', { name: 'Destination URL' }).fill(richHistory.destination_url)
    await page.getByRole('button', { name: 'Use YouTube thumbnail' }).click()
    await page.getByText('Image ready.', { exact: true }).waitFor()
    const trigger = page.getByRole('button', { name: 'Send test nudge' })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await page.waitForFunction(() => document.activeElement?.matches('.ui-dialog__header h2'))
    await checkConfirmation(dialog)
    assert.equal(await dialog.locator('.ui-media').count(), 1, 'Playground retains its only media preview')
    assert.equal(await dialog.locator('.ui-message-summary__text').textContent(), longMessage.trim())
    const footerBefore = await dialog.locator('.ui-dialog__footer').boundingBox()
    await dialog.locator('.ui-content-summary__destination').scrollIntoViewIfNeeded()
    await checkConfirmation(dialog)
    assert.ok(Math.abs((await dialog.locator('.ui-dialog__footer').boundingBox()).y - footerBefore.y) < 1)
    await page.screenshot({ path: `${output}/playground-review-${width}-${theme}.png` })
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    await page.waitForFunction(() => document.activeElement?.textContent?.includes('Send test nudge'))
    assert.equal(calls.filter(item => item.path.endsWith('/nudge/send')).length, 0)
    assert.equal(await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue(), longMessage)
    await context.close(); console.log(`PASS playground short-screen full review ${width}px ${theme}`)
  }
  assert.deepEqual(errors, [])
} finally { await browser.close() }
console.log('Rich sender browser checks passed; all network writes were fixtures.')
