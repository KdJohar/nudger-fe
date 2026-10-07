export interface NudgerRuntimeConfig {
  apiBaseUrl: string
  profileImageSourceMaxBytes: number
  profileImageFinalMaxBytes: number
  profileImageMaxDimension: number
  profileImageWebpQuality: number
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
  const profileImageWebpQuality = positiveNumber('profileImageWebpQuality', 'VITE_PROFILE_IMAGE_WEBP_QUALITY', false)
  if (profileImageWebpQuality > 1) throw new Error('VITE_PROFILE_IMAGE_WEBP_QUALITY must be at most 1.')
  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, '') || '/',
    profileImageSourceMaxBytes: positiveNumber('profileImageSourceMaxBytes', 'VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES'),
    profileImageFinalMaxBytes: positiveNumber('profileImageFinalMaxBytes', 'VITE_PROFILE_IMAGE_FINAL_MAX_BYTES'),
    profileImageMaxDimension: positiveNumber('profileImageMaxDimension', 'VITE_PROFILE_IMAGE_MAX_DIMENSION'),
    profileImageWebpQuality,
  }
}
