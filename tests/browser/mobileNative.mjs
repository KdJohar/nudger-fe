import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// All API traffic is fixture-only. Never send or update a real account.
const playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browserEngine = process.env.BROWSER_ENGINE || 'chromium'
assert.ok(['chromium', 'webkit'].includes(browserEngine))
const baseUrl = process.env.UI_BASE_URL || 'http://127.0.0.1:5174'
const artifactDir = process.env.MOBILE_NATIVE_ARTIFACT_DIR || '/tmp/nudger-mobile-native'
const captureDesktop = process.argv.includes('--capture-desktop')
const browser = await playwright[browserEngine].launch({ headless: true,
  ...(browserEngine === 'chromium' ? { channel: 'chrome' }
    : process.env.WEBKIT_EXECUTABLE_PATH ? { executablePath: process.env.WEBKIT_EXECUTABLE_PATH } : {}),
})
const failures = []
const profile = { id: 'fixture-merchant', user_id: 'fixture-user', display_name: 'Studio Notes', nudger_id: 'studio-notes', profile_type: 'platform', is_active: true, profile_image_url: '/nudge.png' }
const snapshot = { total_audience: 100, new_subscribers: 10, unsubscribed_users: 2, unsubscribe_rate: 2, muted_subscribers: 3, reachable_subscribers: 97, broadcast_reach: 97, transactional_reach: 97 }
const history = Array.from({ length: 20 }, (_, index) => ({ id: `fixture-${index}`, title: `Studio update ${index + 1}`, message: 'A useful update for your audience. The accepted card design stays the same.', sender: 'platform', nudge_type: 'broadcast', status: 'completed', created_at: '2026-10-07T12:00:00Z', completed_at: '2026-10-07T12:00:02Z', stats: { total_audience: 100, total_devices: 100, delivered_users: 97, muted_users: 3, failed_deliveries: 0 } }))
const paths = ['/audience', '/nudges', '/profile', '/token', '/compose']

async function setup(width, theme, height = 812, touch = false) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' })
  await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-refresh'))
  const page = await context.newPage()
  await page.clock.setFixedTime(new Date('2026-10-08T12:00:00Z'))
  page.on('pageerror', error => failures.push(error.message))
  await page.route('**/v1/**', async route => {
    const request = route.request(), url = new URL(request.url())
    let body
    if (url.pathname.endsWith('/refresh')) body = { data: { auth: { access_token: 'fixture-session', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Studio Notes', email: 'fixture@example.test' }, merchant_profile: profile } }
    else if (request.method() !== 'GET') { failures.push(`Unexpected mutation: ${request.method()} ${url.pathname}`); await route.abort(); return }
    else if (url.pathname.endsWith('/profile')) body = { data: profile }
    else if (url.pathname.endsWith('/token')) body = { data: { has_token: false, token: null, token_prefix: null, created_at: null, rotated_at: null } }
    else if (url.pathname.endsWith('/audience/overview')) body = { data: { ...snapshot, merchant_profile_id: profile.id, profile_type: 'platform', active_subscribers: 100, period: url.searchParams.get('period') || '30d', breakdown: snapshot, comparison: { period: '30d', current: snapshot, previous: snapshot }, trend: [], comparison_trend: [], generated_at: '2026-10-07T00:00:00Z' } }
    else body = { data: { items: history, next: null, page_size: 20 } }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  return { context, page }
}

async function open(page, path) {
  await page.goto(`${baseUrl}${path}`)
  await page.locator('.page-layout .header__title').waitFor({ state: 'attached' })
  if (path === '/nudges') await page.locator('.nudge-card').first().waitFor()
  if (path === '/audience') await page.locator('.ui-stat').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
}

async function desktopLayout(page) {
  return page.evaluate(() => {
    const selectors = ['.app-drawer', '.app-main__container', '.header__content', '.header__title', '.header__filters', '.ui-pill-tabs', '.page-layout__window', '.ui-stat', '.ui-panel', '.nudge-card', '.ui-detail-card', '.ui-editor-panel', '.nudges-view__fab']
    return Object.fromEntries(selectors.map(selector => [selector, [...document.querySelectorAll(selector)].map(el => {
      const rect = el.getBoundingClientRect(), style = getComputedStyle(el)
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, font: style.font, padding: style.padding, gap: style.gap, background: style.backgroundColor, border: style.border, overflow: style.overflow }
    })]))
  })
}

async function assertDock(page, expectedBottomGap = 4) {
  const dock = await page.locator('.app-bottom-nav').evaluate(el => {
    const rect = el.getBoundingClientRect(), wrap = el.closest('.v-application__wrap').getBoundingClientRect()
    return { bottomGap: innerHeight - rect.bottom, frameBottom: wrap.bottom,
      buttons: [...el.querySelectorAll('a')].map(button => {
        const bounds = button.getBoundingClientRect()
        return { width: bounds.width, height: bounds.height }
      }) }
  })
  assert.ok(Math.abs(dock.frameBottom - await page.evaluate(() => innerHeight)) <= 1, 'App frame fills the visible viewport')
  assert.ok(Math.abs(dock.bottomGap - expectedBottomGap) <= 1, `Unexpected bottom gap: ${JSON.stringify(dock)}`)
  assert.ok(dock.buttons.every(button => button.width >= 48 && button.height >= 48), 'Navigation keeps 48px targets')
}

async function assertFrame(page) {
  const frame = await page.evaluate(() => {
    const scrolling = document.scrollingElement, panel = document.querySelector('.page-layout__window')
    const shell = document.querySelector('.app-shell')
    return { path: location.pathname, shellClass: document.querySelector('.v-application')?.className, documentHeight: scrolling.scrollHeight, height: innerHeight, documentWidth: scrolling.scrollWidth, width: innerWidth, pageScroll: scrollY, panelOverflow: panel ? getComputedStyle(panel).overflowY : 'missing', touchAction: shell ? getComputedStyle(shell).touchAction : 'missing' }
  })
  assert.ok(frame.documentHeight <= frame.height + 1, JSON.stringify(frame))
  assert.ok(frame.documentWidth <= frame.width, JSON.stringify(frame))
  assert.equal(frame.pageScroll, 0)
  assert.equal(frame.panelOverflow, 'auto')
  assert.equal(frame.touchAction, 'pan-y')
  assert.equal(await page.locator('.app-bar, .v-toolbar__content').count(), 0, 'Mobile starts directly with the page frame')
  await assertDock(page)
  if (['/audience', '/nudges'].includes(frame.path)) {
    const headingRow = await page.locator('.header__content').boundingBox()
    assert.equal(headingRow.height, 1, 'Page heading remains accessible without taking visual space')
    assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1)
    const filterRow = await page.locator('.header__filters').boundingBox()
    assert.ok(filterRow.y <= 12, 'Filters start directly below the safe-area inset')
  }
}

try {
  await mkdir(artifactDir, { recursive: true })
  const desktop = {}
  for (const theme of ['light', 'dark']) {
    const { page, context } = await setup(1440, theme)
    for (const path of paths) {
      await open(page, path)
      desktop[`${theme}${path}`] = await desktopLayout(page)
      assert.equal(await page.locator('.app-bottom-nav').count(), 0)
      assert.equal(await page.locator('.app-drawer').isVisible(), true)
    }
    await context.close()
  }
  const baseline = join(artifactDir, 'desktop-before.json')
  if (captureDesktop) {
    await writeFile(baseline, JSON.stringify(desktop, null, 2))
    console.log(`Captured all five desktop routes in both themes: ${baseline}`)
  } else {
    try { assert.deepEqual(desktop, JSON.parse(await readFile(baseline, 'utf8'))); console.log('PASS desktop: all five routes match pre-change geometry and computed styles in both themes') }
    catch (error) { if (error.code !== 'ENOENT') throw error; console.log('No local pre-change baseline; desktop sidebar/route assertions passed') }
    for (const theme of ['light', 'dark']) for (const [width, height] of [[320, 812], [375, 812], [390, 844], [440, 956], [412, 915], [768, 812], [844, 390]]) {
      const { page, context } = await setup(width, theme, height, true)
      for (const path of paths) { await open(page, path); await assertFrame(page) }
      await open(page, '/nudges')
      const panel = page.locator('.page-layout__window'), header = page.locator('.header__content'), filters = page.locator('.header__filters')
      const panelInstance = await panel.elementHandle(), headerInstance = await header.elementHandle()
      const before = { header: await header.boundingBox(), filters: await filters.boundingBox() }
      await panel.evaluate(el => { el.scrollTop = 400 })
      await page.waitForFunction(() => document.querySelector('.page-layout__window').scrollTop >= 399)
      await page.locator('.app-bottom-nav--compact').waitFor()
      assert.deepEqual(await header.boundingBox(), before.header)
      assert.deepEqual(await filters.boundingBox(), before.filters)
      await assertFrame(page)
      const tabs = page.getByRole('tab')
      assert.ok((await tabs.first().boundingBox()).height >= 48)
      assert.ok((await tabs.last().boundingBox()).width >= 48)
      assert.ok(await tabs.evaluateAll(items => items.every(el => {
        const label = el.querySelector('.v-btn__content')
        return label.scrollWidth <= el.clientWidth
      })), 'Compact labels fit without clipping')
      const slider = await page.locator('.v-tab[aria-selected="true"] .v-tab__slider').boundingBox()
      assert.ok(slider.height <= 32 && slider.height >= 28, `Nudgee-style compact selection surface: ${slider.height}`)
      assert.equal(await tabs.first().evaluate(el => getComputedStyle(el).fontSize), '11px')
      const track = await page.locator('.ui-pill-tabs .v-slide-group__content').evaluate(el => {
        const style = getComputedStyle(el, '::before')
        return el.getBoundingClientRect().height - parseFloat(style.top) - parseFloat(style.bottom)
      })
      assert.equal(track, 32, 'Nudgee-style visual track retains larger interactive targets')
      assert.ok(await page.locator('.nudge-card .v-chip').first().evaluate(el => el.getBoundingClientRect().height <= 24))
      await tabs.first().focus()
      await page.keyboard.press('End')
      await page.keyboard.press('Enter')
      assert.equal(await tabs.last().getAttribute('aria-selected'), 'true')
      await page.waitForFunction(() => document.querySelector('.nudge-list')?.getAttribute('aria-busy') === 'false')
      assert.equal(await panel.evaluate(el => el.scrollTop), 400, 'Filter refresh retains the actual scroll owner offset')
      await page.waitForFunction(() => !document.querySelector('.app-bottom-nav').classList.contains('app-bottom-nav--compact'))
      await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
      const last = await page.locator('.nudge-card').last().boundingBox(), nav = await page.locator('.app-bottom-nav').boundingBox()
      assert.ok(last.y + last.height <= nav.y, 'Final card clears the floating navigation')
      const fab = await page.locator('.nudges-view__fab').boundingBox()
      assert.ok(last.y + last.height <= fab.y, 'Final card also clears the floating send action')
      await page.locator('.app-bottom-nav').getByRole('link', { name: 'Profile', exact: true }).tap()
      await page.waitForURL('**/profile')
      assert.equal(await panel.evaluate(el => el.scrollTop), 0, 'A different route starts at the top')
      assert.equal(await panel.evaluate((el, original) => el === original, panelInstance), true)
      assert.equal(await header.evaluate((el, original) => el === original, headerInstance), true)
      await page.getByRole('button', { name: 'Edit details', exact: true }).click()
      const input = page.getByRole('textbox', { name: 'About', exact: true })
      await input.focus()
      assert.ok(await input.evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16))
      await assertFrame(page)
      // Reload tests authenticated SPA deep links without a second shell.
      await page.reload(); await header.waitFor(); await assertFrame(page)
      if (width === 375) {
        await open(page, '/nudges')
        const trigger = page.getByRole('button', { name: 'Send a nudge', exact: true })
        // Use keyboard activation to test a defined focus origin across browser engines.
        await trigger.focus()
        await page.keyboard.press('Enter'); await page.getByRole('dialog').waitFor()
        await page.waitForFunction(() => document.getElementById('app').inert)
        await page.waitForFunction(() => document.querySelector('.ui-sheet__title') === document.activeElement)
        await page.setViewportSize({ width, height: 540 })
        await page.waitForFunction(() => {
          const rect = document.querySelector('.ui-sheet__footer')?.getBoundingClientRect()
          return rect && rect.bottom <= innerHeight + 1
        })
        const footer = await page.locator('.ui-sheet__footer').boundingBox()
        assert.ok(footer.y + footer.height <= 541, 'Sheet actions remain in the reduced viewport')
        await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' })
        await page.waitForFunction(() => document.querySelector('.nudges-view__fab') === document.activeElement)
        await page.setViewportSize({ width, height })
        await page.screenshot({ path: join(artifactDir, `nudges-${theme}.png`) })
        await page.setViewportSize({ width: 1440, height })
        await page.locator('.app-bottom-nav').waitFor({ state: 'detached' })
        await page.locator('.app-drawer').waitFor()
        assert.equal(await page.locator('.app-bottom-nav').count(), 0)
        assert.equal(await page.locator('.app-drawer').isVisible(), true)
        await page.setViewportSize({ width, height }); await page.locator('.app-bottom-nav').waitFor(); await assertFrame(page)
        await page.goto(`${baseUrl}/`)
        await page.locator('.public-app').waitFor()
        await page.evaluate(() => scrollTo(0, 400))
        assert.ok(await page.evaluate(() => scrollY > 0), 'Public pages retain normal document scrolling')
      }
      console.log(`PASS ${browserEngine} ${width}x${height} ${theme}: bounded frame, bottom dock, content scroll, pinned controls, route persistence and deep links`)
      await context.close()
    }
    if (browserEngine === 'chromium') {
      for (const theme of ['light', 'dark']) for (const device of [
        { name: 'iPhone 14 safe areas', width: 390, height: 844, top: 47, bottom: 34 },
        { name: 'iPhone 16 Pro Max safe areas', width: 440, height: 956, top: 62, bottom: 34 },
        { name: 'Android gesture navigation', width: 412, height: 915, top: 24, bottom: 24 },
        { name: 'Android without bottom inset', width: 384, height: 854, top: 24, bottom: 0 },
      ]) {
        const { page, context } = await setup(device.width, theme, device.height, true)
        const session = await context.newCDPSession(page)
        await session.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: device.top, bottom: device.bottom, left: 0, right: 0 } })
        const bottomGap = Math.max(4, device.bottom - 8)
        for (const path of ['/audience', '/nudges', '/profile']) {
          await open(page, path); await assertDock(page, bottomGap)
          const panel = page.locator('.page-layout__window')
          await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
          await assertDock(page, bottomGap)
        }
        // Android browser chrome and an on-screen keyboard can reduce the available height.
        await page.setViewportSize({ width: device.width, height: 540 })
        await page.waitForFunction(() => Math.abs(document.querySelector('.v-application__wrap').getBoundingClientRect().bottom - innerHeight) <= 1)
        await assertDock(page, bottomGap)
        await page.setViewportSize({ width: device.width, height: device.height })
        await page.waitForFunction(() => Math.abs(document.querySelector('.v-application__wrap').getBoundingClientRect().bottom - innerHeight) <= 1)
        await assertDock(page, bottomGap)
        console.log(`PASS ${device.name} ${theme}: safe-area dock after scrolling, navigation and viewport changes`)
        await context.close()
      }
    }
  }
  assert.deepEqual(failures, [])
} finally { await browser.close() }
