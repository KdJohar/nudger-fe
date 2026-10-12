import type { NotificationContent } from './notification'

export type NudgeType = 'transactional' | 'broadcast'
export type NudgeSender = 'creator' | 'platform' | 'merchant'
export type NudgeStatus = 'created' | 'processing' | 'completed' | 'failed'

export interface NudgeDeliveryStats {
  total_audience: number
  total_devices: number
  delivered_users: number
  muted_users: number
  failed_deliveries: number
  /** A saved nightly unique-recipient click total, not a live counter. */
  total_clicks?: number | null
  /** A saved nightly percentage from 0 through 100, not a fractional ratio. */
  ctr?: number | null
}

export interface NudgeHistoryItem extends NotificationContent {
  id: string
  title: string
  message: string
  sender: NudgeSender
  nudge_type: NudgeType
  merchant_platform_user_id?: string | null
  status: NudgeStatus
  created_at: string
  completed_at?: string | null
  /** UTC cutoff covered by the saved engagement snapshot; never live analytics. */
  engagement_as_of?: string | null
  stats: NudgeDeliveryStats
}

export interface NudgeHistoryPage {
  items: NudgeHistoryItem[]
  page_size: number
  next: string | null
}

export interface NudgeHistoryResponse {
  message: string
  data: NudgeHistoryPage
  errors?: unknown[]
}
