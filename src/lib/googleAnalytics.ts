import type { Router } from 'vue-router'

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

/** Exclude OAuth codes, return URLs and fragments from analytics payloads. */
function pageUrl(path: string, origin: string): string {
  const url = new URL(path, origin)
  url.search = ''
  url.hash = ''
  return url.href
}

export function initializeGoogleAnalytics(measurementId: string, router: Router, browser: AnalyticsWindow = window, page: Document = document): void {
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) return
  if (page.querySelector('script[data-google-analytics]')) return
  browser.dataLayer = browser.dataLayer || []
  browser.gtag = function () { browser.dataLayer?.push(arguments) }

  const script = page.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  script.dataset.googleAnalytics = measurementId
  page.head.appendChild(script)
  browser.gtag('js', new Date())
  browser.gtag('config', measurementId, {
    send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
    page_location: pageUrl(browser.location.pathname, browser.location.origin),
    page_referrer: page.referrer ? pageUrl(page.referrer, browser.location.origin) : '',
  })

  let previousUrl = page.referrer ? pageUrl(page.referrer, browser.location.origin) : ''
  let previousPath: string | undefined
  const trackPageView = (path: string): void => {
    // Router readiness and the initial afterEach can resolve the same navigation.
    if (path === previousPath) return
    const location = pageUrl(path, browser.location.origin)
    browser.gtag?.('event', 'page_view', {
      page_location: location, page_path: path, page_title: page.title, page_referrer: previousUrl,
    })
    previousPath = path
    previousUrl = location
  }
  router.afterEach((route, _from, failure) => { if (!failure) trackPageView(route.path) })
  void router.isReady().then(() => trackPageView(router.currentRoute.value.path))
}
