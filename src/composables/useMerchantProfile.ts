import { ref } from 'vue'
import { latestProfile } from '../lib/profileDetails'
import { convertProfileImage, uploadProfileImage } from '../lib/profileImages'
import type { MerchantProfile, MerchantProfileForm, MerchantProfileImagePresignResponse, MerchantProfileResponse, MerchantProfileUpdate } from '../types/merchantProfile'
import { useAuth } from './useAuth'

export function useMerchantProfile() {
  const { state, authenticatedRequest, setMerchantProfile } = useAuth()
  const profile = ref<MerchantProfile | null>(state.merchantProfile)
  const isLoading = ref(false)
  const isBusy = ref(false)
  const isUpdatingDetails = ref(false)
  const uploadProgress = ref(0)
  const errorMessage = ref<string | null>(null)

  function syncProfile(nextProfile: MerchantProfile | null): void {
    setMerchantProfile(nextProfile)
    profile.value = latestProfile(latestProfile(profile.value, nextProfile), state.merchantProfile || nextProfile)
  }

  async function loadProfile(): Promise<MerchantProfile | null> {
    if (!state.accessToken) return null
    isLoading.value = true
    errorMessage.value = null
    try {
      const response = await authenticatedRequest<MerchantProfileResponse>('/v1/app-nudger/profile')
      syncProfile(response.data)
      return profile.value
    } catch (error) {
      const apiError = error as { code?: string }
      if (apiError.code === 'MERCHANT_PROFILE_NOT_FOUND') {
        syncProfile(null)
        return null
      }
      errorMessage.value = error instanceof Error ? error.message : 'Unable to load your profile.'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function saveProfile(form: MerchantProfileForm, imageFile?: File | null): Promise<MerchantProfile | null> {
    if (!state.accessToken) return null
    isBusy.value = true
    uploadProgress.value = 0
    errorMessage.value = null
    let previewUrl: string | undefined
    try {
      let profileImageKey: string | undefined
      if (imageFile) {
        const converted = await convertProfileImage(imageFile)
        previewUrl = converted.previewUrl
        const presign = await authenticatedRequest<MerchantProfileImagePresignResponse>('/v1/app-nudger/profile/image/presign', {
          method: 'POST',
          body: JSON.stringify({ content_type: 'image/webp', size_bytes: converted.blob.size }),
        })
        await uploadProfileImage(presign.data.upload_url, converted.blob, (progress) => { uploadProgress.value = progress })
        profileImageKey = presign.data.object_key
      }
      const response = await authenticatedRequest<MerchantProfileResponse>('/v1/app-nudger/profile', {
        method: 'POST',
        body: JSON.stringify({ ...form, ...(profileImageKey ? { profile_image_key: profileImageKey } : {}) }),
      })
      syncProfile(response.data)
      return response.data
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Unable to save your profile.'
      return null
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      isBusy.value = false
    }
  }

  async function updateProfileImage(imageFile: File): Promise<MerchantProfile | null> {
    if (!state.accessToken || !profile.value) return null
    isBusy.value = true
    uploadProgress.value = 0
    errorMessage.value = null
    let previewUrl: string | undefined
    try {
      const converted = await convertProfileImage(imageFile)
      previewUrl = converted.previewUrl
      const presign = await authenticatedRequest<MerchantProfileImagePresignResponse>('/v1/app-nudger/profile/image/presign', {
        method: 'POST',
        body: JSON.stringify({ content_type: 'image/webp', size_bytes: converted.blob.size }),
      })
      await uploadProfileImage(presign.data.upload_url, converted.blob, (progress) => { uploadProgress.value = progress })
      const response = await authenticatedRequest<MerchantProfileResponse>('/v1/app-nudger/profile/image', {
        method: 'PATCH',
        body: JSON.stringify({ profile_image_key: presign.data.object_key }),
      })
      syncProfile(response.data)
      return response.data
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Unable to update the profile image.'
      return null
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      isBusy.value = false
    }
  }

  /** Details save independently of image uploads; the editor owns validation, feedback and draft. */
  async function updateProfileDetails(changes: MerchantProfileUpdate): Promise<MerchantProfile | null> {
    if (!state.accessToken || !profile.value || isBusy.value) return null
    isBusy.value = true
    isUpdatingDetails.value = true
    errorMessage.value = null
    try {
      const response = await authenticatedRequest<MerchantProfileResponse>('/v1/app-nudger/profile', {
        method: 'PATCH', body: JSON.stringify(changes),
      })
      syncProfile(response.data)
      return profile.value
    } finally { isBusy.value = false; isUpdatingDetails.value = false }
  }

  return { profile, isLoading, isBusy, isUpdatingDetails, uploadProgress, errorMessage, loadProfile, saveProfile, updateProfileImage, updateProfileDetails }
}
