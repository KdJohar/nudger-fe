export interface SeoMetadata {
  description: string
  robots?: string
  type?: 'website' | 'article'
}

interface SeoRouteLike {
  path: string
  meta: Record<string, unknown>
}

const SITE_ORIGIN = 'https://plugandnudge.com'
const DEFAULT_DESCRIPTION = 'Intentional notifications for your lock screen, without unwanted noise.'
const BRAND_IMAGE = `${SITE_ORIGIN}/icon-512.png`

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

function setCanonical(href: string): void {
  let element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }
  element.href = href
}

function setStructuredData(value: unknown): void {
  let element = document.getElementById('seo-structured-data') as HTMLScriptElement | null
  if (!value) {
    element?.remove()
    return
  }
  if (!element || element.tagName !== 'SCRIPT') {
    element?.remove()
    element = document.createElement('script')
    element.id = 'seo-structured-data'
    element.type = 'application/ld+json'
    document.head.append(element)
  }
  element.textContent = JSON.stringify(value)
}

function canonicalUrl(path: string): string {
  const url = new URL(path || '/', SITE_ORIGIN)
  url.search = ''
  url.hash = ''
  return url.toString()
}

export function updateSeo(route: SeoRouteLike): void {
  const title = typeof route.meta.title === 'string' ? route.meta.title : 'Plug & Nudge'
  const metadata = (route.meta.seo as SeoMetadata | undefined) ?? { description: DEFAULT_DESCRIPTION, robots: 'noindex,nofollow' }
  const canonical = canonicalUrl(route.path)
  const robots = metadata.robots ?? 'noindex,nofollow'
  const type = metadata.type ?? 'website'
  const isIndexable = robots.startsWith('index')

  document.title = title
  setMeta('name', 'description', metadata.description)
  setMeta('name', 'robots', robots)
  setMeta('name', 'googlebot', robots)
  setMeta('property', 'og:type', type)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', metadata.description)
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:image', BRAND_IMAGE)
  setMeta('property', 'og:image:alt', 'Plug & Nudge logo')
  setMeta('name', 'twitter:card', 'summary')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', metadata.description)
  setMeta('name', 'twitter:image', BRAND_IMAGE)
  setCanonical(canonical)

  if (!isIndexable) {
    setStructuredData(undefined)
    return
  }

  if (route.path === '/') {
    setStructuredData([
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'Plug & Nudge', url: SITE_ORIGIN, logo: BRAND_IMAGE },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Plug & Nudge', url: canonical, description: metadata.description },
    ])
    return
  }

  setStructuredData({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: canonical,
    description: metadata.description,
    isPartOf: { '@type': 'WebSite', name: 'Plug & Nudge', url: SITE_ORIGIN },
  })
}
