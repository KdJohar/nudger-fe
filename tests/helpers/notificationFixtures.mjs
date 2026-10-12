export const notificationCapabilities = {
  allowed_formats: ['basic', 'rich'], delivery_types: ['broadcast', 'transactional'],
  cta_presets: [{ value: 'watch_now', label: 'Watch now' }, { value: 'learn_more', label: 'Learn more' }],
  message_max_characters: 4096, title_max_characters: 120, url_max_characters: 2048,
  media_optional_for_rich: true, source_max_bytes: 10485760, final_max_bytes: 1000000,
  max_dimension: 1280, notification_day_limit: 7, media_cleanup_days: 8,
}
