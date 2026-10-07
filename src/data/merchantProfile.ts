import type { ChoiceCardItem } from '../types/choiceCards'
import type { MerchantProfileType } from '../types/merchantProfile'

export const PROFILE_LINK_FIELDS = [
  { key: 'website_url', label: 'Website', icon: 'mdi-web' },
  { key: 'instagram_url', label: 'Instagram', icon: 'mdi-instagram' },
  { key: 'youtube_url', label: 'YouTube', icon: 'mdi-youtube' },
  { key: 'facebook_url', label: 'Facebook', icon: 'mdi-facebook' },
  { key: 'linkedin_url', label: 'LinkedIn', icon: 'mdi-linkedin' },
  { key: 'x_url', label: 'X', icon: 'mdi-twitter' },
] as const

export const PROFILE_TYPE_OPTIONS: ChoiceCardItem<MerchantProfileType>[] = [
  {
    value: 'creator',
    title: 'Creator',
    icon: 'mdi-account-star-outline',
    description: 'For social media creators and influencers.',
    detail: 'Broadcast notifications to your audience only.',
  },
  {
    value: 'platform',
    title: 'Platform',
    icon: 'mdi-domain',
    description: 'For organisations, SaaS products, and apps.',
    detail: 'Transactional notifications to specific users, plus broadcasts to your audience.',
  },
]
