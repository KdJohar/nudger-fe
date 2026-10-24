import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { build, transform } from 'esbuild'
import { PUBLIC_PAGES, SITE_ORIGIN, renderPublicDocument, renderSeoHead } from '../build/prerender/entry-server.js'

const output = resolve('dist')
globalThis.fetch = async () => { throw new Error('Network requests are forbidden while generating public HTML.') }
const template = await readFile(resolve(output, 'index.html'), 'utf8')
const seoOutlet = /<!--seo-head-start-->[\s\S]*?<!--seo-head-end-->/
assert.match(template, seoOutlet)
const shellHead = renderSeoHead({ path: '/', meta: { title: 'Nudger | Plug & Nudge', seo: { description: 'Sign in to your private Nudger workspace.', robots: 'noindex,nofollow' } } }).replace(/<link rel="canonical"[^>]*>/, '')
await writeFile(resolve(output, 'app.html'), template.replace(seoOutlet, shellHead))

const cssSource = (await readFile('src/styles/main.css', 'utf8')).match(/\/\* MARKETING_CSS_START[\s\S]*?\*\/([\s\S]*?)\/\* MARKETING_CSS_END \*\//)?.[1]
assert.ok(cssSource, 'Marketing CSS boundaries are required')
const css = (await transform(cssSource, { loader: 'css', minify: true })).code
const bundled = await build({ entryPoints: ['src/public/client.ts'], bundle: true, minify: true, format: 'esm', target: 'es2022', write: false })
const js = bundled.outputFiles[0].text
const hash = content => createHash('sha256').update(content).digest('hex').slice(0, 12)
const assets = { css: `/marketing/site-${hash(css)}.css`, js: `/marketing/site-${hash(js)}.js` }
await mkdir(resolve(output, 'marketing'), { recursive: true })
await writeFile(resolve(output, assets.css.slice(1)), css)
await writeFile(resolve(output, assets.js.slice(1)), js)
const publicLocations = [], generatedHtml = []
for (const page of PUBLIC_PAGES) {
  const html = await renderPublicDocument(page.path, assets)
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${page.path} needs one heading`)
  assert.match(html, /<main[\s>]/)
  assert.doesNotMatch(html, /rel="manifest"|data-prerendered|vuetify-theme-stylesheet/)
  const directory = resolve(output, page.path.slice(1))
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, 'index.html'), html)
  generatedHtml.push(html)
  const file = page.path === '/' ? '/index.html' : `${page.path}/index.html`
  publicLocations.push(`location = ${page.path} { try_files ${file} =404; add_header Cache-Control "no-cache" always; }`)
  if (page.path !== '/') publicLocations.push(`location = ${page.path}/ { return 308 ${page.path}$is_args$args; }`)
}
publicLocations.push('location = /for-nudgers { return 308 /merchant$is_args$args; }', 'location = /for-nudgers/ { return 308 /merchant$is_args$args; }')
await writeFile(resolve(output, '404.html'), await renderPublicDocument('/page-not-found', assets))
await writeFile(resolve(output, 'public-routes.conf'), publicLocations.join('\n') + '\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_PAGES.map(page => `  <url><loc>${SITE_ORIGIN}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`
await writeFile(resolve(output, 'sitemap.xml'), sitemap)
const version = createHash('sha256').update(template + generatedHtml.join('')).digest('hex').slice(0, 16)
const worker = (await readFile(resolve(output, 'sw.js'), 'utf8')).replace('__BUILD_ID__', version).replace('/*PUBLIC_PAGE_PATHS*/ []', JSON.stringify(PUBLIC_PAGES.map(page => page.path)))
await writeFile(resolve(output, 'sw.js'), worker)
await writeFile(resolve(output, 'marketing-assets.json'), JSON.stringify(assets))
console.log(`Generated ${PUBLIC_PAGES.length} static public pages. Public CSS: ${Buffer.byteLength(css)} bytes; JavaScript: ${Buffer.byteLength(js)} bytes. Workspace shell retained.`)
