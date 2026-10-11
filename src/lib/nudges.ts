import { ApiError, type AuthenticatedRequest } from './api'
import { parseNextLink } from './apiUrl'
import type { NudgeHistoryPage, NudgeHistoryResponse, NudgeType } from '../types/nudges'
import { ctaText, safeNotificationUrl } from './notificationContent'

export interface NudgeHistoryOptions {
  nextLink?: string | null
  pageSize?: number
  nudgeType?: NudgeType | null
}

export async function getNudgeHistory(request: AuthenticatedRequest, options: NudgeHistoryOptions = {}): Promise<NudgeHistoryPage> {
  const historyPath = '/v1/app-nudger/nudges'
  const path = options.nextLink
    ? parseNextLink(options.nextLink, historyPath)
    : `${historyPath}?page_size=${options.pageSize ?? 20}${options.nudgeType ? `&nudge_type=${options.nudgeType}` : ''}`
  const response = await request<NudgeHistoryResponse>(path)
  if (!response?.data || !Array.isArray(response.data.items) ||
      (response.data.next !== null && typeof response.data.next !== 'string')) {
    throw new ApiError('The API returned invalid nudge history. Please try again.', 200, 'API_INVALID_RESPONSE')
  }
  for (const item of response.data.items) {
    if (item.notification_format !== undefined && !['basic', 'rich'].includes(item.notification_format)) throw new ApiError('The API returned an invalid notification format.', 200, 'API_INVALID_RESPONSE')
    if (item.notification_format === 'rich' && (!ctaText(item.cta_label) || !safeNotificationUrl(item.destination_url) || (item.media_url != null && !safeNotificationUrl(item.media_url)))) throw new ApiError('The API returned invalid Rich notification content.', 200, 'API_INVALID_RESPONSE')
  }
  return response.data
}
