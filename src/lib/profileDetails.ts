import { PROFILE_LINK_FIELDS } from '../data/merchantProfile'
import type { MerchantProfile, MerchantProfileUpdate } from '../types/merchantProfile'

export const ABOUT_MAX_LENGTH = 500
export const PROFILE_EDITABLE_FIELDS = ['about', ...PROFILE_LINK_FIELDS.map(field => field.key)] as const
export type ProfileEditableField = typeof PROFILE_EDITABLE_FIELDS[number]
export type ProfileDetailsDraft = Record<ProfileEditableField, string>

/** Keep drafts separate from the saved identity so cancelling never mutates shared state. */
export function profileDetailsDraft(profile: MerchantProfile): ProfileDetailsDraft {
  return Object.fromEntries(PROFILE_EDITABLE_FIELDS.map(field => [field, profile[field] || ''])) as ProfileDetailsDraft
}

/** Send only edited fields; clearing an input is an explicit null, not an omitted value. */
export function profileDetailsPatch(draft: ProfileDetailsDraft, saved: ProfileDetailsDraft): MerchantProfileUpdate {
  return Object.fromEntries(PROFILE_EDITABLE_FIELDS.flatMap(field => {
    const next = draft[field].trim() || null
    return next === (saved[field].trim() || null) ? [] : [[field, next]]
  }))
}

/** Match the API's Unicode character limit and allow only navigable HTTP(S) links. */
export function validateProfileDetails(draft: ProfileDetailsDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (Array.from(draft.about.trim()).length > ABOUT_MAX_LENGTH) errors.about = `Keep About to ${ABOUT_MAX_LENGTH} characters or fewer.`
  for (const { key } of PROFILE_LINK_FIELDS) {
    if (!draft[key].trim()) continue
    try {
      const url = new URL(draft[key].trim())
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname) throw new Error('Invalid URL')
    } catch { errors[key] = 'Enter a complete link starting with https:// or http://.' }
  }
  return errors
}

/** Preserve microseconds: session and PATCH responses can finish in the opposite order. */
function profileRevision(value: string): bigint | null {
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds)) return null
  const fraction = value.match(/\.(\d+)/)?.[1] || ''
  return BigInt(Math.floor(milliseconds / 1000)) * 1_000_000n + BigInt(fraction.padEnd(6, '0').slice(0, 6))
}

export function latestProfile(current: MerchantProfile | null, incoming: MerchantProfile | null): MerchantProfile | null {
  if (current && incoming && current.id === incoming.id) {
    const currentVersion = profileRevision(current.updated_at), incomingVersion = profileRevision(incoming.updated_at)
    if (currentVersion !== null && incomingVersion !== null && currentVersion > incomingVersion) return current
  }
  return incoming
}
