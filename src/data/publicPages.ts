import { PUBLIC_INTEGRATIONS_ENABLED, PUBLISHED_INTEGRATIONS } from './publicFeatures'

export type LegalTopic = 'privacy' | 'terms' | 'security' | 'delete-account' | 'support'
export interface PublicPage { path: string; name: string; title: string; description: string; topic?: LegalTopic }

/** Shared by routing, initial HTML metadata and the generated crawler sitemap. */
export const PUBLIC_PAGES: readonly PublicPage[] = [
  { path: '/', name: 'home', title: 'Nudge | Updates you choose. Alerts that matter.', description: 'Intentional notifications for your lock screen. Plug & Nudge helps people receive only the updates they choose.' },
  { path: '/merchant', name: 'merchant', title: 'For creators & platforms | Plug & Nudge', description: 'Send useful updates to subscribers with Nudge. Reach your audience, connect your platform and measure engagement. Free during the pilot.' },
  ...(PUBLIC_INTEGRATIONS_ENABLED ? [
    { path: '/integrations', name: 'integrations', title: 'Integrations for Mobile Push Notifications | Plug & Nudge', description: 'Connect your tools to Nudge for useful mobile push notifications. Explore available integrations and follow the setup guide.' },
    ...PUBLISHED_INTEGRATIONS.map(item => ({ path: `/integrations/${item.slug}`, name: `integration-${item.slug}`, title: item.seo?.title ?? `${item.name} notifications with Nudge | Setup guide`, description: item.seo?.description ?? item.summary + ' ' + item.description })),
  ] : []),
  { path: '/privacy', name: 'privacy', topic: 'privacy', title: 'Privacy Policy | Plug & Nudge', description: 'Learn how Plug & Nudge keeps subscriber identity private while merchants see aggregate subscription and click statistics.' },
  { path: '/terms', name: 'terms', topic: 'terms', title: 'Terms of Service | Plug & Nudge', description: 'Read the Plug & Nudge Terms of Service for receivers, creators and developers.' },
  { path: '/security', name: 'security', topic: 'security', title: 'Security Statement | Plug & Nudge', description: 'Read about the security principles behind the Plug & Nudge receiver and sender experience.' },
  { path: '/delete-account', name: 'delete-account', topic: 'delete-account', title: 'Delete your Nudge account | Plug & Nudge', description: 'Request deletion of your Nudge account and personal data, and learn what in-app profile deletion removes or retains.' },
  { path: '/support', name: 'support', topic: 'support', title: 'Nudge Support | Plug & Nudge', description: 'Contact Nudge support for help with sign-in, notifications, subscriptions, personal hooks, privacy and account deletion.' },
] as const

export const SITE_ORIGIN = 'https://plugandnudge.com'
