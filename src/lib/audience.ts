import { authenticatedRequest } from '../composables/useAuth'
import type { AudienceOverviewResponse, AudiencePeriod } from '../types/audience'

export async function getAudienceOverview(
  period: AudiencePeriod,
): Promise<AudienceOverviewResponse> {
  return authenticatedRequest<AudienceOverviewResponse>(
    `/v1/app-nudger/audience/overview?period=${encodeURIComponent(period)}`,
  )
}
