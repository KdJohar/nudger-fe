export interface NudgerConfig {
  apiBaseUrl: string
  nudgeeAndroidUrl: string
  nudgeeIosUrl: string
  nudgerRegisterUrl: string
  nudgerLoginUrl: string
}

function getConfiguredValue(runtimeValue: string | undefined, viteValue: string | undefined, fallback = ''): string {
  return runtimeValue?.trim() || viteValue?.trim() || fallback
}

export function getNudgerConfig(): NudgerConfig {
  return {
    apiBaseUrl: getConfiguredValue(
      window.__NUDGER_CONFIG__?.apiBaseUrl,
      import.meta.env.VITE_API_BASE_URL,
      'http://localhost:8001',
    ),
    nudgeeAndroidUrl: getConfiguredValue(
      window.__NUDGER_CONFIG__?.nudgeeAndroidUrl,
      import.meta.env.VITE_NUDGEE_ANDROID_URL,
    ),
    nudgeeIosUrl: getConfiguredValue(
      window.__NUDGER_CONFIG__?.nudgeeIosUrl,
      import.meta.env.VITE_NUDGEE_IOS_URL,
    ),
    nudgerRegisterUrl: getConfiguredValue(
      window.__NUDGER_CONFIG__?.nudgerRegisterUrl,
      import.meta.env.VITE_NUDGER_REGISTER_URL,
    ),
    nudgerLoginUrl: getConfiguredValue(
      window.__NUDGER_CONFIG__?.nudgerLoginUrl,
      import.meta.env.VITE_NUDGER_LOGIN_URL,
    ),
  }
}
