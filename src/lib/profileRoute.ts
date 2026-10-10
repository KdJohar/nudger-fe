import type { MerchantProfile } from '../types/merchantProfile'

export function getPendingProfileRedirect(profile: MerchantProfile | null): '/audience' | '/onboarding' | null {
  if (!profile) return '/onboarding'
  return profile.is_active ? '/audience' : null
}
