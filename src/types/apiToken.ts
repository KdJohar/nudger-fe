export interface MerchantApiTokenData {
  has_token: boolean
  token: string | null
  token_prefix: string | null
  created_at: string | null
  rotated_at: string | null
}

export interface MerchantApiTokenResponse {
  message: string
  data: MerchantApiTokenData
  errors: Record<string, unknown>
}
