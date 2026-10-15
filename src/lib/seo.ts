import { getSeoMetadata, type SeoRouteLike } from './seoMetadata'
export type { SeoMetadata } from './seoMetadata'

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

export function updateSeo(route: SeoRouteLike): void {
  const metadata = getSeoMetadata(route)
  document.title = metadata.title
  for (const [name, content] of Object.entries(metadata.names)) setMeta('name', name, content)
  for (const [property, content] of Object.entries(metadata.properties)) setMeta('property', property, content)
  setCanonical(metadata.canonical)
  setStructuredData(metadata.structuredData)
}
