export async function copyText(value: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return
    }
  } catch { /* LAN HTTP and browser permissions may require a user-gesture fallback. */ }
  const previousFocus = document.activeElement
  const input = document.createElement('textarea')
  input.className = 'ui-clipboard-proxy'
  input.value = value
  input.readOnly = true
  input.setAttribute('aria-label', 'Copy text')
  document.body.append(input)
  input.select()
  try {
    if (!document.execCommand('copy')) throw new Error('Copy is unavailable. Select and copy the text manually.')
  } finally {
    input.remove()
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true })
  }
}
