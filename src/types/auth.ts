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
  errors?: ApiErrorPayload['errors']
}

export interface AuthSessionResponse {
  message: string
  data: {
    user: IdentityUser
    merchant_profile: MerchantProfile | null
  }
  errors?: ApiErrorPayload['errors']
}

export interface GoogleStartResponse {
  message?: string
  data?: {
    authorization_url: string
    expires_in: number
  }
  authorization_url?: string
  expires_in?: number
}

export interface ApiErrorDetail {
  code?: string
  message?: string
  retryable?: boolean
  field_errors?: Record<string, string>
}

export interface ApiErrorPayload {
  detail?: { loc?: (string | number)[]; msg?: string }[]
  message?: string
  errors?: ApiErrorDetail | ApiErrorDetail[] | null
}
