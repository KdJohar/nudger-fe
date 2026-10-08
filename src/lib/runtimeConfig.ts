export interface NudgerRuntimeConfig {
  apiBaseUrl: string
  profileImageSourceMaxBytes: number
  profileImageFinalMaxBytes: number
  profileImageMaxDimension: number
  profileImageWebpQuality: number
  gaMeasurementId: string
  sentryDsn: string
  sentryEnvironment: string
  sentryTracesSampleRate: number
  newRelicAccountId: string
  newRelicApplicationId: string
  newRelicAgentId: string
  newRelicLicenseKey: string
  newRelicBeacon: string
  newRelicErrorBeacon: string
  newRelicTrustKey: string
}

export function validateRuntimeConfig(input: Record<string, unknown> = {}): NudgerRuntimeConfig {
  const apiBaseUrl = typeof input.apiBaseUrl === 'string' ? input.apiBaseUrl.trim() : ''
  const invalidEndpoint = () => new Error('VITE_API_BASE_URL must be an HTTP(S) URL or a root-relative path such as /.')
  if (!apiBaseUrl || /[\s\\?#]/.test(apiBaseUrl) || apiBaseUrl.startsWith('//')) throw invalidEndpoint()
  if (!apiBaseUrl.startsWith('/') && !/^https?:\/\//.test(apiBaseUrl)) throw invalidEndpoint()
  const url = new URL(apiBaseUrl, 'https://config-validation.invalid')
  if (url.username || url.password) throw invalidEndpoint()

  function positiveNumber(key: string, envName: string, integer = true): number {
    const value = input[key]
    const parsed = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN
    if (!Number.isFinite(parsed) || parsed <= 0 || (integer && !Number.isSafeInteger(parsed))) {
      throw new Error(`${envName} must be supplied as a positive ${integer ? 'integer' : 'number'}.`)
    }
    return parsed
  }
  function optionalString(key: string): string {
    return typeof input[key] === 'string' ? input[key].trim() : ''
  }
  function optionalRate(key: string, envName: string, fallback: number): number {
    const rawValue = optionalString(key)
    if (!rawValue) return fallback
    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      throw new Error(`${envName} must be a number between 0 and 1.`)
    }
    return parsed
  }
  const profileImageWebpQuality = positiveNumber('profileImageWebpQuality', 'VITE_PROFILE_IMAGE_WEBP_QUALITY', false)
  if (profileImageWebpQuality > 1) throw new Error('VITE_PROFILE_IMAGE_WEBP_QUALITY must be at most 1.')
  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, '') || '/',
    profileImageSourceMaxBytes: positiveNumber('profileImageSourceMaxBytes', 'VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES'),
    profileImageFinalMaxBytes: positiveNumber('profileImageFinalMaxBytes', 'VITE_PROFILE_IMAGE_FINAL_MAX_BYTES'),
    profileImageMaxDimension: positiveNumber('profileImageMaxDimension', 'VITE_PROFILE_IMAGE_MAX_DIMENSION'),
    profileImageWebpQuality,
    gaMeasurementId: optionalString('gaMeasurementId'),
    sentryDsn: optionalString('sentryDsn'),
    sentryEnvironment: optionalString('sentryEnvironment'),
    sentryTracesSampleRate: optionalRate('sentryTracesSampleRate', 'VITE_SENTRY_TRACES_SAMPLE_RATE', 0.1),
    newRelicAccountId: optionalString('newRelicAccountId'),
    newRelicApplicationId: optionalString('newRelicApplicationId'),
    newRelicAgentId: optionalString('newRelicAgentId'),
    newRelicLicenseKey: optionalString('newRelicLicenseKey'),
    newRelicBeacon: optionalString('newRelicBeacon'),
    newRelicErrorBeacon: optionalString('newRelicErrorBeacon'),
    newRelicTrustKey: optionalString('newRelicTrustKey'),
  }
}
