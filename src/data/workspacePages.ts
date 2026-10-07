import type { PageDefinition } from '../types/pageLayout'

export const WORKSPACE_PAGES: Record<string, PageDefinition> = {
  audience: {
    title: 'Your audience',
    description: 'See who’s joining and who you can reach.',
  },
  nudges: {
    title: 'Your nudges',
    description: 'Review the updates you’ve sent.',
  },
  compose: {
    title: 'Send a nudge',
    description: 'Write an update for your subscribers.',
    action: { label: 'View history', icon: 'mdi-history', to: '/nudges' },
  },
  profile: {
    title: 'Your Nudger profile',
    description: 'Manage your public identity.',
  },
  token: {
    title: 'API access',
    description: 'Connect your platform. Send something that matters.',
    badge: { label: 'Platform only', icon: 'mdi-shield-lock-outline', tone: 'secondary' },
  },
}
