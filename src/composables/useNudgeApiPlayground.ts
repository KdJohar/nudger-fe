import { computed, onScopeDispose, reactive, ref, watch, type Ref } from 'vue'
import { resolveApiUrl } from '../lib/apiUrl'
import { API_TOKEN_MASK } from '../lib/apiToken'
import { API_MESSAGE_LIMIT, NUDGE_SEND_PATH, buildApiNudgeRequest, buildNudgeExample, sendApiNudge, validateApiNudge } from '../lib/nudgeApi'
import type { ApiNudgeDraft, ApiNudgeRequest, ApiNudgeResult, NudgeExampleLanguage } from '../types/nudgeApi'
import { errorFromPayload, requestJson } from '../lib/api'
import { useNotificationDraft } from './useNotificationDraft'
import { safeNotificationUrl } from '../lib/notificationContent'

export function useNudgeApiPlayground(token: Readonly<Ref<string | null>>, isCredentialBusy: Readonly<Ref<boolean>>, isRevealed: Readonly<Ref<boolean>>) {
  const notification = useNotificationDraft((path, init) => requestJson(path, init, token.value || undefined), token)
  const draft = reactive<ApiNudgeDraft>({ message: '', nudgeType: 'broadcast', recipientId: '' })
  const language = ref<NudgeExampleLanguage>('curl')
  const errors = ref<{ message?: string; recipientId?: string }>({})
  const isSending = ref(false)
  const isConfirmationOpen = ref(false)
  const confirmedPayload = ref<ApiNudgeRequest | null>(null)
  const result = ref<ApiNudgeResult | null>(null)
  const requestError = ref('')
  const statusMessage = ref('')
  let abortController: AbortController | undefined
  let isDisposed = false
  const characterCount = computed(() => Array.from(draft.message.trim()).length)
  const exampleUsesSamples = computed(() => !draft.message.trim() || (draft.nudgeType === 'transactional' && !/^[1-9]\d{5}$/.test(draft.recipientId.trim())) || (notification.draft.notificationFormat === 'rich' && !safeNotificationUrl(notification.draft.destinationUrl.trim())))
  const examplePayload = computed(() => buildApiNudgeRequest({
    ...draft,
    message: draft.message.trim() || 'Your update is ready.',
    recipientId: /^[1-9]\d{5}$/.test(draft.recipientId.trim()) ? draft.recipientId : '482193',
  }, { ...notification.draft, destinationUrl: safeNotificationUrl(notification.draft.destinationUrl.trim()) || 'https://example.com/your-content' }))
  // Render only the masked string; the full credential stays in memory for explicit copying.
  const requestExample = computed(() => buildNudgeExample(
    examplePayload.value, language.value, token.value ? (isRevealed.value ? token.value : API_TOKEN_MASK) : null,
  ))
  const requestCopyExample = computed(() => token.value ? buildNudgeExample(examplePayload.value, language.value, token.value) : '')
  const responseExample = computed(() => JSON.stringify({ message: 'Nudge queued.', data: { status: 'queued', nudge_type: draft.nudgeType }, errors: {} }, null, 2))
  const resultText = computed(() => {
    const content = JSON.stringify(result.value?.body, null, 2) ?? ''
    return token.value ? content.replaceAll(token.value, '[redacted]') : content
  })

  watch(() => [draft.message, draft.nudgeType, draft.recipientId], () => { errors.value = {} })
  watch(token, () => { isConfirmationOpen.value = false; confirmedPayload.value = null; result.value = null; statusMessage.value = ''; requestError.value = '' })
  onScopeDispose(() => { isDisposed = true; abortController?.abort() })

  function handleReview(): boolean {
    if (isSending.value || isCredentialBusy.value) return false
    errors.value = validateApiNudge(draft)
    requestError.value = ''
    if (!token.value) { requestError.value = 'Create or load your API token above before sending.'; return false }
    const isContentValid = notification.validate()
    const caps = notification.capabilities.value
    if (caps && characterCount.value > caps.message_max_characters) errors.value.message = `Use ${caps.message_max_characters.toLocaleString()} characters or fewer.`
    if (caps && !caps.delivery_types.includes(draft.nudgeType)) { requestError.value = 'This delivery type is not available for your profile.'; return false }
    if (Object.keys(errors.value).length || !isContentValid) return false
    confirmedPayload.value = buildApiNudgeRequest(draft, notification.draft)
    isConfirmationOpen.value = true
    return true
  }

  async function handleSend(): Promise<void> {
    if (!isConfirmationOpen.value || !confirmedPayload.value || !token.value || isSending.value || isCredentialBusy.value) return
    isSending.value = true
    requestError.value = ''
    result.value = null
    statusMessage.value = 'Sending your request…'
    abortController = new AbortController()
    const reviewedToken = token.value
    try {
      const response = await sendApiNudge(token.value, confirmedPayload.value, abortController.signal)
      if (isDisposed || token.value !== reviewedToken) return
      result.value = response
      if (response.status >= 400) {
        const error = errorFromPayload(response.body, response.status)
        notification.applyFieldErrors(error.fieldErrors)
        errors.value = { message: error.fieldErrors.message, recipientId: error.fieldErrors.nudge_user_id }
      }
      statusMessage.value = response.status === 202
        ? 'Nudge queued. Check nudge history for delivery progress.'
        : `Request returned HTTP ${response.status}. Review the response below.`
    } catch {
      if (!isDisposed && token.value === reviewedToken) {
        requestError.value = 'No response received. The request may have been accepted. Check nudge history before sending again.'
        statusMessage.value = ''
      }
    } finally {
      if (!isDisposed) { isSending.value = false; isConfirmationOpen.value = false; confirmedPayload.value = null }
    }
  }

  return { notification, draft, language, errors, isSending, isConfirmationOpen, confirmedPayload, result, requestError, statusMessage, characterCount, exampleUsesSamples, requestExample, requestCopyExample, responseExample, resultText, handleReview, handleSend, endpoint: resolveApiUrl(NUDGE_SEND_PATH), messageLimit: computed(() => notification.capabilities.value?.message_max_characters || API_MESSAGE_LIMIT) }
}
