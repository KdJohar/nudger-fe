import catalog from './integrations.json'

export type IntegrationStatus = 'available' | 'recipe' | 'preview'
export interface Integration {
  slug: string; name: string; mark: string; category: string; status: IntegrationStatus; featured: boolean
  summary: string; description: string; requirements: string[]
  steps: { title: string; body: string }[]; codeLanguage: string; code: string; examples: string[]; note: string
}
export function validateIntegrations(input: unknown): Integration[] {
  if (!Array.isArray(input)) throw new Error('The integration catalog must be an array.')
  const seen = new Set<string>()
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') throw new Error('Each integration must be an object.')
    for (const key of ['slug', 'name', 'mark', 'category', 'summary', 'description', 'codeLanguage', 'code', 'note']) {
      if (typeof entry[key] !== 'string' || !entry[key].trim()) throw new Error(`Integration requires ${key}.`)
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) || seen.has(entry.slug)) throw new Error(`Invalid or duplicate integration slug: ${entry.slug}`)
    seen.add(entry.slug)
    if (!['available', 'recipe', 'preview'].includes(entry.status)) throw new Error(`Invalid status: ${entry.slug}`)
    if (typeof entry.featured !== 'boolean') throw new Error(`featured must be boolean: ${entry.slug}`)
    for (const key of ['requirements', 'examples']) {
      if (!Array.isArray(entry[key]) || !entry[key].length || entry[key].some((text: unknown) => typeof text !== 'string' || !text.trim())) throw new Error(`Invalid ${key}: ${entry.slug}`)
    }
    if (!Array.isArray(entry.steps) || !entry.steps.length || entry.steps.some((step: { title?: string; body?: string }) => !step || typeof step.title !== 'string' || !step.title.trim() || typeof step.body !== 'string' || !step.body.trim())) throw new Error(`Invalid steps: ${entry.slug}`)
  }
  return input as Integration[]
}
export const INTEGRATIONS = validateIntegrations(catalog)
export const INTEGRATION_LABELS = { available: 'Available', recipe: 'Webhook guide', preview: 'Preview' } as const
export const IOS_URL = 'https://apple.co/4yDfgX4'
