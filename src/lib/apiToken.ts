import type { AuthenticatedRequest } from './api'
import type { MerchantApiTokenData, MerchantApiTokenResponse } from '../types/apiToken'

export const API_TOKEN_MASK = '•••• •••• •••• •••• ••••'

export async function getApiToken(request: AuthenticatedRequest): Promise<MerchantApiTokenData> {
  const response = await request<MerchantApiTokenResponse>('/v1/app-nudger/token')
  return response.data
}

export async function createApiToken(request: AuthenticatedRequest): Promise<MerchantApiTokenData> {
  const response = await request<MerchantApiTokenResponse>('/v1/app-nudger/token', { method: 'POST' })
  return response.data
}

export async function rotateApiToken(request: AuthenticatedRequest): Promise<MerchantApiTokenData> {
  const response = await request<MerchantApiTokenResponse>('/v1/app-nudger/token/rotate', { method: 'POST' })
  return response.data
}
