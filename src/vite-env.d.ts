/// <reference types="vite/client" />

interface Window {
  __NUDGER_CONFIG__?: {
    apiBaseUrl?: string
    nudgeeAndroidUrl?: string
    nudgeeIosUrl?: string
    nudgerRegisterUrl?: string
    nudgerLoginUrl?: string
    profileImageSourceMaxBytes?: string
    profileImageFinalMaxBytes?: string
    profileImageMaxDimension?: string
    profileImageWebpQuality?: string
    profileImagePresignUrlTtlSeconds?: string
  }
}
