import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PUBLIC_PAGES, SITE_ORIGIN, renderPublicPage, renderSeoHead } from '../build/prerender/entry-server.js'

const output = resolve('dist')
// Public generation must stay independent of API availability, accounts and deployment envs.
globalThis.fetch = async () => { throw new Error('Network requests are forbidden while generating public HTML.') }
const template = await readFile(resolve(output, 'index.html'), 'utf8')
const seoOutlet = /<!--seo-head-start-->[\s\S]*?<!--seo-head-end-->/
assert.match(template, seoOutlet, 'The initial HTML must expose one metadata outlet')
assert.ok(template.includes('<div id="app"></div>'), 'The initial HTML must expose one app outlet')

const shellHead = renderSeoHead({ path: '/', meta: { title: 'Nudger | Plug & Nudge', seo: { description: 'Sign in to your private Nudger workspace.', robots: 'noindex,nofollow' } } })
  .replace(/<link rel="canonical"[^>]*>/, '')
await writeFile(resolve(output, 'app.html'), template.replace(seoOutlet, shellHead))

const publicLocations = []
const generatedHtml = []
for (const page of PUBLIC_PAGES) {
  const rendered = await renderPublicPage(page.path)
  assert.equal((rendered.html.match(/<h1(?:\s|>)/g) || []).length, 1, `${page.path} needs one rendered heading`)
  assert.match(rendered.html, /<main[\s>]/, `${page.path} needs actual page content`)
  assert.match(rendered.html, /href="\/privacy"/, `${page.path} needs crawlable footer links`)
  const html = template.replace(seoOutlet, rendered.head)
    .replace('</head>', `<style id="vuetify-theme-stylesheet">${rendered.themeStyles}</style></head>`)
    .replace('<div id="app"></div>', `<div id="app" data-prerendered>${rendered.html}</div>`)
  const directory = resolve(output, page.path.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, 'index.html'), html)
  generatedHtml.push(html)
  const file = page.path === '/' ? '/index.html' : `${page.path}/index.html`
  publicLocations.push(`location = ${page.path} { try_files ${file} =404; add_header Cache-Control "no-cache" always; }`)
  if (page.path !== '/') publicLocations.push(`location = ${page.path}/ { return 308 ${page.path}$is_args$args; }`)
}

const missing = await renderPublicPage('/page-not-found')
await writeFile(resolve(output, '404.html'), template.replace(seoOutlet, missing.head)
  .replace('</head>', `<style id="vuetify-theme-stylesheet">${missing.themeStyles}</style></head>`)
  .replace('<div id="app"></div>', `<div id="app" data-prerendered>${missing.html}</div>`))

// Generate routing and sitemap together so a newly added public page cannot be omitted.
await writeFile(resolve(output, 'public-routes.conf'), publicLocations.join('\n') + '\n')
await writeFile(resolve(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_PAGES.map(page => `  <url><loc>${SITE_ORIGIN}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`)

const version = createHash('sha256').update(generatedHtml.join('')).digest('hex').slice(0, 16)
const worker = (await readFile(resolve(output, 'sw.js'), 'utf8'))
  .replace('__BUILD_ID__', version)
  .replace('/*PUBLIC_PAGE_PATHS*/ []', JSON.stringify(PUBLIC_PAGES.map(page => page.path)))
await writeFile(resolve(output, 'sw.js'), worker)
console.log(`Generated ${PUBLIC_PAGES.length} public HTML pages, a private SPA shell, 404 page, sitemap and versioned service worker.`)
