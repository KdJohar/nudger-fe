export interface NudgerConfig {
  apiBaseUrl: string
  nudgeeAndroidUrl: string
  nudgeeIosUrl: string
  nudgerRegisterUrl: string
  nudgerLoginUrl: string
  profileImageSourceMaxBytes: number
  profileImageFinalMaxBytes: number
  profileImageMaxDimension: number
  profileImageWebpQuality: number
  profileImagePresignUrlTtlSeconds: number
}

function getConfiguredValue(runtimeValue: string | undefined, viteValue: string | undefined, fallback = ''): string {
  return runtimeValue?.trim() || viteValue?.trim() || fallback
}

function getConfiguredNumber(runtimeValue: string | undefined, viteValue: string | undefined, fallback: number): number {
  const value = Number.parseFloat(getConfiguredValue(runtimeValue, viteValue))
  return Number.isFinite(value) && value > 0 ? value : fallback
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
    profileImageSourceMaxBytes: getConfiguredNumber(
      window.__NUDGER_CONFIG__?.profileImageSourceMaxBytes,
      import.meta.env.VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES,
      10 * 1024 * 1024,
    ),
    profileImageFinalMaxBytes: getConfiguredNumber(
      window.__NUDGER_CONFIG__?.profileImageFinalMaxBytes,
      import.meta.env.VITE_PROFILE_IMAGE_FINAL_MAX_BYTES,
      2 * 1024 * 1024,
    ),
    profileImageMaxDimension: getConfiguredNumber(
      window.__NUDGER_CONFIG__?.profileImageMaxDimension,
      import.meta.env.VITE_PROFILE_IMAGE_MAX_DIMENSION,
      1600,
    ),
    profileImageWebpQuality: getConfiguredNumber(
      window.__NUDGER_CONFIG__?.profileImageWebpQuality,
      import.meta.env.VITE_PROFILE_IMAGE_WEBP_QUALITY,
      0.82,
    ),
    profileImagePresignUrlTtlSeconds: getConfiguredNumber(
      window.__NUDGER_CONFIG__?.profileImagePresignUrlTtlSeconds,
      import.meta.env.VITE_PROFILE_IMAGE_PRESIGN_URL_TTL_SECONDS,
      600,
    ),
  }
}
