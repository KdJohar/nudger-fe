import { authenticatedRequest } from '../composables/useAuth'
import { API_BASE_URL } from './api'
import type { NudgeHistoryResponse, NudgeType } from '../types/nudges'

const NUDGE_HISTORY_PATH = '/v1/app-nudger/nudges'

function getApiPath(nextLink: string): string {
  const url = new URL(nextLink, API_BASE_URL)
  return `${url.pathname}${url.search}`
}

export async function getNudgeHistory(options: {
  nextLink?: string | null
  pageSize?: number
  nudgeType?: NudgeType
} = {}): Promise<NudgeHistoryResponse> {
  if (options.nextLink) {
    return authenticatedRequest<NudgeHistoryResponse>(getApiPath(options.nextLink))
  }

  const searchParams = new URLSearchParams({
    page_size: String(options.pageSize ?? 20),
  })
  if (options.nudgeType) {
    searchParams.set('nudge_type', options.nudgeType)
  }

  return authenticatedRequest<NudgeHistoryResponse>(`${NUDGE_HISTORY_PATH}?${searchParams.toString()}`)
}
