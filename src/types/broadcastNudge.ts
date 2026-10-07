export interface BroadcastNudgeQueuedResponse {
  message: string
  data: {
    merchant_profile_id: string
    status: 'queued'
    message_id: string
  }
}
