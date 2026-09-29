export interface NudgerConfig {
  nudgeeAndroidUrl: string
  nudgeeIosUrl: string
  nudgerRegisterUrl: string
  nudgerLoginUrl: string
  nudgerGoogleAuthUrl: string
}

function getConfiguredValue(runtimeValue: string | undefined, viteValue: string | undefined): string {
  return runtimeValue?.trim() || viteValue?.trim() || ''
}

export function getNudgerConfig(): NudgerConfig {
  return {
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
    nudgerGoogleAuthUrl: getConfiguredValue(
      window.__NUDGER_CONFIG__?.nudgerGoogleAuthUrl,
      import.meta.env.VITE_NUDGER_GOOGLE_AUTH_URL,
    ),
  }
}
