import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PUBLIC_PAGES } from '../../build/prerender/entry-server.js'

const read = file => readFileSync(new URL(`../../dist/${file}`, import.meta.url), 'utf8')

test('built public documents contain full content and unique SEO before JavaScript', () => {
  for (const page of PUBLIC_PAGES) {
    const html = read(page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`)
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, page.path)
    assert.match(html, /<main[\s>]/)
    assert.match(html, /data-prerendered/)
    assert.ok(html.includes(`href="https://plugandnudge.com${page.path}"`))
    assert.ok(html.includes('name="robots" content="index,follow"'))
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1)
    assert.equal((html.match(/id="seo-structured-data"/g) || []).length, 1)
    assert.ok(html.includes('href="/privacy"') && html.includes('href="/delete-account"'))
    assert.match(html, /id="vuetify-theme-stylesheet"/)
    assert.match(html, /rel="manifest"/)
    assert.doesNotMatch(html, /fixture-refresh|access_token|refresh_token|__NUDGER_CONFIG__\s*=/)
  }
  assert.match(read('privacy/index.html'), /which users subscribed, unsubscribed, or clicked/)
  assert.match(read('delete-account/index.html'), /The in-app profile deletion/)
  const support = read('support/index.html')
  assert.match(support, /Nudge support\./)
  assert.match(support, /mailto:kd@plugandnudge\.com\?subject=Nudge%20support/)
  assert.match(support, /Email support/)
  assert.match(support, /Read the Privacy Policy/)
  assert.match(support, /Request account deletion/)
  assert.doesNotMatch(support, /Email a deletion request/)
})

test('generated sitemap/routing covers exactly public pages and private shell stays generic', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])
  assert.deepEqual(urls, PUBLIC_PAGES.map(page => `https://plugandnudge.com${page.path}`))
  for (const page of PUBLIC_PAGES) assert.ok(read('public-routes.conf').includes(`location = ${page.path} {`))
  assert.match(read('app.html'), /name="robots" content="noindex,nofollow"/)
  assert.doesNotMatch(read('app.html'), /data-prerendered|rel="canonical"|<h1|application\/ld\+json/)
  assert.match(read('404.html'), /This page isn’t here\./)
  assert.match(read('404.html'), /noindex,nofollow/)
})

test('service worker has a content-derived build version and exact public routes', () => {
  const worker = read('sw.js')
  assert.match(worker, /nudger-shell-[a-f0-9]{16}/)
  assert.doesNotMatch(worker, /__BUILD_ID__|\/\*PUBLIC_PAGE_PATHS\*\//)
  assert.doesNotThrow(() => new Function(worker))
  assert.ok(worker.includes(JSON.stringify(PUBLIC_PAGES.map(page => page.path))))
})

const base = process.env.SEO_BASE_URL
test('local container serves public HTML, real errors and private noindex headers', { skip: !base }, async () => {
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname), 'HTTP checks are local-only')
  for (const page of PUBLIC_PAGES) {
    const response = await fetch(`${base}${page.path}`)
    assert.equal(response.status, 200)
    assert.match(await response.text(), /<main[\s>]/)
  }
  for (const path of ['/audience', '/nudges', '/profile', '/compose', '/token', '/onboarding', '/pending', '/auth/callback?code=fixture', '/login']) {
    const response = await fetch(`${base}${path}`)
    assert.equal(response.status, 200, path)
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
    assert.doesNotMatch(await response.text(), /data-prerendered/)
  }
  for (const path of ['/no-such-page', '/privacy/index.html', '/assets/missing.js', '/missing.png']) assert.equal((await fetch(`${base}${path}`)).status, 404, path)
  const redirect = await fetch(`${base}/privacy/?test=value`, { redirect: 'manual' })
  assert.equal(redirect.status, 308)
  assert.equal(redirect.headers.get('location'), '/privacy?test=value')
  for (const path of ['/runtime-config.js', '/sw.js']) assert.match((await fetch(`${base}${path}`)).headers.get('cache-control'), /no-store/)
  assert.match((await fetch(`${base}/sitemap.xml`)).headers.get('content-type'), /xml/)
})
