import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')

// Run the real public entry under a production origin; intercept every request so
// no test page view, referrer or event can reach Google or the production server.
export async function verifyPublicAnalytics(base) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  try {
    for (const origin of ['https://plugandnudge.com', base]) {
      const context = await browser.newContext()
      const tags = [], unexpected = []
      await context.route('**/*', async route => {
        const url = new URL(route.request().url())
        if (url.hostname === 'www.googletagmanager.com') {
          tags.push(url.href)
          await route.fulfill({ contentType: 'application/javascript', body: '' })
        } else if (url.origin === new URL(origin).origin) {
          if (url.pathname === '/runtime-config.js') {
            await route.fulfill({ contentType: 'application/javascript', body: 'window.__NUDGER_CONFIG__ = {gaMeasurementId: "G-XPJ12JHLR6"};' })
          } else {
            const response = await fetch(new URL(url.pathname + url.search, base))
            await route.fulfill({ status: response.status, contentType: response.headers.get('content-type') || 'text/plain', body: Buffer.from(await response.arrayBuffer()) })
          }
        } else { unexpected.push(url.href); await route.abort() }
      })
      const page = await context.newPage()
      for (const path of ['/', '/merchant']) {
        const before = tags.length
        await page.goto(origin + path + '?code=fixture-do-not-record#fixture-fragment', { referer: 'https://example.org/article?token=fixture-secret' })
        if (origin === base) {
          await page.waitForTimeout(1800)
          assert.equal(tags.length, 0, 'Local preview must never load Analytics, even if given a production ID')
          assert.equal(await page.evaluate(() => window.dataLayer), undefined)
        } else {
          await page.waitForFunction(() => window.dataLayer?.length >= 3)
          const queue = await page.evaluate(() => window.dataLayer.map(args => ({ args: Array.from(args), isArray: Array.isArray(args) })))
          assert.equal(tags.length - before, 1, 'One tag per document')
          assert.ok(tags.at(-1).includes('id=G-XPJ12JHLR6'))
          assert.equal(queue.every(item => !item.isArray), true, 'Supported gtag arguments queue')
          const config = queue.find(item => item.args[0] === 'config').args
          assert.equal(config[1], 'G-XPJ12JHLR6')
          assert.equal(config[2].send_page_view, false)
          assert.equal(config[2].allow_google_signals, false)
          assert.equal(config[2].allow_ad_personalization_signals, false)
          const views = queue.filter(item => item.args[0] === 'event' && item.args[1] === 'page_view')
          assert.equal(views.length, 1, 'One manual page view per public document')
          assert.equal(views[0].args[2].page_location, origin + path)
          assert.equal(views[0].args[2].page_path, path)
          assert.equal(views[0].args[2].page_title, await page.title())
          assert.equal(views[0].args[2].page_referrer, await page.evaluate(() => { const url = new URL(document.referrer); return url.origin + url.pathname }))
          assert.doesNotMatch(JSON.stringify(queue), /fixture-do-not-record|fixture-fragment|fixture-secret/)
        }
      }
      assert.deepEqual(unexpected, [], 'All requests must stay inside the isolated test')
      await context.close()
    }
    console.log('PASS production public Analytics: correct ID, one sanitized view per document, no local collection; all Google requests intercepted')
  } finally { await browser.close() }
}
