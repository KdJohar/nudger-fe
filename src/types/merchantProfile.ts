export type MerchantProfileType = 'creator' | 'platform'

export interface MerchantProfile {
  id: string
  user_id: string
  profile_type: MerchantProfileType
  display_name: string
  nudger_id: string
  is_active: boolean
  profile_image_url: string
  website_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  facebook_url: string | null
  linkedin_url: string | null
  x_url: string | null
  created_at: string
  updated_at: string
}

export interface MerchantProfileResponse {
  message: string
  data: MerchantProfile
  errors: Record<string, unknown>
}

export interface MerchantProfileImagePresignData {
  upload_url: string
  object_key: string
  public_url: string
  method: 'PUT'
  content_type: 'image/webp'
  expires_in: number
  source_max_bytes: number
  final_max_bytes: number
  max_dimension: number
  webp_quality: number
}

export interface MerchantProfileImagePresignResponse {
  message: string
  data: MerchantProfileImagePresignData
  errors: Record<string, unknown>
}

export interface MerchantProfileForm {
  profile_type: MerchantProfileType
  display_name: string
  website_url: string
  instagram_url: string
  youtube_url: string
  facebook_url: string
  linkedin_url: string
  x_url: string
}
