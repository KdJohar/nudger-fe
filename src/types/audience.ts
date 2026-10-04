export type AudiencePeriod = '7d' | '30d' | '90d'

export interface AudienceTrendPoint {
  date: string
  active_subscribers: number
  new_subscribers: number
  unsubscribed_users: number
}

export interface AudienceOverview {
  merchant_profile_id: string
  profile_type: 'creator' | 'platform'
  period: AudiencePeriod
  active_subscribers: number
  new_subscribers: number
  unsubscribe_rate: number
  muted_subscribers: number
  reachable_subscribers: number
  broadcast_reach: number
  transactional_reach: number | null
  trend: AudienceTrendPoint[]
  generated_at: string
}

export interface AudienceOverviewResponse {
  message: string
  data: AudienceOverview
  errors: Record<string, unknown>
}
