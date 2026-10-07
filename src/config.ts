import { validateRuntimeConfig, type NudgerRuntimeConfig } from './lib/runtimeConfig'

export type { NudgerRuntimeConfig } from './lib/runtimeConfig'

interface WindowWithConfig extends Window {
  __NUDGER_CONFIG__?: Record<string, unknown>
}

export function getNudgerConfig(): NudgerRuntimeConfig {
  const runtime = typeof window !== 'undefined' ? (window as WindowWithConfig).__NUDGER_CONFIG__ : undefined
  // The selected environment file is authoritative; no bundled or localhost fallback.
  return validateRuntimeConfig(runtime)
}
