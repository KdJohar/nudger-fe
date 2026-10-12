import { ctaText, hasRichAction, safeNotificationUrl } from './notificationContent'
import type { NudgeHistoryItem, NudgeStatus } from '../types/nudges'

const numberFormat = new Intl.NumberFormat('en')
const compactNumberFormat = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const percentageFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 1 })
const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const statusDetails = {
  created: { label: 'Queued', color: undefined, icon: 'mdi-clock-outline' },
  processing: { label: 'Processing', color: 'info', icon: 'mdi-progress-clock' },
  completed: { label: 'Completed', color: 'success', icon: 'mdi-check-circle-outline' },
  failed: { label: 'Failed', color: 'error', icon: 'mdi-alert-circle-outline' },
} satisfies Record<NudgeStatus, { label: string; color: string | undefined; icon: string }>

export function completionDuration(item: NudgeHistoryItem): string | null {
  if (item.status !== 'completed' || !item.completed_at) return null
  const milliseconds = Date.parse(item.completed_at) - Date.parse(item.created_at)
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return null
  if (milliseconds < 1000) return '<1s'
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

function formatCount(value: number | undefined): string {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? numberFormat.format(value) : '—'
}

function formatPercentage(value: number): string {
  return Number.isFinite(value) && value >= 0 && value <= 100 ? `${percentageFormat.format(value)}%` : '—'
}

function formatEngagementAsOf(value?: string | null): string | null {
  if (!value) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? dateFormat.format(timestamp) : null
}

// Both presentations consume this mapping; missing engagement is never invented as zero.
export function presentNudgeHistory(item: NudgeHistoryItem) {
  const isRich = item.notification_format === 'rich'
  const createdAt = Date.parse(item.created_at)
  const duration = completionDuration(item)
  const engagementAsOf = formatEngagementAsOf(item.engagement_as_of)
  const hasEngagementSnapshot = isRich && Boolean(engagementAsOf) && Number.isSafeInteger(item.stats.total_clicks) && (item.stats.total_clicks ?? -1) >= 0
  const totalClicks = hasEngagementSnapshot ? formatCount(item.stats.total_clicks ?? -1) : '—'
  const ctr = hasEngagementSnapshot ? formatPercentage(item.stats.ctr ?? Number.NaN) : '—'
  const engagementLabel = !isRich
    ? 'Not applicable to Basic notifications'
    : !hasEngagementSnapshot
      ? 'Not available yet. Engagement updates nightly.'
      : `Snapshot through ${engagementAsOf}. Engagement updates nightly.`
  const totalClicksLabel = totalClicks === '—'
    ? `Total clicks: ${engagementLabel}`
    : `Total clicks: ${totalClicks}. ${engagementLabel}`
  const ctrLabel = ctr === '—'
    ? item.stats.total_audience === 0 && hasEngagementSnapshot
      ? `Click-through rate: not applicable because this snapshot has no inbox audience. ${engagementLabel}`
      : `Click-through rate: ${engagementLabel}`
    : `Click-through rate: ${ctr}. ${engagementLabel}`
  const pushDelivered = item.stats.push_delivered ?? item.stats.delivered_users
  const pushSilenced = item.stats.push_suppressed ?? item.stats.muted_users
  const metric = (key: string, label: string, count: number | undefined, description: string, tone?: string) => ({
    key, label, value: formatCount(count),
    compactValue: typeof count === 'number' && Number.isSafeInteger(count) && count >= 100000 ? compactNumberFormat.format(count) : formatCount(count),
    accessibleLabel: `${label}: ${formatCount(count)}. ${description}`, description, tone,
  })
  const metrics = [
    metric('audience', 'Inbox audience', item.stats.total_audience, 'Unique people with this message in their inbox.'),
    metric('delivered', 'Push delivered', pushDelivered, 'Successful device sends accepted by the push provider.', 'success'),
    metric('silenced', 'Push silenced', pushSilenced, 'People whose mute or notification preferences prevented push.'),
    { key: 'clicks', label: 'Total clicks', value: totalClicks, compactValue: hasEngagementSnapshot && (item.stats.total_clicks ?? 0) >= 100000 ? compactNumberFormat.format(item.stats.total_clicks!) : totalClicks,
      accessibleLabel: totalClicksLabel, description: 'Unique people who opened the notification’s action.', tone: undefined },
    { key: 'ctr', label: 'CTR', value: ctr, compactValue: ctr, accessibleLabel: ctrLabel,
      description: 'Unique clicks divided by inbox audience. Saved nightly.', tone: undefined },
    metric('failed', 'Failed pushes', item.stats.failed_deliveries, 'Device attempts that returned a failed push result.', item.stats.failed_deliveries > 0 ? 'error' : undefined),
    metric('devices', 'Push devices', item.stats.total_devices, 'Device attempts. One person may have several devices.'),
  ]
  return {
    ...item,
    formatLabel: isRich ? 'Rich' : 'Basic',
    sentLabel: Number.isFinite(createdAt) ? dateFormat.format(createdAt) : 'Date unavailable',
    statusDetails: statusDetails[item.status] ?? { label: 'Unknown', color: undefined, icon: 'mdi-help-circle-outline' },
    completionLabel: duration ? `Completed in ${duration}` : '—',
    cardStatusLabel: duration ? `Completed in ${duration}` : statusDetails[item.status]?.label ?? 'Unknown',
    audience: formatCount(item.stats.total_audience),
    delivered: formatCount(pushDelivered),
    muted: formatCount(pushSilenced),
    totalDevices: formatCount(item.stats.total_devices),
    metrics,
    cardMetrics: metrics.slice(0, 6),
    failedDeliveries: formatCount(item.stats.failed_deliveries),
    failed: item.stats.failed_deliveries > 0 ? `${formatCount(item.stats.failed_deliveries)} failed ${item.stats.failed_deliveries === 1 ? 'push' : 'pushes'}` : null,
    totalClicks,
    ctr,
    engagementLabel,
    totalClicksLabel,
    ctrLabel,
    actionLabel: hasRichAction(item) ? ctaText(item.cta_label) : null,
    actionUrl: hasRichAction(item) ? safeNotificationUrl(item.destination_url) : undefined,
    mediaUrl: isRich ? safeNotificationUrl(item.media_url) : undefined,
  }
}
