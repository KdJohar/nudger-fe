import type { MerchantProfile } from './merchantProfile'

export interface IdentityUser {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number
}

export interface AuthResponse {
  message: string
  data: {
    auth: AuthTokens
    user: IdentityUser
    merchant_profile: MerchantProfile | null
  }
  errors: Record<string, unknown>
}

export interface AuthSessionResponse {
  message: string
  data: {
    user: IdentityUser
    merchant_profile: MerchantProfile | null
  }
  errors: Record<string, unknown>
}

export interface GoogleStartResponse {
  authorization_url: string
  expires_in: number
}

export interface ApiErrorPayload {
  message?: string
  errors?: {
    code?: string
    retryable?: boolean
  }
}
