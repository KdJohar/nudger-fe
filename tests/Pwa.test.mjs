import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const read = path => readFileSync(resolve(root, path), 'utf8')

test('PWA manifest has installable iOS and Android metadata', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'))
  assert.equal(manifest.name, 'Plug & Nudge')
  assert.equal(manifest.short_name, 'Nudger')
  assert.equal(manifest.start_url, '/audience')
  assert.equal(manifest.scope, '/')
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.orientation, 'any')
  assert.equal(manifest.theme_color, '#FF6B4A')
  assert.equal(manifest.background_color, '#FFFFFF')
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512', '512x512'])
  assert.equal(manifest.icons[2].purpose, 'maskable')
  for (const icon of manifest.icons) assert.ok(existsSync(resolve(root, `public${icon.src}`)), icon.src)
})

test('HTML entrypoint exposes PWA and static SEO metadata', () => {
  const html = read('index.html')
  assert.match(html, /name="application-name" content="Nudger"/)
  assert.match(html, /name="apple-mobile-web-app-title" content="Nudger"/)
  for (const expected of [
    'rel="manifest" href="/manifest.webmanifest"',
    'name="apple-mobile-web-app-capable" content="yes"',
    'name="apple-mobile-web-app-status-bar-style" content="black-translucent"',
    'rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"',
    'rel="canonical" href="https://plugandnudge.com/"',
    'property="og:title"',
    'name="twitter:card"',
    'application/ld+json',
  ]) assert.match(html, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), expected)
})

test('public crawl entrypoints exclude private SPA routes', () => {
  const robots = read('public/robots.txt')
  const sitemap = read('public/sitemap.xml')
  assert.match(robots, /Disallow: \/v1\//)
  assert.doesNotMatch(robots, /Disallow: \/runtime-config\.js/)
  assert.match(read('nginx.conf'), /X-Robots-Tag "noindex, nofollow"/)
  for (const path of ['https://plugandnudge.com/', 'https://plugandnudge.com/merchant', 'https://plugandnudge.com/privacy']) assert.match(sitemap, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.doesNotMatch(sitemap, /\/workspace|\/audience|\/token/)
})

test('service worker never caches runtime configuration or API responses', () => {
  const worker = read('public/sw.js')
  assert.match(worker, /url\.pathname !== '\/runtime-config\.js'/)
  assert.match(worker, /url\.pathname\.startsWith\('\/v1\/'\)/)
  assert.match(worker, /notificationclick/)
})

test('SPA route metadata includes indexable public pages and private noindex pages', () => {
  const router = read('src/router/index.ts')
  const pages = read('src/data/publicPages.ts')
  assert.match(router, /robots: 'index,follow'/)
  assert.match(router, /robots: 'noindex,nofollow'/)
  assert.match(pages, /description: 'Intentional notifications for your lock screen\./)
  assert.match(pages, /description: 'Send useful updates to subscribers/)
})

test('public legal pages contain the privacy promise and the footer omits API docs', () => {
  const legal = read('src/views/PublicInfoView.vue')
  const footer = read('src/layouts/PublicLayout.vue')
  for (const path of ['/privacy', '/security', '/terms']) assert.ok(read('src/data/publicPages.ts').includes(`path: '${path}'`), path)
  assert.match(legal, /PII is never shared with channel creators, other subscribers, or advertisers/)
  assert.match(legal, /We do not sell PII/)
  assert.doesNotMatch(legal, /Full document coming soon/)
  assert.doesNotMatch(footer, /Developer API Docs/)
})

test('account deletion requests are public and explain receiver deletion and aggregate analytics', () => {
  const legal = read('src/views/PublicInfoView.vue')
  assert.match(read('src/data/publicPages.ts'), /path: '\/delete-account'.*topic: 'delete-account'/)
  assert.match(read('src/layouts/PublicLayout.vue'), /href="\/delete-account"/)
  assert.match(legal, /mailto:kd@plugandnudge\.com\?subject=Nudge%20account%20deletion%20request/)
  assert.match(legal, /Subscriptions are deactivated, and inbox receipts are deleted from your inbox/)
  assert.match(legal, /Merchants can see only aggregate numbers/)
  assert.match(legal, /Historical delivery and click analytics may be retained/)
  assert.match(legal, /Merchant profiles are retained/)
  assert.match(legal, /Do not send passwords/)
})

test('support is public, discoverable and uses the existing page with safe contact instructions', () => {
  const legal = read('src/views/PublicInfoView.vue')
  assert.match(read('src/data/publicPages.ts'), /path: '\/support'.*topic: 'support'/)
  assert.match(read('src/layouts/PublicLayout.vue'), /href="\/support"/)
  assert.match(read('public/sitemap.xml'), /https:\/\/plugandnudge\.com\/support/)
  assert.match(legal, /mailto:kd@plugandnudge\.com\?subject=Nudge%20support/)
  assert.match(legal, /contactLabel: 'Email support'/)
  assert.match(legal, /Never send passwords, sign-in codes, session tokens, API credentials, or private hook URLs/)
  assert.match(legal, /label: 'Read the Privacy Policy', to: '\/privacy'/)
  assert.match(legal, /label: 'Request account deletion', to: '\/delete-account'/)
})
