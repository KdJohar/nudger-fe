import { SITE_ORIGIN } from '../data/publicPages'

export interface SeoMetadata {
  description: string
  robots?: string
  type?: 'website' | 'article'
}

export interface SeoRouteLike {
  path: string
  meta: Record<string, unknown>
}

export function getSeoMetadata(route: SeoRouteLike) {
  const title = typeof route.meta.title === 'string' ? route.meta.title : 'Plug & Nudge'
  const metadata = (route.meta.seo as SeoMetadata | undefined) ?? { description: 'Intentional notifications for your lock screen, without unwanted noise.' }
  const canonical = new URL(route.path || '/', SITE_ORIGIN)
  canonical.search = ''
  canonical.hash = ''
  const robots = metadata.robots ?? 'noindex,nofollow'
  const brandImage = `${SITE_ORIGIN}/icon-512.png`
  const structuredData = !robots.startsWith('index') ? undefined : route.path === '/' ? [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Plug & Nudge', url: SITE_ORIGIN, logo: brandImage },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Plug & Nudge', url: canonical.href, description: metadata.description },
  ] : {
    '@context': 'https://schema.org', '@type': 'WebPage', name: title, url: canonical.href,
    description: metadata.description, isPartOf: { '@type': 'WebSite', name: 'Plug & Nudge', url: SITE_ORIGIN },
  }
  return {
    title, canonical: canonical.href, structuredData,
    names: {
      description: metadata.description, robots, googlebot: robots,
      'twitter:card': 'summary', 'twitter:title': title, 'twitter:description': metadata.description, 'twitter:image': brandImage,
    },
    properties: {
      'og:site_name': 'Plug & Nudge', 'og:type': metadata.type ?? 'website', 'og:title': title,
      'og:description': metadata.description, 'og:url': canonical.href, 'og:image': brandImage, 'og:image:alt': 'Plug & Nudge logo',
    },
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

/** Initial document head and SPA navigation use the same metadata source. */
export function renderSeoHead(route: SeoRouteLike): string {
  const metadata = getSeoMetadata(route)
  const tags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<link rel="canonical" href="${escapeHtml(metadata.canonical)}" />`,
    ...Object.entries(metadata.names).map(([name, content]) => `<meta name="${name}" content="${escapeHtml(content)}" />`),
    ...Object.entries(metadata.properties).map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}" />`),
  ]
  if (metadata.structuredData) {
    const json = JSON.stringify(metadata.structuredData).replace(/</g, '\\u003c')
    tags.push(`<script type="application/ld+json" id="seo-structured-data">${json}</script>`)
  }
  return tags.join('\n    ')
}
