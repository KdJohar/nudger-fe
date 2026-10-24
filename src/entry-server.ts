import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import PublicSite from './public/PublicSite.vue'
import { PUBLIC_PAGES, SITE_ORIGIN } from './data/publicPages'
import { renderSeoHead } from './lib/seoMetadata'

export { PUBLIC_PAGES, SITE_ORIGIN, renderSeoHead }

/** Build-only Vue renderer. Public documents have no hydration, router or app session. */
export async function renderPublicPage(path: string) {
  const page = PUBLIC_PAGES.find(item => item.path === path)
  const html = await renderToString(createSSRApp(PublicSite, { path }))
  const head = renderSeoHead({ path, meta: {
    title: page?.title || 'Page not found | Plug & Nudge',
    seo: { description: page?.description || 'This page could not be found. Return to Plug & Nudge.', robots: page ? 'index,follow' : 'noindex,nofollow' },
  } })
  return { html, head }
}

export async function renderPublicDocument(path: string, assets: { css: string; js: string }) {
  const { html, head } = await renderPublicPage(path)
  return `<!doctype html>
<html lang="en" class="marketing-document">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#FF6B4A" />
${head}
<link rel="icon" type="image/png" href="/showcase/favicon.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="stylesheet" href="${assets.css}" />
<script src="/runtime-config.js" defer></script>
<script type="module" src="${assets.js}"></script>
</head><body data-static-public>${html}</body></html>`
}
