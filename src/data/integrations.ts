import catalog from './integrations.json'

export type IntegrationStatus = 'available' | 'recipe' | 'preview'
export interface IntegrationStep { title: string; body: string }
export interface ProductIntegration {
  compatibility: string; alertNote: string; deliveryNote: string; recipientNote: string; moduleNote: string
  headline: string; appLabel: string; appUrl: string; notificationExample: string; privacy: string
  versions: { label: string; url: string }[]
  benefits: IntegrationStep[]; installSteps: IntegrationStep[]
  deliveryModes: IntegrationStep[]; recipientGroups: IntegrationStep[]
  alertGroups: { title: string; items: string[] }[]
  faqs: { question: string; answer: string }[]
}
export interface Integration {
  logo?: { src: string; alt: string; width: number; height: number }
  seo?: { title: string; description: string }
  product?: ProductIntegration
  slug: string; name: string; mark: string; category: string; status: IntegrationStatus; featured: boolean; published: boolean
  summary: string; description: string; requirements: string[]
  steps: IntegrationStep[]; codeLanguage?: string; code?: string; examples: string[]; note: string
}
const nonempty = (value: unknown): value is string => typeof value === 'string' && Boolean(value.trim())
function httpsUrl(value: unknown): boolean {
  try { return nonempty(value) && new URL(value).protocol === 'https:' } catch { return false }
}
export function validateIntegrations(input: unknown): Integration[] {
  if (!Array.isArray(input)) throw new Error('The integration catalog must be an array.')
  const seen = new Set<string>()
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') throw new Error('Each integration must be an object.')
    for (const key of ['slug', 'name', 'mark', 'category', 'summary', 'description', 'note']) {
      if (typeof entry[key] !== 'string' || !entry[key].trim()) throw new Error(`Integration requires ${key}.`)
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) || seen.has(entry.slug)) throw new Error(`Invalid or duplicate integration slug: ${entry.slug}`)
    seen.add(entry.slug)
    if (!['available', 'recipe', 'preview'].includes(entry.status)) throw new Error(`Invalid status: ${entry.slug}`)
    if (typeof entry.published !== 'boolean') throw new Error(`published must be boolean: ${entry.slug}`)
    if (typeof entry.featured !== 'boolean') throw new Error(`featured must be boolean: ${entry.slug}`)
    for (const key of ['requirements', 'examples']) {
      if (!Array.isArray(entry[key]) || !entry[key].length || entry[key].some((text: unknown) => typeof text !== 'string' || !text.trim())) throw new Error(`Invalid ${key}: ${entry.slug}`)
    }
    if (!entry.product || entry.code !== undefined || entry.codeLanguage !== undefined) {
      if (!nonempty(entry.code) || !nonempty(entry.codeLanguage)) throw new Error(`Code examples need a language and content: ${entry.slug}`)
    }
    if (entry.seo && (!nonempty(entry.seo.title) || !nonempty(entry.seo.description))) throw new Error(`Invalid SEO: ${entry.slug}`)
    if (entry.logo && (!/^\/integrations\/assets\/[a-z0-9-]+\.(png|webp|svg)$/.test(entry.logo.src) || !nonempty(entry.logo.alt) || !Number.isInteger(entry.logo.width) || entry.logo.width <= 0 || !Number.isInteger(entry.logo.height) || entry.logo.height <= 0)) throw new Error(`Invalid logo: ${entry.slug}`)
    if (entry.product) {
      const product = entry.product
      for (const key of ['headline', 'appLabel', 'notificationExample', 'privacy', 'compatibility', 'alertNote', 'deliveryNote', 'recipientNote', 'moduleNote']) if (!nonempty(product[key])) throw new Error(`Invalid product ${key}: ${entry.slug}`)
      if (!httpsUrl(product.appUrl)) throw new Error(`Invalid product app URL: ${entry.slug}`)
      for (const key of ['benefits', 'installSteps', 'deliveryModes', 'recipientGroups']) {
        if (!Array.isArray(product[key]) || !product[key].length || product[key].some((step: IntegrationStep) => !step || !nonempty(step.title) || !nonempty(step.body))) throw new Error(`Invalid product ${key}: ${entry.slug}`)
      }
      if (!Array.isArray(product.versions) || !product.versions.length || product.versions.some((v: { label: string; url: string }) => !v || !nonempty(v.label) || !httpsUrl(v.url))) throw new Error(`Invalid product versions: ${entry.slug}`)
      if (!Array.isArray(product.alertGroups) || !product.alertGroups.length || product.alertGroups.some((g: { title: string; items: string[] }) => !g || !nonempty(g.title) || !Array.isArray(g.items) || !g.items.length || g.items.some(item => !nonempty(item)))) throw new Error(`Invalid product alerts: ${entry.slug}`)
      if (!Array.isArray(product.faqs) || !product.faqs.length || product.faqs.some((faq: { question: string; answer: string }) => !faq || !nonempty(faq.question) || !nonempty(faq.answer))) throw new Error(`Invalid product FAQs: ${entry.slug}`)
    }
    if (!Array.isArray(entry.steps) || !entry.steps.length || entry.steps.some((step: { title?: string; body?: string }) => !step || typeof step.title !== 'string' || !step.title.trim() || typeof step.body !== 'string' || !step.body.trim())) throw new Error(`Invalid steps: ${entry.slug}`)
  }
  return input as Integration[]
}
export const INTEGRATIONS = validateIntegrations(catalog)
export const INTEGRATION_LABELS = { available: 'Available', recipe: 'Webhook guide', preview: 'Preview' } as const
export const IOS_URL = 'https://apple.co/4yDfgX4'
