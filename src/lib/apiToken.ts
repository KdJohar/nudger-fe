import { authenticatedRequest } from '../composables/useAuth'
import type { MerchantApiTokenResponse } from '../types/apiToken'

const API_TOKEN_PATH = '/v1/app-nudger/token'

export function getMerchantApiToken(): Promise<MerchantApiTokenResponse> {
  return authenticatedRequest<MerchantApiTokenResponse>(API_TOKEN_PATH)
}

export function generateMerchantApiToken(): Promise<MerchantApiTokenResponse> {
  return authenticatedRequest<MerchantApiTokenResponse>(API_TOKEN_PATH, { method: 'POST' })
}

export function rotateMerchantApiToken(): Promise<MerchantApiTokenResponse> {
  return authenticatedRequest<MerchantApiTokenResponse>(`${API_TOKEN_PATH}/rotate`, { method: 'POST' })
}
