import type { AuthenticatedRequest } from './api'
import type { AudienceOverview, AudienceOverviewResponse, AudiencePeriod } from '../types/audience'

export async function getAudienceOverview(period: AudiencePeriod, request: AuthenticatedRequest): Promise<AudienceOverview> {
  const response = await request<AudienceOverviewResponse>(`/v1/app-nudger/audience/overview?period=${period}`)
  return response.data
}
