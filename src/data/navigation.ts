export interface NavigationItem {
  label: string
  to: string
  icon: string
  description: string
  mobileLabel?: string
  mobileOrder?: number
  mobileVariant?: 'avatar'
  platformOnly?: boolean
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Audience',
    mobileOrder: 0,
    to: '/audience',
    icon: 'mdi-account-multiple-outline',
    description: 'Understand subscriber growth',
  },
  {
    label: 'New nudge',
    to: '/compose',
    icon: 'mdi-send-outline',
    description: 'Write and send a broadcast',
  },
  {
    label: 'Nudges',
    mobileOrder: 1,
    to: '/nudges',
    icon: 'mdi-message-badge-outline',
    description: 'Review delivered messages',
  },
  {
    label: 'Profile',
    mobileOrder: 3,
    mobileVariant: 'avatar',
    to: '/profile',
    icon: 'mdi-account-circle-outline',
    description: 'Manage your public identity',
  },
  {
    label: 'API access',
    mobileLabel: 'API token',
    mobileOrder: 2,
    to: '/token',
    icon: 'mdi-key-outline',
    description: 'Connect your platform',
    platformOnly: true,
  },
]
