import test from 'node:test'
import assert from 'node:assert/strict'
import { createSourceLoader } from './helpers/vueHarness.mjs'

const load = createSourceLoader()
const { PUBLIC_PAGES } = load('src/data/publicPages.ts')
const { getSeoMetadata, renderSeoHead } = load('src/lib/seoMetadata.ts')

test('every public route has its own canonical, metadata and structured content', () => {
  const titles = new Set()
  for (const page of PUBLIC_PAGES) {
    const route = { path: page.path, meta: { title: page.title, seo: { description: page.description, robots: 'index,follow' } } }
    const meta = getSeoMetadata(route)
    assert.equal(meta.canonical, `https://plugandnudge.com${page.path}`)
    assert.equal(meta.names.robots, 'index,follow')
    assert.equal(meta.properties['og:title'], page.title)
    assert.equal(meta.names['twitter:description'], page.description)
    assert.ok(meta.structuredData)
    assert.match(renderSeoHead(route), /application\/ld\+json/)
    titles.add(meta.title)
  }
  assert.equal(titles.size, PUBLIC_PAGES.length)
})

test('private/error metadata is noindex and has no public structured data', () => {
  for (const path of ['/audience', '/auth/callback?code=private#fragment', '/unknown']) {
    const route = { path, meta: {} }
    assert.equal(getSeoMetadata(route).names.robots, 'noindex,nofollow')
    assert.equal(getSeoMetadata(route).structuredData, undefined)
    assert.doesNotMatch(renderSeoHead(route), /application\/ld\+json|code=|#fragment/)
  }
})

test('generated head escapes metadata and cannot introduce HTML/script markup', () => {
  const html = renderSeoHead({ path: '/privacy?secret=ignored', meta: { title: '</title><script>alert("x")</script>', seo: { description: 'A & B "quoted" <private>', robots: 'index,follow' } } })
  assert.doesNotMatch(html, /<script>alert|<private>|secret=ignored/)
  assert.match(html, /&lt;\/title&gt;/)
  assert.match(html, /A &amp; B &quot;quoted&quot; &lt;private&gt;/)
  const json = html.match(/id="seo-structured-data">([\s\S]*?)<\/script>/)[1]
  assert.doesNotThrow(() => JSON.parse(json))
  assert.doesNotMatch(json, /</)
})
