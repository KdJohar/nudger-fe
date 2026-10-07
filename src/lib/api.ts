import { resolveApiUrl } from './apiUrl'

export type AuthenticatedRequest = <T>(path: string, init?: RequestInit) => Promise<T>
export const API_REQUEST_TIMEOUT_MS = 30_000

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public retryable?: boolean,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function errorFromPayload(payload: unknown, status: number): ApiError {
  const envelope = isRecord(payload) ? payload : {}
  const firstError = Array.isArray(envelope.errors) ? envelope.errors[0] : envelope.errors
  const details = isRecord(firstError) ? firstError : {}
  const validationErrors = Array.isArray(envelope.detail) ? Object.fromEntries(envelope.detail.flatMap(error => {
    if (!isRecord(error)) return []
    const field = Array.isArray(error.loc) ? error.loc[1] : undefined
    return typeof field === 'string' && typeof error.msg === 'string' ? [[field, error.msg]] : []
  })) : {}
  const fieldErrors = isRecord(details.field_errors)
    ? Object.fromEntries(Object.entries(details.field_errors).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : validationErrors
  return new ApiError(
    typeof envelope.message === 'string' && envelope.message ? envelope.message
      : typeof details.message === 'string' && details.message ? details.message
        : Object.keys(fieldErrors).length ? 'Check the highlighted fields.' : `Request failed with status ${status}`,
    status,
    typeof details.code === 'string' ? details.code : undefined,
    typeof details.retryable === 'boolean' ? details.retryable : undefined,
    fieldErrors,
  )
}

function unexpectedResponse(status: number, isMutation: boolean): ApiError {
  return new ApiError(isMutation
    ? 'The API returned an unexpected response. The change may have been accepted; check its status before retrying.'
    : 'The API returned an unexpected response. Please try again.', status, 'API_INVALID_RESPONSE')
}

export async function requestApiResponse(path: string, init: RequestInit = {}, accessToken?: string): Promise<{ status: number; body: unknown }> {
  const url = resolveApiUrl(path)
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes((init.method || 'GET').toUpperCase())
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (typeof init.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const controller = new AbortController()
  const handleAbort = () => controller.abort(init.signal?.reason)
  if (init.signal?.aborted) handleAbort()
  else init.signal?.addEventListener('abort', handleAbort, { once: true })
  let didTimeout = false
  const timer = setTimeout(() => { didTimeout = true; controller.abort() }, API_REQUEST_TIMEOUT_MS)
  try {
    // Never automatically retry mutations, cache private responses, or follow API redirects to HTML.
    const response = await fetch(url, { ...init, headers, credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal })
    if (response.status === 204 || response.status === 205) return { status: response.status, body: null }
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || ''
    let body: unknown
    try {
      if (contentType !== 'application/json' && !contentType.endsWith('+json')) throw unexpectedResponse(response.status, isMutation)
      body = await response.json()
      if (!isRecord(body) && !Array.isArray(body)) throw unexpectedResponse(response.status, isMutation)
    } catch (error) {
      if (controller.signal.aborted) throw error
      if (response.ok) throw unexpectedResponse(response.status, isMutation)
      // Keep 401/403/5xx status even when a proxy returns HTML or malformed JSON.
      body = { message: `Request failed with status ${response.status}` }
    }
    return { status: response.status, body }
  } catch (error) {
    if (init.signal?.aborted) throw init.signal.reason ?? error
    const uncertainty = isMutation ? ' The change may have been accepted; check its status before retrying.' : ' Check your connection and try again.'
    if (didTimeout) throw new ApiError(`The request timed out.${uncertainty}`, 0, 'API_TIMEOUT', !isMutation)
    if (error instanceof TypeError) throw new ApiError(`Unable to reach the API.${uncertainty}`, 0, 'API_UNREACHABLE', !isMutation)
    throw error
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener('abort', handleAbort)
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const { status, body } = await requestApiResponse(path, init, accessToken)
  if (status < 200 || status >= 300) throw errorFromPayload(body, status)
  return (status === 204 || status === 205 ? undefined : body) as T
}
