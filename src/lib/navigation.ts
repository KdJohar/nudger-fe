export function getCurrentPath(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

export function navigateTo(path: string, replace = false): void {
  const method = replace ? 'replaceState' : 'pushState'
  window.history[method]({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
