import type { AuthenticatedRequest } from './api'
import type { BroadcastNudgeQueuedResponse } from '../types/broadcastNudge'

export const BROADCAST_MESSAGE_LIMIT = 4096
export const BROADCAST_TITLE_LIMIT = 120

export async function queueBroadcastNudge(request: AuthenticatedRequest, message: string): Promise<BroadcastNudgeQueuedResponse> {
  return request<BroadcastNudgeQueuedResponse>('/v1/app-nudger/nudge/broadcast', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
