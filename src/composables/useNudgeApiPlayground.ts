import { computed, onScopeDispose, reactive, ref, watch, type Ref } from 'vue'
import { resolveApiUrl } from '../lib/apiUrl'
import { API_TOKEN_MASK } from '../lib/apiToken'
import { API_MESSAGE_LIMIT, NUDGE_SEND_PATH, buildApiNudgeRequest, buildNudgeExample, sendApiNudge, validateApiNudge } from '../lib/nudgeApi'
import type { ApiNudgeDraft, ApiNudgeRequest, ApiNudgeResult, NudgeExampleLanguage } from '../types/nudgeApi'

export function useNudgeApiPlayground(token: Readonly<Ref<string | null>>, isCredentialBusy: Readonly<Ref<boolean>>, isRevealed: Readonly<Ref<boolean>>) {
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
  const characterCount = computed(() => Array.from(draft.message).length)
  const examplePayload = computed(() => buildApiNudgeRequest({
    ...draft,
    message: draft.message || 'Your update is ready.',
    recipientId: /^[1-9]\d{5}$/.test(draft.recipientId.trim()) ? draft.recipientId : '482193',
  }))
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
    if (Object.keys(errors.value).length) return false
    if (!token.value) { requestError.value = 'Create or load your API token above before sending.'; return false }
    confirmedPayload.value = buildApiNudgeRequest(draft)
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
    try {
      const response = await sendApiNudge(token.value, confirmedPayload.value, abortController.signal)
      if (isDisposed) return
      result.value = response
      statusMessage.value = response.status === 202
        ? 'Nudge queued. Check nudge history for delivery progress.'
        : `Request returned HTTP ${response.status}. Review the response below.`
    } catch {
      if (!isDisposed) {
        requestError.value = 'No response received. The request may have been accepted. Check nudge history before sending again.'
        statusMessage.value = ''
      }
    } finally {
      if (!isDisposed) { isSending.value = false; isConfirmationOpen.value = false; confirmedPayload.value = null }
    }
  }

  return { draft, language, errors, isSending, isConfirmationOpen, confirmedPayload, result, requestError, statusMessage, characterCount, requestExample, requestCopyExample, responseExample, resultText, handleReview, handleSend, endpoint: resolveApiUrl(NUDGE_SEND_PATH), messageLimit: API_MESSAGE_LIMIT }
}
