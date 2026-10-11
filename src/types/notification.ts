export type NotificationFormat = 'basic' | 'rich'
export type CtaLabel = 'watch_now' | 'learn_more'
export interface NotificationContent {
  notification_format?: NotificationFormat
  media_url?: string | null
  destination_url?: string | null
  cta_label?: CtaLabel | null
}
export type NotificationRequest =
  | { message: string; notification_format: 'basic' }
  | { message: string; notification_format: 'rich'; destination_url: string; cta_label: CtaLabel; media_url?: string }
export interface NotificationDraft {
  notificationFormat: NotificationFormat
  destinationUrl: string
  ctaLabel: CtaLabel
  mediaUrl: string | null
}
export interface NotificationCapabilities {
  allowed_formats: NotificationFormat[]
  delivery_types: ('broadcast' | 'transactional')[]
  cta_presets: { value: CtaLabel; label: string }[]
  message_max_characters: number
  title_max_characters: number
  url_max_characters: number
  media_optional_for_rich: boolean
  source_max_bytes: number
  final_max_bytes: number
  max_dimension: number
  notification_day_limit: number
  media_cleanup_days: number
}
