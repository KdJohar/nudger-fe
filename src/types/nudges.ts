export type NudgeType = 'transactional' | 'broadcast'

export type NudgeSender = 'creator' | 'platform' | 'merchant'

export type NudgeStatus = 'created' | 'processing' | 'completed'

export interface NudgeDeliveryStats {
  total_audience: number
  total_devices: number
  delivered_users: number
  muted_users: number
  failed_deliveries: number
}

export interface NudgeHistoryItem {
  id: string
  title: string
  message: string
  sender: NudgeSender
  nudge_type: NudgeType
  merchant_platform_user_id: string | null
  status: NudgeStatus
  created_at: string
  completed_at: string | null
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
  errors: Record<string, unknown>
}
