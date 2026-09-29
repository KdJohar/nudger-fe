import { getNudgerConfig } from '../config'
import type { ApiErrorPayload } from '../types/auth'

export const API_BASE_URL = getNudgerConfig().apiBaseUrl.replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly retryable: boolean

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || 'Something went wrong. Please try again.')
    this.name = 'ApiError'
    this.status = status
    this.code = payload.errors?.code
    this.retryable = Boolean(payload.errors?.retryable)
  }
}

async function readPayload(response: Response): Promise<unknown> {
  const body = await response.text()
  if (!body) {
    return {}
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    return {}
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

  const payload = await readPayload(response)
  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiErrorPayload)
  }

  return payload as T
}
