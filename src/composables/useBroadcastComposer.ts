import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'
import { BROADCAST_MESSAGE_LIMIT, BROADCAST_TITLE_LIMIT, queueBroadcastNudge } from '../lib/broadcastNudge'
import { ApiError, type AuthenticatedRequest } from '../lib/api'
import type { MerchantProfile } from '../types/merchantProfile'
import { useNotificationDraft } from './useNotificationDraft'
import { buildNotificationRequest } from '../lib/notificationContent'
import type { NotificationRequest } from '../types/notification'

// Both entry points share validation, the reviewed snapshot and one-shot sending.
export function useBroadcastComposer(profile: Readonly<Ref<MerchantProfile | null>>, request: AuthenticatedRequest) {
  const notification = useNotificationDraft(request, computed(() => profile.value?.id || null))
  const confirmedPayload = ref<NotificationRequest | null>(null)
  const message = ref('')
  const fieldError = ref('')
  const sendError = ref('')
  const confirmedMessage = ref('')
  const isReviewing = ref(false)
  const isSending = ref(false)
  const isQueued = ref(false)
  const title = computed(() => profile.value?.display_name?.trim() || '')
  const isProfileReady = computed(() => Boolean(profile.value?.is_active && title.value && Array.from(title.value).length <= (notification.capabilities.value?.title_max_characters || BROADCAST_TITLE_LIMIT)))
  const characterCount = computed(() => Array.from(message.value.trim()).length)
  const messageLimit = computed(() => notification.capabilities.value?.message_max_characters || BROADCAST_MESSAGE_LIMIT)
  let isDisposed = false
  let reviewedOwner: string | undefined
  watch(() => profile.value?.id, () => {
    isReviewing.value = false; confirmedPayload.value = null; confirmedMessage.value = ''
    message.value = ''; fieldError.value = ''; sendError.value = ''; isQueued.value = false
  }, { flush: 'sync' })

  watch(message, () => { fieldError.value = '' })
  onScopeDispose(() => { isDisposed = true })

  function handleReview(): boolean {
    if (!isProfileReady.value || isSending.value || isQueued.value || isDisposed) return false
    fieldError.value = ''
    sendError.value = ''
    if (!message.value.trim()) fieldError.value = 'Write a message before sending your nudge.'
    else if (characterCount.value > messageLimit.value) fieldError.value = `Keep your message within ${messageLimit.value.toLocaleString()} characters.`
    const isContentValid = notification.validate()
    if (!notification.capabilities.value?.delivery_types.includes('broadcast')) notification.errors.value.notificationFormat = 'Broadcast is not available for your profile.'
    if (fieldError.value || !isContentValid || Object.keys(notification.errors.value).length) return false
    confirmedMessage.value = message.value.trim()
    confirmedPayload.value = buildNotificationRequest(message.value, notification.draft)
    reviewedOwner = profile.value?.id
    isReviewing.value = true
    return true
  }

  function handleEdit(): void {
    if (isSending.value) return
    isReviewing.value = false
    sendError.value = ''
  }

  async function handleSend(): Promise<boolean> {
    if (isSending.value || !isReviewing.value || !isProfileReady.value || isQueued.value || isDisposed || reviewedOwner !== profile.value?.id) return false
    isSending.value = true
    sendError.value = ''
    const owner = reviewedOwner
    try {
      if (!confirmedPayload.value) return false
      await queueBroadcastNudge(request, confirmedPayload.value)
      if (isDisposed || owner !== profile.value?.id) return false
      isQueued.value = true
      isReviewing.value = false
      return true
    } catch (error) {
      if (!isDisposed && owner === profile.value?.id && error instanceof ApiError) {
        notification.applyFieldErrors(error.fieldErrors)
        if (error.fieldErrors.message) fieldError.value = error.fieldErrors.message
        if (fieldError.value || Object.keys(notification.errors.value).length) isReviewing.value = false
      }
      if (!isDisposed && owner === profile.value?.id) sendError.value = error instanceof Error
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
    confirmedPayload.value = null
    notification.reset()
    confirmedMessage.value = ''
    fieldError.value = ''
    sendError.value = ''
    isQueued.value = false
    isReviewing.value = false
  }

  return { notification, confirmedPayload, messageLimit, message, fieldError, sendError, confirmedMessage, isReviewing, isSending, isQueued, title, isProfileReady, characterCount, handleReview, handleEdit, handleSend, handleReset }
}
