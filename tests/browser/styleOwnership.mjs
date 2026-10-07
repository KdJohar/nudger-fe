import assert from 'node:assert/strict'
import { join } from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const baseUrl = process.env.UI_BASE_URL || 'http://localhost:5174'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const failures = []
const profile = { id: 'fixture', user_id: 'fixture-user', display_name: 'Fixture Studio', nudger_id: 'fixture-studio', profile_type: 'platform', is_active: true, profile_image_url: '/nudge.png' }
const snapshot = { total_audience: 24, new_subscribers: 6, unsubscribed_users: 0, unsubscribe_rate: 0, muted_subscribers: 2, reachable_subscribers: 22, broadcast_reach: 22, transactional_reach: 22 }

try {
  for (const width of [320, 375, 768, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' })
    await context.addInitScript(() => localStorage.setItem('nudger.refresh_token', 'fixture-refresh'))
    const page = await context.newPage()
    page.on('pageerror', error => failures.push(error.message))
    await page.route('**/v1/**', async route => {
      const request = route.request(), url = new URL(request.url())
      let body
      if (url.pathname.endsWith('/refresh')) body = { data: { auth: { access_token: 'fixture-access', refresh_token: 'fixture-refresh', expires_in: 900 }, user: { id: 'fixture-user', name: 'Fixture' }, merchant_profile: profile } }
      else if (request.method() === 'GET' && url.pathname.endsWith('/audience/overview')) body = { data: {
        ...snapshot, merchant_profile_id: profile.id, profile_type: 'platform', active_subscribers: 24, period: url.searchParams.get('period') || '30d',
        breakdown: snapshot, comparison: { current: snapshot, previous: { ...snapshot, total_audience: 18 } },
        trend: [1, 2, 3].map(day => ({ date: `2026-10-0${day}`, active_subscribers: day * 8, new_subscribers: 2, unsubscribed_users: 0 })),
        comparison_trend: [1, 2, 3].map(day => ({ date: `2026-10-0${day}`, previous_date: `2026-09-0${day}`, active_subscribers: day * 8, previous_active_subscribers: day * 6 })),
        generated_at: '2026-10-07T00:00:00Z',
      } }
      else { failures.push(`Unexpected API request: ${request.method()} ${url.pathname}`); await route.abort(); return }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
    })
    await page.goto(`${baseUrl}/audience`)
    await page.locator('.ui-trend__point').first().waitFor()
    const chart = page.locator('.ui-trend__svg')
    assert.equal(await chart.locator('[style], [vector-effect], [stroke], [fill]').count(), 0)
    const geometry = await chart.locator('.ui-trend__line, .ui-trend__point').evaluateAll(elements => elements.map(el => ({
      vectorEffect: getComputedStyle(el).vectorEffect, stroke: getComputedStyle(el).stroke, strokeWidth: getComputedStyle(el).strokeWidth,
      path: el.getAttribute('d'), point: el.getAttribute('cx'),
    })))
    assert.equal(geometry.length, 4)
    for (const item of geometry) {
      assert.equal(item.vectorEffect, 'non-scaling-stroke')
      assert.notEqual(item.stroke, 'none')
      assert.ok(parseFloat(item.strokeWidth) > 0)
      assert.doesNotMatch(item.path || item.point, /NaN|Infinity/)
    }
    const scrubber = page.getByRole('slider')
    const before = await scrubber.getAttribute('aria-valuetext')
    await scrubber.focus()
    await page.keyboard.press('ArrowLeft')
    assert.notEqual(await scrubber.getAttribute('aria-valuetext'), before)
    const colors = await page.locator('.v-application').evaluate(el => {
      const style = getComputedStyle(el)
      return { background: style.getPropertyValue('--v-theme-background').trim(), surface: style.getPropertyValue('--v-theme-surface').trim() }
    })
    assert.equal(colors.background, colors.surface)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.equal(await page.locator('link[rel="stylesheet"]').count() > 0, true)
    const styleIds = await page.locator('style').evaluateAll(elements => elements.map(el => el.id))
    assert.ok(styleIds.every(id => id === 'vuetify-theme-stylesheet'), JSON.stringify(styleIds))
    if (process.env.STYLE_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.STYLE_SCREENSHOT_DIR, `audience-style-${width}-${theme}.png`), fullPage: true })
    console.log(`PASS ${width}px ${theme}: external chart CSS, unchanged geometry, keyboard scrubber, matching surfaces and no overflow`)
    await context.close()
  }
  assert.deepEqual(failures, [])
} finally { await browser.close() }
