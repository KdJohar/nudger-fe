// Progressive enhancement only: all content, navigation and FAQs work without JS.
const root = document.documentElement
const themeKey = 'plug-nudge-theme'
const media = matchMedia('(prefers-color-scheme: dark)')
let preference = 'system'
try { preference = localStorage.getItem(themeKey) || 'system' } catch { /* Storage is optional. */ }
const themeButton = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
function applyTheme() {
  const dark = preference === 'dark' || (preference === 'system' && media.matches)
  root.dataset.theme = dark ? 'dark' : 'light'
  themeButton?.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme')
}
applyTheme()
media.addEventListener('change', applyTheme)
window.addEventListener('storage', event => {
  if (event.key === themeKey || event.key === null) { preference = event.newValue || 'system'; applyTheme() }
})
if (themeButton) {
  themeButton.hidden = false
  themeButton.addEventListener('click', () => {
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(themeKey, preference) } catch { /* Keep in-memory choice. */ }
    applyTheme()
  })
}
const menu = document.querySelector<HTMLDetailsElement>('.m-mobile-menu')
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false }))
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary')?.focus() }
})
document.addEventListener('click', event => {
  if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false
})
const search = document.querySelector<HTMLInputElement>('[data-integration-search]')
const category = document.querySelector<HTMLSelectElement>('[data-integration-category]')
const cards = [...document.querySelectorAll<HTMLElement>('#integration-list .m-integration')]
function filterCatalog() {
  const query = search?.value.trim().toLowerCase() || ''
  let count = 0
  for (const card of cards) {
    card.hidden = !(card.dataset.search?.includes(query) && (!category?.value || card.dataset.category === category.value))
    if (!card.hidden) count++
  }
  const result = document.querySelector('[data-result-count]')
  if (result) result.textContent = `${count} ${count === 1 ? 'integration or guide' : 'integrations and guides'}`
  const empty = document.querySelector<HTMLElement>('[data-no-results]')
  if (empty) empty.hidden = count !== 0
}
const controls = document.querySelector<HTMLElement>('[data-catalog-controls]')
if (controls) controls.hidden = false
search?.addEventListener('input', filterCatalog)
category?.addEventListener('change', filterCatalog)
document.querySelector('[data-reset-search]')?.addEventListener('click', () => {
  if (search) search.value = ''
  if (category) category.value = ''
  filterCatalog(); search?.focus()
})
document.querySelectorAll<HTMLButtonElement>('[data-copy-code]').forEach(button => {
  if (!navigator.clipboard) return
  button.hidden = false
  button.addEventListener('click', async () => {
    const block = button.closest('.m-code-block')
    const status = block?.querySelector('[data-copy-status]')
    try {
      await navigator.clipboard.writeText(block?.querySelector('code')?.textContent || '')
      if (status) status.textContent = 'Example copied.'
    } catch { if (status) status.textContent = 'Copy unavailable. Select and copy the example below.' }
  })
})
// Keep production page-view reporting, without the workspace telemetry/runtime bundle.
// No local telemetry, identity, query strings, fragments, or per-integration click events.
function initializePublicAnalytics() {
  if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return
  const id = (window as Window & { __NUDGER_CONFIG__?: { gaMeasurementId?: unknown } }).__NUDGER_CONFIG__?.gaMeasurementId
  if (typeof id !== 'string' || !/^G-[A-Z0-9]+$/.test(id)) return
  const browser = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
  if (document.querySelector('script[data-google-analytics]')) return
  const sanitize = (value: string) => { try { const url = new URL(value); return url.origin + url.pathname } catch { return '' } }
  browser.dataLayer = browser.dataLayer || []
  browser.gtag = function () { browser.dataLayer?.push(arguments) }
  const script = document.createElement('script')
  script.async = true
  script.dataset.googleAnalytics = id
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)
  browser.gtag('js', new Date())
  browser.gtag('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname, page_referrer: sanitize(document.referrer) })
  browser.gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_path: location.pathname,
    page_title: document.title, page_referrer: sanitize(document.referrer) })
}
window.addEventListener('load', () => { setTimeout(initializePublicAnalytics, 1500) }, { once: true })
