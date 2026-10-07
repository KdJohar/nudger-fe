export type ApiNudgeType = 'broadcast' | 'transactional'
export type NudgeExampleLanguage = 'curl' | 'javascript' | 'python' | 'go' | 'java'

export type ApiNudgeRequest =
  | { message: string; nudge_type: 'broadcast' }
  | { message: string; nudge_type: 'transactional'; nudge_user_id: number }

export interface ApiNudgeResult {
  status: number
  body: unknown
}

export interface ApiNudgeDraft {
  message: string
  nudgeType: ApiNudgeType
  recipientId: string
}
