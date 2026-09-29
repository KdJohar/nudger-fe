import { reactive, readonly } from 'vue'

import { ApiError, API_BASE_URL, requestJson } from '../lib/api'
import type {
  ApiErrorPayload,
  AuthResponse,
  AuthTokens,
  GoogleStartResponse,
  IdentityUser,
} from '../types/auth'

const REFRESH_TOKEN_KEY = 'nudger.refresh_token'
const AUTH_CALLBACK_PATH = '/auth/callback'

interface AuthState {
  user: IdentityUser | null
  accessToken: string | null
  isInitialized: boolean
  isBusy: boolean
  errorMessage: string | null
}

const state = reactive<AuthState>({
  user: null,
  accessToken: null,
  isInitialized: false,
  isBusy: false,
  errorMessage: null,
})

let initializePromise: Promise<void> | null = null
let refreshPromise: Promise<boolean> | null = null

function getStoredRefreshToken(): string | null {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

function saveSession(tokens: AuthTokens, user: IdentityUser): void {
  state.accessToken = tokens.access_token
  state.user = user
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

function clearSession(): void {
  state.accessToken = null
  state.user = null
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise
  }

  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    clearSession()
    return false
  }

  refreshPromise = (async () => {
    try {
      const response = await requestJson<AuthResponse>('/v1/app-identity/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      saveSession(response.data.auth, response.data.user)
      return true
    } catch {
      clearSession()
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function initializeAuth(): Promise<void> {
  if (state.isInitialized) {
    return
  }
  if (initializePromise) {
    return initializePromise
  }

  initializePromise = (async () => {
    await refreshAccessToken()
    state.isInitialized = true
  })()

  try {
    await initializePromise
  } finally {
    initializePromise = null
  }
}

export async function startGoogleLogin(): Promise<void> {
  state.isBusy = true
  state.errorMessage = null
  const returnTo = `${window.location.origin}${AUTH_CALLBACK_PATH}`

  try {
    const response = await requestJson<GoogleStartResponse>(
      `/v1/app-identity/google/start?return_to=${encodeURIComponent(returnTo)}`,
    )
    window.location.assign(response.authorization_url)
  } catch (error) {
    state.isBusy = false
    state.errorMessage = error instanceof Error ? error.message : 'Google sign-in could not be started.'
  }
}

export async function completeGoogleLogin(handoffCode: string): Promise<void> {
  state.isBusy = true
  state.errorMessage = null

  try {
    const response = await requestJson<AuthResponse>('/v1/app-identity/google/exchange', {
      method: 'POST',
      body: JSON.stringify({ handoff_code: handoffCode }),
    })
    saveSession(response.data.auth, response.data.user)
  } catch (error) {
    state.errorMessage = error instanceof Error ? error.message : 'Sign-in could not be completed.'
    throw error
  } finally {
    state.isBusy = false
    state.isInitialized = true
  }
}

export async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = async (): Promise<Response> => {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    headers.set('Content-Type', 'application/json')
    if (state.accessToken) {
      headers.set('Authorization', `Bearer ${state.accessToken}`)
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    })
  }

  let response = await send()
  if (response.status === 401 && (await refreshAccessToken())) {
    response = await send()
  }

  const body = await response.text()
  let payload: unknown = {}

  if (body) {
    try {
      payload = JSON.parse(body)
    } catch {
      payload = {}
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiErrorPayload)
  }

  return payload as T
}

export async function logout(): Promise<void> {
  state.isBusy = true

  try {
    if (state.accessToken) {
      await authenticatedRequest('/v1/app-identity/logout', { method: 'POST' })
    }
  } finally {
    clearSession()
    state.isBusy = false
    state.errorMessage = null
  }
}

export function useAuth() {
  return {
    state: readonly(state),
    initializeAuth,
    startGoogleLogin,
    completeGoogleLogin,
    logout,
  }
}
