export type AudiencePeriod = '7d' | '30d' | '90d'

export interface AudienceTrendPoint {
  date: string
  active_subscribers: number
  new_subscribers: number
  unsubscribed_users: number
}

export interface AudienceComparisonTrendPoint {
  date: string
  previous_date: string
  active_subscribers: number
  previous_active_subscribers: number
}

export interface AudienceBreakdown {
  muted_subscribers: number
  reachable_subscribers: number
  broadcast_subscribed?: number
  broadcast_unsubscribed?: number
  transactional_subscribed?: number
  transactional_unsubscribed?: number
}

export interface AudienceSnapshot {
  total_audience: number
  new_subscribers: number
  unsubscribed_users: number
  unsubscribe_rate: number
  muted_subscribers: number
  reachable_subscribers: number
  broadcast_subscribed?: number
  broadcast_unsubscribed?: number
  transactional_subscribed?: number
  transactional_unsubscribed?: number
  broadcast_reach: number
  transactional_reach?: number
}

export interface AudienceComparison {
  period: AudiencePeriod
  current: AudienceSnapshot
  previous: AudienceSnapshot
}

export interface AudienceOverview {
  merchant_profile_id: string
  profile_type: 'creator' | 'platform'
  period: AudiencePeriod
  total_audience: number
  active_subscribers: number
  new_subscribers: number
  unsubscribe_rate: number
  muted_subscribers: number
  reachable_subscribers: number
  broadcast_reach: number
  transactional_reach?: number
  breakdown: AudienceBreakdown
  comparison: AudienceComparison
  trend: AudienceTrendPoint[]
  comparison_trend: AudienceComparisonTrendPoint[]
  generated_at: string
}

export interface AudienceOverviewResponse {
  message: string
  data: AudienceOverview
  errors?: unknown[]
}
