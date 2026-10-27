import { INTEGRATIONS } from './integrations'

/** Availability labels do not publish a guide. Each entry needs explicit approval. */
export const PUBLISHED_INTEGRATIONS = INTEGRATIONS.filter(item => item.published)
export const PUBLIC_INTEGRATIONS_ENABLED = PUBLISHED_INTEGRATIONS.length > 0
export function isIntegrationPublished(slug: string): boolean {
  return PUBLISHED_INTEGRATIONS.some(item => item.slug === slug)
}
