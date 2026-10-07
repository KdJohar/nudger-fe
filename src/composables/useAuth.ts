import { computed, readonly, reactive } from 'vue'
import { getNudgerConfig } from '../config'
import { ApiError, requestJson } from '../lib/api'
import { latestProfile } from '../lib/profileDetails'
import type { AuthResponse, AuthSessionResponse, GoogleStartResponse, IdentityUser } from '../types/auth'
import type { MerchantProfile } from '../types/merchantProfile'

const REFRESH_TOKEN_KEY = 'nudger.refresh_token'

interface AuthState {
  user: IdentityUser | null
  merchantProfile: MerchantProfile | null
  accessToken: string | null
  isInitialized: boolean
  isBusy: boolean
  errorMessage: string | null
}

const state = reactive<AuthState>({
  user: null,
  merchantProfile: null,
  accessToken: null,
  isInitialized: false,
  isBusy: false,
  errorMessage: null,
})

let initializationPromise: Promise<void> | null = null
let profileRevision = 0

function saveSession(response: AuthResponse, startedRevision = profileRevision): void {
  const isSameUser = state.user?.id === response.data.user.id
  state.accessToken = response.data.auth.access_token
  state.user = response.data.user
  const incoming = response.data.merchant_profile
  if (!isSameUser) state.merchantProfile = incoming
  else if (incoming || startedRevision === profileRevision) state.merchantProfile = latestProfile(state.merchantProfile, incoming)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, response.data.auth.refresh_token)
}

function clearSession(): void {
  state.user = null
  state.merchantProfile = null
  state.accessToken = null
  if (typeof window !== 'undefined') window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

function setMerchantProfile(profile: MerchantProfile | null): void {
  state.merchantProfile = latestProfile(state.merchantProfile, profile)
  profileRevision += 1
}

async function refreshSession(): Promise<boolean> {
  const startedRevision = profileRevision
  const refreshToken = typeof window !== 'undefined' ? window.localStorage.getItem(REFRESH_TOKEN_KEY) : null
  if (!refreshToken) return false
  try {
    const response = await requestJson<AuthResponse>('/v1/app-identity/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) })
    saveSession(response, startedRevision)
    return true
  } catch {
    clearSession()
    return false
  }
}

async function initializeAuth(): Promise<void> {
  if (state.isInitialized) return
  if (initializationPromise) return initializationPromise
  initializationPromise = (async () => {
    state.isBusy = true
    await refreshSession()
    state.isInitialized = true
    state.isBusy = false
    initializationPromise = null
  })()
  return initializationPromise
}

async function startGoogleLogin(): Promise<void> {
  state.isBusy = true
  state.errorMessage = null
  try {
    const returnTo = `${window.location.origin}/auth/callback`
    const response = await requestJson<GoogleStartResponse>(`/v1/app-identity/google/start?return_to=${encodeURIComponent(returnTo)}`)
    const authorizationUrl = response.data?.authorization_url || response.authorization_url
    if (!authorizationUrl) throw new Error('The sign-in link was not returned by the server.')
    window.location.assign(authorizationUrl)
  } catch (error) {
    state.errorMessage = error instanceof Error ? error.message : 'Unable to start Google sign-in.'
    state.isBusy = false
    throw error
  }
}

async function completeGoogleLogin(handoffCode: string): Promise<void> {
  state.isBusy = true
  state.errorMessage = null
  try {
    const response = await requestJson<AuthResponse>('/v1/app-identity/google/exchange', { method: 'POST', body: JSON.stringify({ handoff_code: handoffCode }) })
    saveSession(response)
    state.isInitialized = true
  } catch (error) {
    state.errorMessage = error instanceof Error ? error.message : 'Unable to complete sign-in.'
    throw error
  } finally {
    state.isBusy = false
  }
}

async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  await initializeAuth()
  if (!state.accessToken) throw new ApiError('Your session has expired. Please sign in again.', 401)
  try {
    return await requestJson<T>(path, init, state.accessToken)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error
    if (!await refreshSession() || !state.accessToken) throw error
    return requestJson<T>(path, init, state.accessToken)
  }
}

async function logout(): Promise<void> {
  try {
    if (state.accessToken) await requestJson('/v1/app-identity/logout', { method: 'POST' }, state.accessToken)
  } finally {
    clearSession()
    state.isInitialized = true
  }
}

export function useAuth() {
  const displayName = computed(() => state.user?.name || state.user?.email?.split('@')[0] || 'Workspace member')
  const isAuthenticated = computed(() => Boolean(state.user && state.accessToken))
  return {
    state: readonly(state),
    displayName,
    isAuthenticated,
    initializeAuth,
    startGoogleLogin,
    completeGoogleLogin,
    authenticatedRequest,
    logout,
    setMerchantProfile,
    getNudgerConfig,
  }
}
