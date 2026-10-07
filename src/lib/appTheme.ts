import { computed, readonly, ref, type Ref } from 'vue'

export type AppThemeName = 'light' | 'dark'
export type AppThemePreference = AppThemeName | 'system'
const THEME_STORAGE_KEY = 'plug-nudge-theme'

function normalizePreference(value: string | null): AppThemePreference {
  return value === 'light' || value === 'dark' ? value : 'system'
}

/** One app-owned preference; OS and storage events never write profile data. */
export function createAppThemeState(activeTheme: Ref<string>, browser?: Window) {
  const preference = ref<AppThemePreference>('system')
  const themeName = computed<AppThemeName>(() => activeTheme.value === 'dark' ? 'dark' : 'light')
  const isDark = computed(() => themeName.value === 'dark')
  let media: MediaQueryList | undefined
  let storage: Storage | undefined
  let isInitialized = false

  function applyTheme(): void {
    activeTheme.value = preference.value === 'system'
      ? (media?.matches ? 'dark' : 'light')
      : preference.value
  }

  function handleSystemChange(): void {
    if (preference.value === 'system') applyTheme()
  }

  function handleStorageChange(event: StorageEvent): void {
    if (!storage || event.storageArea !== storage || (event.key !== THEME_STORAGE_KEY && event.key !== null)) return
    preference.value = normalizePreference(event.key === null ? null : event.newValue)
    applyTheme()
  }

  function initializeTheme(): void {
    if (isInitialized || !browser) return
    isInitialized = true
    media = browser.matchMedia?.('(prefers-color-scheme: dark)')
    try {
      storage = browser.localStorage
      preference.value = normalizePreference(storage.getItem(THEME_STORAGE_KEY))
    } catch { /* Appearance remains usable when browser storage is unavailable. */ }
    applyTheme()
    media?.addEventListener('change', handleSystemChange)
    browser.addEventListener('storage', handleStorageChange)
  }

  function setTheme(nextTheme: AppThemePreference): void {
    initializeTheme()
    preference.value = nextTheme
    applyTheme()
    try { storage?.setItem(THEME_STORAGE_KEY, nextTheme) } catch { /* Keep the in-memory preference. */ }
  }

  function toggleTheme(): void { setTheme(isDark.value ? 'light' : 'dark') }

  function dispose(): void {
    media?.removeEventListener('change', handleSystemChange)
    browser?.removeEventListener('storage', handleStorageChange)
    isInitialized = false
  }

  return { preference: readonly(preference), themeName, isDark, initializeTheme, setTheme, toggleTheme, dispose }
}
