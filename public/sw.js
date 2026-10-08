const CACHE_NAME = 'nudger-shell-v1'
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/nudge.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
]

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

function isStaticAsset(url) {
  return isSameOrigin(url) && (
    url.pathname.startsWith('/assets/') ||
    /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff2)$/.test(url.pathname) ||
    url.pathname === '/manifest.webmanifest'
  ) && !url.pathname.startsWith('/v1/') && url.pathname !== '/runtime-config.js' && url.pathname !== '/sw.js'
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || !isSameOrigin(url)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html')),
    )
    return
  }

  if (!isStaticAsset(url)) return
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const requestedUrl = typeof event.notification.data?.url === 'string' ? event.notification.data.url : '/'
  let targetUrl = new URL('/', self.location.origin)
  try {
    const candidate = new URL(requestedUrl, self.location.origin)
    if (candidate.origin === self.location.origin) targetUrl = candidate
  } catch {
    // Invalid or external notification URLs stay inside the app origin.
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && client.url !== targetUrl.href) await client.navigate(targetUrl.href)
          return client.focus()
        }
      }
      if ('openWindow' in self.clients) return self.clients.openWindow(targetUrl.href)
      return undefined
    }),
  )
})
