import { reactive, readonly } from 'vue'

import { authenticatedRequest, setMerchantProfile } from './useAuth'
import { ApiError } from '../lib/api'
import { convertProfileImage, uploadProfileImage } from '../lib/profileImages'
import type {
  MerchantProfile,
  MerchantProfileForm,
  MerchantProfileImagePresignResponse,
  MerchantProfileResponse,
} from '../types/merchantProfile'

interface MerchantProfileState {
  profile: MerchantProfile | null
  isLoading: boolean
  isBusy: boolean
  uploadProgress: number
  errorMessage: string | null
}

const state = reactive<MerchantProfileState>({
  profile: null,
  isLoading: false,
  isBusy: false,
  uploadProgress: 0,
  errorMessage: null,
})

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function nullable(value: string): string | null {
  const normalized = value.trim()
  return normalized || null
}

async function prepareAndUpload(file: File): Promise<string> {
  const webp = await convertProfileImage(file)
  const presign = await authenticatedRequest<MerchantProfileImagePresignResponse>('/v1/app-nudger/profile/image/presign', {
    method: 'POST',
    body: JSON.stringify({
      content_type: 'image/webp',
      size_bytes: webp.size,
    }),
  })

  state.uploadProgress = 0
  await uploadProfileImage(presign.data.upload_url, webp, (progress) => {
    state.uploadProgress = progress
  })
  return presign.data.object_key
}

async function loadProfile(): Promise<void> {
  state.isLoading = true
  state.errorMessage = null

  try {
    const response = await authenticatedRequest<MerchantProfileResponse>('/v1/app-nudger/profile')
    state.profile = response.data
    setMerchantProfile(response.data)
  } catch (error) {
    if (error instanceof ApiError && error.code === 'MERCHANT_PROFILE_NOT_FOUND') {
      state.profile = null
      setMerchantProfile(null)
    } else {
      state.errorMessage = getErrorMessage(error, 'Your merchant profile could not be loaded.')
    }
  } finally {
    state.isLoading = false
  }
}

async function createProfile(form: MerchantProfileForm, file: File): Promise<boolean> {
  state.isBusy = true
  state.errorMessage = null
  state.uploadProgress = 0

  try {
    const profileImageKey = await prepareAndUpload(file)
    const response = await authenticatedRequest<MerchantProfileResponse>('/v1/app-nudger/profile', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        display_name: form.display_name.trim(),
        profile_image_key: profileImageKey,
        website_url: nullable(form.website_url),
        instagram_url: nullable(form.instagram_url),
        youtube_url: nullable(form.youtube_url),
        facebook_url: nullable(form.facebook_url),
        linkedin_url: nullable(form.linkedin_url),
        x_url: nullable(form.x_url),
      }),
    })
    state.profile = response.data
    setMerchantProfile(response.data)
    return true
  } catch (error) {
    state.errorMessage = getErrorMessage(error, 'Your merchant profile could not be created.')
    return false
  } finally {
    state.isBusy = false
  }
}

async function changeProfileImage(file: File): Promise<boolean> {
  if (!state.profile) {
    return false
  }

  state.isBusy = true
  state.errorMessage = null
  state.uploadProgress = 0

  try {
    const profileImageKey = await prepareAndUpload(file)
    const response = await authenticatedRequest<MerchantProfileResponse>('/v1/app-nudger/profile/image', {
      method: 'PATCH',
      body: JSON.stringify({ profile_image_key: profileImageKey }),
    })
    state.profile = response.data
    setMerchantProfile(response.data)
    return true
  } catch (error) {
    state.errorMessage = getErrorMessage(error, 'Your profile image could not be changed.')
    return false
  } finally {
    state.isBusy = false
  }
}

export function useMerchantProfile() {
  return {
    state: readonly(state),
    loadProfile,
    createProfile,
    changeProfileImage,
  }
}
