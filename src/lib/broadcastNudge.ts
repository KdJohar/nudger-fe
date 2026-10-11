import type { AuthenticatedRequest } from './api'
import type { BroadcastNudgeQueuedResponse } from '../types/broadcastNudge'
import type { NotificationRequest } from '../types/notification'

export const BROADCAST_MESSAGE_LIMIT = 4096
export const BROADCAST_TITLE_LIMIT = 120

export async function queueBroadcastNudge(request: AuthenticatedRequest, payload: NotificationRequest): Promise<BroadcastNudgeQueuedResponse> {
  const response = await request<BroadcastNudgeQueuedResponse>('/v1/app-nudger/nudge/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (response?.data?.status !== 'queued') throw new Error('The response did not confirm queue acceptance. Check history before sending again.')
  return response
}
