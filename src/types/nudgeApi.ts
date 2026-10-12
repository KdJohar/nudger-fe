import type { NotificationRequest } from './notification'

export type ApiNudgeType = 'broadcast' | 'transactional'
export type NudgeExampleLanguage = 'curl' | 'javascript' | 'python' | 'go' | 'java'

export type ApiNudgeRequest =
  NotificationRequest & ({ nudge_type: 'broadcast' } | { nudge_type: 'transactional'; nudge_user_id: number })

export interface ApiNudgeResult {
  status: number
  body: unknown
}

export interface ApiNudgeDraft {
  message: string
  nudgeType: ApiNudgeType
  recipientId: string
}
