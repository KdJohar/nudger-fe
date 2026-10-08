import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const read = path => readFileSync(resolve(root, path), 'utf8')

test('PWA manifest has installable iOS and Android metadata', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'))
  assert.equal(manifest.name, 'Plug & Nudge')
  assert.equal(manifest.short_name, 'Nudge')
  assert.equal(manifest.start_url, '/')
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
  for (const path of ['/login', '/onboarding', '/pending', '/workspace', '/token']) assert.match(robots, new RegExp(`Disallow: ${path.replace('/', '\\/')}`))
  for (const path of ['https://plugandnudge.com/', 'https://plugandnudge.com/for-nudgers', 'https://plugandnudge.com/privacy']) assert.match(sitemap, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
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
  assert.match(router, /robots: 'index,follow'/)
  assert.match(router, /robots: 'noindex,nofollow'/)
  assert.match(router, /description: 'Intentional notifications for your lock screen\./)
  assert.match(router, /description: 'Send useful updates to subscribers/)
})
