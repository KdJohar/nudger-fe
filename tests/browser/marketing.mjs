import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { PUBLIC_PAGES } from '../../build/prerender/entry-server.js'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const { default: AxeBuilder } = await import(process.env.AXE_MODULE || '@axe-core/playwright')
const base = process.env.UI_BASE_URL || 'http://127.0.0.1:5174'
const integrationsPublished = PUBLIC_PAGES.some(page => page.path === '/integrations')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local checks only')
const output = process.env.MARKETING_SCREENSHOT_DIR || '.review'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const errors = [], results = []
try {
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } })
  const plain = await nojs.newPage()
  for (const route of PUBLIC_PAGES) {
    const response = await plain.goto(base + route.path)
    assert.equal(response.status(), 200, route.path)
    assert.equal(await plain.locator('h1').count(), 1, route.path)
    assert.equal(await plain.locator('link[rel=canonical]').getAttribute('href'), 'https://plugandnudge.com' + route.path)
    assert.equal(await plain.locator('link[rel=manifest]').count(), 0)
    assert.ok((await plain.locator('main').innerText()).length > 200)
    assert.ok(await plain.getByRole('link', { name: 'Privacy', exact: true }).count())
    if (!integrationsPublished) assert.equal(await plain.locator('a[href^="/integrations"]').count(), 0)
  }
  await plain.goto(base)
  await plain.locator('.m-mobile-menu summary').click()
  assert.equal(await plain.locator('.m-mobile-menu').getAttribute('open'), '')
  await plain.locator('.m-mobile-menu').getByRole('link', { name: 'For creators & platforms', exact: true }).click()
  assert.equal(new URL(plain.url()).pathname, '/merchant')
  if (!integrationsPublished) {
    for (const path of ['/integrations', ...['webhooks', 'python', 'curl', 'javascript', 'automations', 'iot', 'chatgpt'].map(slug => `/integrations/${slug}`)]) {
      const response = await plain.goto(base + path)
      assert.equal(response.status(), 404, path)
      assert.equal(await plain.locator('meta[name=robots]').getAttribute('content'), 'noindex,nofollow')
      assert.equal(await plain.locator('.m-integration, .m-guide').count(), 0)
    }
  }
  await nojs.close()
  console.log(`PASS all ${PUBLIC_PAGES.length} public pages, hidden integration 404s, metadata and mobile navigation without JavaScript`)

  for (const width of [320, 375, 768, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce', serviceWorkers: 'allow' })
    const page = await context.newPage()
    const requests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('request', request => requests.push(request.url()))
    for (const path of ['/', '/merchant', ...(integrationsPublished ? ['/integrations', '/integrations/python'] : ['/terms', '/support']), '/privacy']) {
      await page.goto(base + path)
      await page.locator('[data-theme-toggle]').waitFor({ state: 'visible' })
      assert.equal(await page.locator('h1').count(), 1)
      const geometry = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth,
        broken: [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.src) }))
      assert.ok(geometry.page <= width + 1, `${width}px ${theme} ${path} overflow: ${JSON.stringify(geometry)}`)
      assert.deepEqual(geometry.broken, [])
      assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), 0)
      const accessibility = await new AxeBuilder({ page }).analyze()
      assert.deepEqual(accessibility.violations.map(v => ({ id:v.id, impact:v.impact, nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary})) })), [], `${width}px ${theme} ${path}`)
      if ((width === 1440 && theme === 'light') || (width === 375 && theme === 'light') || (width === 375 && theme === 'dark' && path === '/')) {
        for (const img of await page.locator('img[loading=lazy]').all()) {
          await img.scrollIntoViewIfNeeded()
          try { await page.waitForFunction(el => el.complete && el.naturalWidth > 0, await img.elementHandle(), { timeout: 10000 }) }
          catch (error) { console.error('Lazy image failed:', path, await img.getAttribute('src')); throw error }
        }
        await page.evaluate(() => window.scrollTo(0,0))
        await page.screenshot({ path: `${output}/${path === '/' ? 'home' : path.slice(1).replaceAll('/','-')}-${width}-${theme}.png`, fullPage: true })
        if (path === '/') await page.screenshot({ path: `${output}/hero-${width}-${theme}.png` })
      }
    }
    assert.equal(requests.some(url => url.includes('/v1/') || url.includes('/assets/') || url.includes('googletagmanager') || url.endsWith('/sw.js')), false, 'No app runtime, API, worker or local telemetry requests')
    await context.close()
    console.log(`PASS ${width}px ${theme}: five page types, no overflow, Axe, static runtime isolation`)
  }
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  if (integrationsPublished) {
    await page.goto(base + '/integrations')
    await page.getByRole('searchbox').fill('PyThOn')
    assert.equal(await page.locator('#integration-list .m-integration:visible').count(), 1)
    await page.getByRole('combobox').selectOption('Automation')
    await page.getByText('No matches yet.', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    assert.equal(await page.locator('#integration-list .m-integration:visible').count(), 7)
    await page.getByRole('combobox').selectOption('AI assistants')
    assert.equal(await page.locator('#integration-list .m-integration:visible').count(), 1)
    await page.locator('#integration-list .m-integration:visible').click()
    assert.equal(new URL(page.url()).pathname, '/integrations/chatgpt')
    assert.ok(await page.getByRole('link', { name: /Ask about preview access/ }).count())
    await page.goto(base + '/integrations/python')
    await page.getByRole('button', { name: 'Copy example' }).click()
    await page.getByText('Example copied.', { exact: true }).waitFor()
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /from urllib.request/)
  }
  await page.goto(base + '/privacy')
  const theme = await page.locator('html').getAttribute('data-theme')
  await page.locator('[data-theme-toggle]').click()
  await page.reload()
  assert.notEqual(await page.locator('html').getAttribute('data-theme'), theme)
  await page.locator('.m-mobile-menu summary').click()
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.m-mobile-menu').getAttribute('open'), null)
  await page.goto(base)
  const dock = page.locator('.m-dock')
  assert.equal(await dock.isVisible(), true)
  assert.equal(await dock.getByRole('link').getAttribute('href'), 'https://apple.co/4yDfgX4')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  const clearance = await page.locator('.m-footer__bottom').evaluate(el => el.getBoundingClientRect().bottom <= document.querySelector('.m-dock').getBoundingClientRect().top)
  assert.equal(clearance, true, 'Download dock must not cover the footer')
  await context.close()
  console.log('PASS published controls, theme persistence, Escape, mobile download/footer')

  const perfContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 })
  const perf = await perfContext.newPage()
  const cdp = await perfContext.newCDPSession(perf)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline:false, latency:150, downloadThroughput:200000, uploadThroughput:100000 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate:4 })
  await perf.addInitScript(() => {
    window.__metrics = { lcp:0, cls:0 }
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__metrics.lcp=entry.startTime }).observe({type:'largest-contentful-paint',buffered:true})
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if(!entry.hadRecentInput) window.__metrics.cls+=entry.value }).observe({type:'layout-shift',buffered:true})
  })
  await perf.goto(base)
  await perf.waitForLoadState('networkidle')
  const metrics=await perf.evaluate(() => ({...window.__metrics, transfer:performance.getEntriesByType('resource').reduce((n,r)=>n+r.transferSize,0)}))
  results.push(metrics)
  assert.ok(metrics.cls <= .1, `CLS: ${metrics.cls}`)
  await perfContext.close()
  await writeFile(`${output}/verification.json`, JSON.stringify({pageCount:PUBLIC_PAGES.length,viewports:[320,375,768,1440],themes:['light','dark'],lab:results,errors},null,2))
  assert.deepEqual(errors,[])
  console.log('Mobile lab (150ms RTT, 1.6Mbps, 4× CPU):',metrics)
} finally { await browser.close() }

const { verifyPublicAnalytics } = await import('./publicAnalytics.mjs')
await verifyPublicAnalytics(base)
