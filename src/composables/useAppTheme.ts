import { inject, onScopeDispose, provide, type InjectionKey } from 'vue'
import { useTheme } from 'vuetify'
import { createAppThemeState } from '../lib/appTheme'

export type { AppThemeName, AppThemePreference } from '../lib/appTheme'
const appThemeKey: InjectionKey<ReturnType<typeof createAppThemeState>> = Symbol('app-theme')

/** Install once at App so every route and shortcut shares the same lifecycle. */
export function provideAppTheme(): void {
  const theme = useTheme()
  const state = createAppThemeState(theme.global.name, typeof window === 'undefined' ? undefined : window)
  state.initializeTheme()
  provide(appThemeKey, state)
  onScopeDispose(state.dispose)
}

export function useAppTheme() {
  const theme = inject(appThemeKey)
  if (!theme) throw new Error('Theme controls must render inside the app theme provider.')
  return theme
}
