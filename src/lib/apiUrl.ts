import { getNudgerConfig } from '../config'

function getApiBaseUrl(): URL {
  const { apiBaseUrl } = getNudgerConfig()
  return apiBaseUrl.startsWith('/')
    ? new URL(apiBaseUrl, window.location.origin)
    : new URL(apiBaseUrl)
}

export function resolveApiUrl(path: string): string {
  const routePath = decodeURIComponent(path.split('?')[0] || '')
  if (!path.startsWith('/') || path.startsWith('//') || /[\\#\s]/.test(path) ||
      routePath.startsWith('//') || routePath.includes('\\') || /(^|\/)\.{1,2}(\/|$)/.test(routePath)) {
    throw new Error('API routes must be root-relative paths.')
  }
  const base = getApiBaseUrl()
  const prefix = base.pathname.replace(/\/+$/, '')
  const url = new URL(`${base.origin}${prefix}${path}`)
  if (url.origin !== base.origin || !url.pathname.startsWith(`${prefix}/`)) {
    throw new Error('API routes must stay within the configured endpoint.')
  }
  return url.href
}

export function parseNextLink(nextLink: string, expectedPath: string): string {
  try {
    if (!nextLink || nextLink !== nextLink.trim() || /[\\\s]/.test(nextLink) || nextLink.startsWith('//')) throw new Error()
    const target = new URL(resolveApiUrl(expectedPath))
    const base = getApiBaseUrl()
    const url = new URL(nextLink, nextLink.startsWith('?') ? target : `${base.href.replace(/\/+$/, '')}/`)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error()
    if (url.pathname !== target.pathname && url.pathname !== expectedPath) throw new Error()
    // A server-generated link supplies only the cursor/query, never the request host.
    return `${expectedPath}${url.search}`
  } catch {
    throw new Error('The server returned an invalid pagination link. Refresh the list and try again.')
  }
}
