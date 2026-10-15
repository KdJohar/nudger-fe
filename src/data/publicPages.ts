/** Shared by routing, initial HTML metadata and the generated crawler sitemap. */
export const PUBLIC_PAGES = [
  { path: '/', name: 'home', title: 'Plug & Nudge | Never miss what matters', description: 'Intentional notifications for your lock screen. Plug & Nudge helps people receive only the updates they choose.' },
  { path: '/for-nudgers', name: 'for-nudgers', title: 'For creators & developers | Plug & Nudge', description: 'Send useful updates to subscribers who chose to hear from you with the Plug & Nudge Nudger workspace.' },
  { path: '/privacy', name: 'privacy', topic: 'privacy', title: 'Privacy Policy | Plug & Nudge', description: 'Learn how Plug & Nudge keeps subscriber identity private while merchants see aggregate subscription and click statistics.' },
  { path: '/terms', name: 'terms', topic: 'terms', title: 'Terms of Service | Plug & Nudge', description: 'Read the Plug & Nudge Terms of Service for receivers, creators and developers.' },
  { path: '/security', name: 'security', topic: 'security', title: 'Security Statement | Plug & Nudge', description: 'Read about the security principles behind the Plug & Nudge receiver and sender experience.' },
  { path: '/delete-account', name: 'delete-account', topic: 'delete-account', title: 'Delete your Nudge account | Plug & Nudge', description: 'Request deletion of your Nudge account and personal data, and learn what in-app profile deletion removes or retains.' },
] as const

export const SITE_ORIGIN = 'https://plugandnudge.com'
