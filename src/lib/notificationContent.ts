import type { NotificationCapabilities, NotificationContent, NotificationDraft, NotificationRequest } from '../types/notification'

export function safeNotificationUrl(value: unknown, limit = 2048): string | undefined {
  if (typeof value !== 'string' || !value || value.length > limit || /[\s\\\u0000-\u001f\u007f]/.test(value)) return
  // Check the supplied grammar before URL normalizes hostnames or ambiguous slashes.
  if (!/^https:\/\/[a-zA-Z0-9.-]+(?::443)?(?:[/?#]|$)/.test(value)) return
  try {
    const url = new URL(value), host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !host.includes('.') ||
      host.endsWith('.') || /\.(local|internal|localhost)$/.test(host) || /^\d+$/.test(host.split('.').at(-1) || '') ||
      host.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return
    return value
  } catch { return }
}

export function ctaText(value?: string | null): string {
  return value === 'watch_now' ? 'Watch now' : value === 'learn_more' ? 'Learn more' : ''
}

export function validateNotificationDraft(draft: NotificationDraft, capabilities: NotificationCapabilities | null): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!capabilities) errors.notificationFormat = 'Load notification options before sending.'
  else if (!capabilities.allowed_formats.includes(draft.notificationFormat)) errors.notificationFormat = 'This notification format is not available for your profile.'
  if (draft.notificationFormat === 'rich') {
    if (!safeNotificationUrl(draft.destinationUrl.trim(), capabilities?.url_max_characters)) errors.destinationUrl = 'Enter a public HTTPS destination without credentials or a custom port.'
    if (!ctaText(draft.ctaLabel) || (capabilities && !capabilities.cta_presets.some(item => item.value === draft.ctaLabel))) errors.ctaLabel = 'Choose Watch now or Learn more.'
    if (draft.mediaUrl && !safeNotificationUrl(draft.mediaUrl)) errors.mediaUrl = 'Remove the invalid image and upload it again.'
  }
  return errors
}

export function buildNotificationRequest(message: string, draft: NotificationDraft): NotificationRequest {
  return draft.notificationFormat === 'basic'
    ? { message: message.trim(), notification_format: 'basic' }
    : { message: message.trim(), notification_format: 'rich', destination_url: draft.destinationUrl.trim(), cta_label: draft.ctaLabel, ...(draft.mediaUrl ? { media_url: draft.mediaUrl } : {}) }
}

export function hasRichAction(content: NotificationContent): boolean {
  return content.notification_format === 'rich' && Boolean(ctaText(content.cta_label) && safeNotificationUrl(content.destination_url))
}

export function isYouTubeDestination(value: string): boolean {
  if (!safeNotificationUrl(value)) return false
  const url = new URL(value), host = url.hostname.toLowerCase()
  const id = host === 'youtu.be' ? url.pathname.slice(1)
    : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)
      ? url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(shorts|embed|live)\/([^/]+)$/.exec(url.pathname)?.[2] : null
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id)
}
