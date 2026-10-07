import { onMounted, onScopeDispose, ref } from 'vue'
import { createApiToken, getApiToken, rotateApiToken } from '../lib/apiToken'
import { copyText } from '../lib/clipboard'
import type { AuthenticatedRequest } from '../lib/api'
import type { MerchantApiTokenData } from '../types/apiToken'

export function useApiToken(request: AuthenticatedRequest) {
  const tokenData = ref<MerchantApiTokenData | null>(null)
  const isLoading = ref(true)
  const isBusy = ref(false)
  const isRevealed = ref(false)
  const errorMessage = ref('')
  const statusMessage = ref('')
  let isDisposed = false
  onScopeDispose(() => { isDisposed = true; tokenData.value = null })

  async function handleLoad(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''
    isRevealed.value = false
    try {
      const result = await getApiToken(request)
      if (!isDisposed) tokenData.value = result
    } catch (error) {
      if (!isDisposed) errorMessage.value = error instanceof Error ? error.message : 'Unable to load your token. Try again.'
    } finally {
      if (!isDisposed) isLoading.value = false
    }
  }

  async function handleChange(operation: 'create' | 'rotate'): Promise<boolean> {
    if (isBusy.value || isLoading.value) return false
    isBusy.value = true
    isRevealed.value = false
    errorMessage.value = ''
    statusMessage.value = ''
    try {
      const result = await (operation === 'create' ? createApiToken(request) : rotateApiToken(request))
      if (isDisposed) return false
      tokenData.value = result
      statusMessage.value = operation === 'create'
        ? 'Token created. Reveal or copy it when you need it.'
        : 'Token rotated. Update your integrations with the new token.'
      return true
    } catch (error) {
      if (!isDisposed) errorMessage.value = error instanceof Error ? error.message : 'Unable to update your token. Try again.'
      return false
    } finally {
      if (!isDisposed) isBusy.value = false
    }
  }

  async function handleCopy(): Promise<void> {
    if (!tokenData.value?.token || isLoading.value || isBusy.value) return
    statusMessage.value = ''
    errorMessage.value = ''
    try {
      await copyText(tokenData.value.token)
      if (!isDisposed) statusMessage.value = 'Token copied.'
    } catch {
      if (!isDisposed) errorMessage.value = 'Could not copy. Reveal your token to select and copy it manually.'
    }
  }

  function handleToggleReveal(): void {
    if (tokenData.value?.token && !isLoading.value && !isBusy.value) isRevealed.value = !isRevealed.value
  }

  onMounted(handleLoad)
  return { tokenData, isLoading, isBusy, isRevealed, errorMessage, statusMessage, handleLoad, handleChange, handleCopy, handleToggleReveal }
}
