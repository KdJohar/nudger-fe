import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'
import { BROADCAST_MESSAGE_LIMIT, BROADCAST_TITLE_LIMIT, queueBroadcastNudge } from '../lib/broadcastNudge'
import type { AuthenticatedRequest } from '../lib/api'
import type { MerchantProfile } from '../types/merchantProfile'

// Both entry points share validation, the reviewed snapshot and one-shot sending.
export function useBroadcastComposer(profile: Readonly<Ref<MerchantProfile | null>>, request: AuthenticatedRequest) {
  const message = ref('')
  const fieldError = ref('')
  const sendError = ref('')
  const confirmedMessage = ref('')
  const isReviewing = ref(false)
  const isSending = ref(false)
  const isQueued = ref(false)
  const title = computed(() => profile.value?.display_name?.trim() || '')
  const isProfileReady = computed(() => Boolean(profile.value?.is_active && title.value && title.value.length <= BROADCAST_TITLE_LIMIT))
  const characterCount = computed(() => message.value.length)
  let isDisposed = false

  watch(message, () => { fieldError.value = '' })
  onScopeDispose(() => { isDisposed = true })

  function handleReview(): boolean {
    if (!isProfileReady.value || isSending.value || isQueued.value || isDisposed) return false
    fieldError.value = ''
    sendError.value = ''
    if (!message.value.trim()) fieldError.value = 'Write a message before sending your nudge.'
    else if (characterCount.value > BROADCAST_MESSAGE_LIMIT) fieldError.value = 'Keep your message within 4,096 characters.'
    if (fieldError.value) return false
    confirmedMessage.value = message.value.trim()
    isReviewing.value = true
    return true
  }

  function handleEdit(): void {
    if (isSending.value) return
    isReviewing.value = false
    sendError.value = ''
  }

  async function handleSend(): Promise<boolean> {
    if (isSending.value || !isReviewing.value || !isProfileReady.value || isQueued.value || isDisposed) return false
    isSending.value = true
    sendError.value = ''
    try {
      await queueBroadcastNudge(request, confirmedMessage.value)
      if (isDisposed) return false
      isQueued.value = true
      isReviewing.value = false
      return true
    } catch (error) {
      if (!isDisposed) sendError.value = error instanceof Error
        ? error.message
        : 'Unable to confirm whether this nudge was queued. Check your history before trying again.'
      return false
    } finally {
      if (!isDisposed) isSending.value = false
    }
  }

  function handleReset(): void {
    if (isSending.value) return
    message.value = ''
    confirmedMessage.value = ''
    fieldError.value = ''
    sendError.value = ''
    isQueued.value = false
    isReviewing.value = false
  }

  return { message, fieldError, sendError, confirmedMessage, isReviewing, isSending, isQueued, title, isProfileReady, characterCount, handleReview, handleEdit, handleSend, handleReset }
}
