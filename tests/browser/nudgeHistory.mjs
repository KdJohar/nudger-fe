import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { notificationCapabilities } from '../helpers/notificationFixtures.mjs'

const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const { default: AxeBuilder } = await import(process.env.AXE_MODULE || '@axe-core/playwright')
const isWebKit = process.env.BROWSER_ENGINE === 'webkit'
const browser = isWebKit ? await webkit.launch({ headless: true }) : await chromium.launch({ headless: true, channel: 'chrome' })
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:5174'
const output = process.env.HISTORY_SCREENSHOT_DIR || '/tmp/nudger-history'
const widths = (process.env.HISTORY_VIEWPORTS || '320,375,768,1024,1440').split(',').map(Number)
mkdirSync(output, { recursive: true })
const errors = []
const longMessage = 'A useful update 👋\n' + 'Long text stays readable. '.repeat(155)
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Studio Notes', nudger_id: 'studio-notes', profile_type: 'platform', is_active: true, profile_image_url: '/nudge.png' }
const item = (id, content = {}) => ({ id, title: 'Studio Notes', message: id, sender: 'platform', nudge_type: 'broadcast', notification_format: 'basic', status: 'completed', created_at: '2026-10-01T08:00:00Z', completed_at: '2026-10-01T08:00:05Z', engagement_as_of: null, stats: { total_audience: 12450, total_devices: 17000, delivered_users: 12000, muted_users: 450, failed_deliveries: 0, total_clicks: null, ctr: null }, ...content })
const rich = { notification_format: 'rich', destination_url: 'https://example.com/watch', cta_label: 'watch_now', media_url: 'https://assets.example.com/ready.webp' }
const fixtures = [item('A basic update'), item('Watch our new tutorial', { ...rich, engagement_as_of: '2026-10-07T00:00:00Z', stats: { total_audience: 12450, total_devices: 17000, delivered_users: 12000, muted_users: 450, failed_deliveries: 0, total_clicks: 3000, ctr: 25 } }), item('An expired image', { ...rich, status: 'failed', cta_label: 'learn_more', media_url: 'https://assets.example.com/deleted.webp', engagement_as_of: '2026-10-07T00:00:00Z', stats: { total_audience: 1, total_devices: 1, delivered_users: 0, muted_users: 0, failed_deliveries: 1, total_clicks: 0, ctr: null } }), item('Still processing', { ...rich, status: 'processing', completed_at: null, media_url: null }), item('Queued for later', { status: 'created', completed_at: null }), item('Long message', { ...rich, message: longMessage, media_url: null })]

async function setup(width, theme) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce', hasTouch: width < 960 })
  const mediaCalls = [], historyCalls = []
  const controls = { mode: 'normal', hold: null, items: fixtures }
  await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-refresh'))
  await context.route('**/runtime-config.js', route => route.fulfill({ contentType: 'application/javascript', body: 'window.__NUDGER_CONFIG__={apiBaseUrl:"/",profileImageSourceMaxBytes:10485760,profileImageFinalMaxBytes:1000000,profileImageMaxDimension:1280,profileImageWebpQuality:0.86}' }))
  await context.route('https://assets.example.com/**', route => {
    mediaCalls.push(route.request().url())
    assert.equal(route.request().headers().authorization, undefined)
    return route.request().url().includes('deleted') ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#154E61"/><circle cx="400" cy="225" r="100" fill="#DDF4ED"/><path d="M375 175 L375 275 L450 225Z" fill="#154E61"/></svg>' })
  })
  await context.route('**/v1/**', async route => {
    const path = new URL(route.request().url()).pathname
    const respond = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ message: 'Fixture', data, errors: {} }) })
    if (path.endsWith('/refresh')) return respond({ auth: { access_token: 'fixture-session', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Studio', email: 'fixture@example.test' }, merchant_profile: profile })
    assert.equal(route.request().method(), 'GET', 'No real sends or mutations')
    if (path.endsWith('/profile')) return respond(profile)
    if (path.endsWith('/capabilities')) return respond(notificationCapabilities)
    if (path.endsWith('/nudges')) {
      historyCalls.push(route.request().url())
      if (controls.hold) await controls.hold
      return controls.mode === 'error' ? respond(null, 503) : respond({ items: controls.mode === 'empty' ? [] : controls.items, next: null, page_size: 20 })
    }
    errors.push(`Unexpected API request ${path}`)
    return respond(null, 404)
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  return { context, page, controls, mediaCalls, historyCalls }
}

const sizingFixtures = [
  item('Short message', { message: 'Hi' }),
  item('Decimal percentage', { ...rich, engagement_as_of: '2026-10-07T00:00:00Z', stats: { ...fixtures[1].stats, total_clicks: 1608, ctr: 13.4 } }),
  item('Full percentage', { ...rich, engagement_as_of: '2026-10-07T00:00:00Z', stats: { ...fixtures[1].stats, total_clicks: 12000, ctr: 100 } }),
  item('Long paragraph', { message: longMessage }),
  item('Unbroken URL', { message: 'https://example.com/' + 'a'.repeat(4060) }),
  item('Long completion', { completed_at: '2026-10-01T08:14:37Z', stats: { ...fixtures[0].stats, failed_deliveries: 142 } }),
  item('Completion without time', { completed_at: null }),
  item('Processing message', { status: 'processing', completed_at: null }),
  item('Queued message', { status: 'created', completed_at: null }),
  item('Failed message', { status: 'failed', completed_at: null }),
]

async function assertDesktopSizing(page) {
  const geometry = await page.locator('.ui-record-table').evaluate(table => {
    const headers = [...table.querySelectorAll('th')].map(cell => cell.getBoundingClientRect().width)
    const rows = [...table.querySelectorAll('tbody tr')].map(row => {
      const cells = [...row.cells]
      const chip = row.querySelector('.v-chip')
      const status = cells[7].getBoundingClientRect()
      const statusStyle = getComputedStyle(cells[7])
      const copy = row.querySelector('.ui-expandable-text__copy')
      const metrics = cells.slice(2, 7).map(cell => {
        const range = document.createRange()
        range.selectNodeContents(cell)
        const rects = [...range.getClientRects()].filter(rect => rect.width > 0)
        const bounds = cell.getBoundingClientRect()
        const style = getComputedStyle(cell)
        return { lines: new Set(rects.map(rect => Math.round(rect.top))).size,
          fits: rects.every(rect => rect.left >= bounds.left + parseFloat(style.paddingLeft) - 1 && rect.right <= bounds.right - parseFloat(style.paddingRight) + 1) }
      })
      return { metrics, widths: cells.map(cell => cell.getBoundingClientRect().width),
        chipFits: chip.scrollWidth <= chip.clientWidth + 1 && chip.getBoundingClientRect().right <= status.right - parseFloat(statusStyle.paddingRight) + 1,
        copyFits: copy.scrollWidth <= copy.clientWidth + 1 }
    })
    return { headers, rows, scrollWidth: table.parentElement.scrollWidth, visibleWidth: table.parentElement.clientWidth,
      pageFits: document.documentElement.scrollWidth <= innerWidth }
  })
  assert.ok(geometry.pageFits, 'Only the desktop table region may scroll horizontally')
  for (const row of geometry.rows) {
    assert.ok(row.chipFits, 'Status chips retain their complete label within the column')
    assert.ok(row.copyFits, 'Long words and URLs stay inside the message column')
    assert.ok(row.metrics.every(metric => metric.lines === 1 && metric.fits), 'Whole counts and CTR percentages fit on one line')
    row.widths.forEach((value, index) => assert.ok(Math.abs(value - geometry.headers[index]) < 1, 'Short and long messages use the same column alignment'))
  }
  return geometry
}

async function verifyDesktopMessages(page, controls, width, theme) {
  await page.setViewportSize({ width, height: 900 })
  controls.items = sizingFixtures
  await page.reload()
  const entries = page.getByTestId('history-item')
  await entries.nth(sizingFixtures.length - 1).waitFor()
  const collapsed = await assertDesktopSizing(page)
  assert.ok(collapsed.headers[0] < 460, 'Message no longer consumes excessive space beside Type')
  assert.equal(await entries.nth(1).locator('td').nth(6).innerText(), '13.4%')
  assert.equal(await entries.nth(2).locator('td').nth(6).innerText(), '100%')
  assert.equal(await entries.nth(5).locator('.v-chip').innerText(), 'Completed in 14m 37s')
  assert.equal(await entries.nth(6).locator('.v-chip').innerText(), 'Completed')
  await page.screenshot({ path: `${output}/desktop-sizing-${width}-${theme}.png` })
  for (const index of [3, 4]) {
    await entries.nth(index).getByRole('button', { name: 'Read full message' }).click()
    assert.equal(await entries.nth(index).locator('.ui-expandable-text__copy').textContent(), sizingFixtures[index].message)
    const expanded = await assertDesktopSizing(page)
    expanded.headers.forEach((value, column) => assert.ok(Math.abs(value - collapsed.headers[column]) < 1, 'Expanding a message does not shift column widths'))
    await entries.nth(index).getByRole('button', { name: 'Show less' }).click()
  }
  controls.items = [item('Only short text', { message: 'Hi' }), item('Another short text', { message: 'OK' })]
  await page.reload()
  await entries.nth(1).waitFor()
  const short = await assertDesktopSizing(page)
  assert.ok(short.headers[0] < 460, 'A list of only short messages also stays balanced')
  controls.items = [item('Large counts', { ...rich, engagement_as_of: '2026-10-07T00:00:00Z', stats: { total_audience: 1234567890123, total_devices: 1234567890123, delivered_users: 1234567890123, muted_users: 0, failed_deliveries: 0, total_clicks: 1234567890123, ctr: 100 } })]
  await page.reload()
  await entries.nth(0).waitFor()
  await assertDesktopSizing(page)
  console.log(`PASS desktop sizing ${width}/${theme}: short/long/URL messages, stable expansion, one-line metrics, complete status, large-count scrolling`)
}

try {
  for (const width of widths) for (const theme of ['light', 'dark']) {
    const { context, page, controls, mediaCalls, historyCalls } = await setup(width, theme)
    let release
    controls.hold = new Promise(resolve => { release = resolve })
    await page.goto(`${base}/nudges`)
    await page.getByText('Loading nudges.', { exact: true }).waitFor({ state: 'attached' })
    assert.equal(await page.locator('.ui-record-list__loading').count(), 1)
    controls.hold = null; release()
    const entries = page.getByTestId('history-item')
    await entries.nth(5).waitFor()
    assert.equal(await entries.count(), 6)
    assert.equal(mediaCalls.length, 0, 'History does not prefetch media, including older images')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.equal(await page.locator('table.ui-record-table').count(), width >= 960 ? 1 : 0)
    assert.equal(await page.locator('.ui-record-card').count(), width < 960 ? 6 : 0)
    assert.equal(await entries.nth(0).getByText('Basic', { exact: true }).count(), 1)
    assert.equal(await entries.nth(0).getByRole('link').count(), 0)
    assert.equal(await entries.nth(0).getByRole('button', { name: 'View image' }).count(), 0)
    assert.equal(await entries.nth(0).getByText('12,000', { exact: true }).count(), 1)
    assert.equal(await entries.nth(0).getByText('Completed in 5s', { exact: true }).count(), 1)
    if (width >= 960) {
      assert.equal(await entries.nth(0).locator('td').nth(5).innerText(), '—', 'Basic total clicks remain unavailable')
      assert.equal(await entries.nth(0).locator('td').nth(6).innerText(), '—', 'Basic CTR remains unavailable')
      assert.equal(await entries.nth(0).locator('.v-chip').innerText(), 'Completed in 5s', 'Status owns completion duration on desktop')
    } else {
      const basicEngagement = entries.nth(0).locator('.ui-record-card__metrics dd')
      assert.equal(await basicEngagement.nth(3).innerText(), '—', 'Basic total clicks remain unavailable')
      assert.equal(await basicEngagement.nth(4).innerText(), '—', 'Basic CTR remains unavailable')
    }
    assert.equal(await entries.nth(1).getByText('3,000', { exact: true }).count(), 1)
    assert.equal(await entries.nth(1).getByText('25%', { exact: true }).count(), 1)
    assert.equal(await entries.nth(2).getByText('Failed', { exact: true }).count(), 1)
    if (width >= 960) assert.equal(await entries.nth(2).getByText('1 failed delivery', { exact: true }).count(), 1)
    else {
      const card = entries.nth(0)
      assert.equal(await card.getByText(profile.display_name, { exact: true }).count(), 0, 'Card omits the repeated merchant title')
      assert.equal(await card.locator('.ui-record-card__footer').count(), 0, 'Completion is shown once, in the status chip')
      assert.equal(await card.locator('.v-chip').innerText(), 'Completed in 5s')
      assert.deepEqual(await card.locator('.ui-record-card__metrics dt').allTextContents(), ['Audience', 'Delivered', 'Muted', 'Total clicks', 'CTR', 'Failed deliveries'])
      assert.equal(await card.locator('.ui-record-card__metrics dd').last().innerText(), '0')
      assert.deepEqual(await entries.nth(1).locator('.ui-record-card__metrics dd').allTextContents(), ['12,450', '12,000', '450', '3,000', '25%', '0'])
      assert.equal(await entries.nth(2).locator('.ui-record-card__metrics dd').last().innerText(), '1')
      const geometry = await card.evaluate(el => {
        const format = el.querySelector('.ui-status-tag').getBoundingClientRect(), status = el.querySelector('.v-chip').getBoundingClientRect()
        const values = [...el.querySelectorAll('.ui-record-card__metrics dd')].map(value => value.getBoundingClientRect())
        return { formatCenter: format.y + format.height / 2, statusCenter: status.y + status.height / 2,
          values: values.map(value => ({ x: value.x, y: value.y })) }
      })
      assert.ok(Math.abs(geometry.formatCenter - geometry.statusCenter) < 1, 'Format/status chips are vertically aligned')
      assert.ok(geometry.values[0].x < geometry.values[1].x && geometry.values[1].x < geometry.values[2].x)
      assert.ok(geometry.values[3].x < geometry.values[4].x && geometry.values[4].x < geometry.values[5].x)
      assert.ok(Math.max(...geometry.values.slice(3).map(value => value.y)) - Math.min(...geometry.values.slice(3).map(value => value.y)) < 1, 'Second-row statistics share one baseline')
    }
    assert.equal(await entries.nth(3).getByText('Processing', { exact: true }).count(), 1)
    assert.equal(await entries.nth(4).getByText('Queued', { exact: true }).count(), 1)
    assert.equal(await entries.nth(1).getByRole('link').getAttribute('href'), rich.destination_url)
    assert.equal(await entries.nth(1).getByRole('link').getAttribute('rel'), 'noopener noreferrer')
    if (width >= 960) assert.deepEqual(await page.locator('thead th').allTextContents(), ['Message', 'Type', 'Audience', 'Delivered', 'Muted', 'Total clicks', 'CTR', 'Status', 'CTA', 'Media'])
    else assert.equal(await page.locator('.header__content').evaluate(el => el.getBoundingClientRect().height), 1)
    const axe = await new AxeBuilder({ page }).include('.ui-record-list').analyze()
    assert.deepEqual(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `${width}/${theme} history accessibility`)
    await page.screenshot({ path: `${output}/history-${width}-${theme}.png`, fullPage: width >= 960 })

    const expired = entries.nth(2).getByRole('button', { name: 'View image' })
    await expired.click()
    let dialog = page.getByRole('dialog', { name: 'Notification image', exact: true })
    try { await dialog.waitFor({ timeout: 5000 }) } catch (error) {
      await page.screenshot({ path: `${output}/viewer-failure.png` })
      console.log(await page.locator('[role=dialog], v-dialog').evaluateAll(elements => elements.map(el => el.outerHTML)))
      throw error
    }
    await dialog.getByText('Image unavailable. The message and link are still available.', { exact: true }).waitFor()
    assert.equal(await dialog.locator('.ui-sheet__surface').count(), width < 960 ? 1 : 0)
    if (width < 960) assert.ok(await page.locator('#app').evaluate(el => el.inert), 'Sheet makes its background inert, including first open')
    assert.equal(mediaCalls.length, 1)
    const viewerAxe = await new AxeBuilder({ page }).include('[role=dialog]').analyze()
    assert.deepEqual(viewerAxe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], 'Image fallback accessibility')
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'View image')
    assert.equal(await page.locator('#app').getAttribute('inert'), null)

    await entries.nth(1).getByRole('button', { name: 'View image' }).click()
    dialog = page.getByRole('dialog', { name: 'Notification image', exact: true })
    await dialog.getByRole('img').waitFor()
    await page.waitForFunction(() => document.querySelector('[role=dialog] img')?.naturalWidth > 0)
    assert.equal(mediaCalls.length, 2)
    assert.ok(await dialog.getByRole('img').evaluate(el => getComputedStyle(el).objectFit === 'contain'))
    await page.screenshot({ path: `${output}/image-${width}-${theme}.png` })
    const geometry = await dialog.getByRole('img').boundingBox()
    assert.ok(geometry.x >= 0 && geometry.x + geometry.width <= width + 1, 'Image fits the viewer')
    await page.setViewportSize({ width: width < 960 ? 1440 : 375, height: 650 })
    await page.waitForFunction(expected => Boolean(document.querySelector('table.ui-record-table')) === expected, width < 960)
    assert.equal(await page.getByRole('dialog').count(), 1, 'Rotation keeps one viewer open')
    assert.equal(await dialog.locator('.ui-sheet__surface').count(), width < 960 ? 1 : 0)
    const close = dialog.getByRole('button', { name: 'Close image', exact: true }).last()
    await close.focus()
    await page.keyboard.press(isWebKit ? 'Alt+Tab' : 'Tab')
    assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)), 'Focus remains in the viewer')
    await close.click()
    await dialog.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => !document.getElementById('app').inert)
    await page.waitForFunction(() => document.activeElement?.dataset.mediaId === 'Watch our new tutorial')
    await page.setViewportSize({ width, height: 900 })
    await page.waitForFunction(expected => Boolean(document.querySelector('table.ui-record-table')) === expected, width >= 960)

    await entries.nth(5).getByRole('button', { name: 'Read full message' }).click()
    assert.equal(await entries.nth(5).locator('.ui-expandable-text__copy').textContent(), longMessage)
    await page.setViewportSize({ width: width >= 960 ? 375 : 1440, height: 900 })
    await page.waitForFunction(expected => Boolean(document.querySelector('table.ui-record-table')) === expected, width < 960)
    assert.equal(await entries.nth(5).locator('.ui-expandable-text__copy').textContent(), longMessage)
    assert.equal(historyCalls.length, 1, 'Resizing does not fetch history')
    await entries.nth(5).getByRole('button', { name: 'Show less' }).click()

    if (width === 375 && theme === 'light') {
      controls.mode = 'error'
      await page.getByRole('tab', { name: 'Transactional' }).click()
      await page.getByRole('button', { name: 'Reload nudges' }).waitFor()
      assert.equal(await entries.count(), 6, 'Failed refresh retains old data')
      controls.mode = 'empty'
      await page.getByRole('button', { name: 'Reload nudges' }).click()
      await page.getByRole('heading', { name: 'No nudges here yet' }).waitFor()
      controls.mode = 'normal'
      await page.getByRole('tab', { name: 'Broadcast' }).click()
      await entries.nth(5).waitFor()
    }
    if (width >= 960) await verifyDesktopMessages(page, controls, width, theme)
    console.log(`PASS ${width}/${theme}: table/cards, counts/status/duration, no invented engagement, deferred/deleted media, modal/Sheet focus, expansion and resize`)
    await context.close()
  }
  assert.deepEqual(errors, [])
} finally { await browser.close() }
