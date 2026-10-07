import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { getNudgeHistory } from '../lib/nudges'
import type { NudgeHistoryItem, NudgeType } from '../types/nudges'
import { useAuth } from './useAuth'

export function useNudgeHistory(nudgeType: Ref<NudgeType | null>) {
  const { state, authenticatedRequest } = useAuth()
  const items = ref<NudgeHistoryItem[]>([])
  const nextLink = ref<string | null>(null)
  const isLoading = ref(true)
  const isLoadingMore = ref(false)
  const errorMessage = ref<string | null>(null)
  let requestSequence = 0
  let lastRequestWasAppend = false
  let loadedNudgeType = nudgeType.value
  let abortController: AbortController | undefined

  async function loadHistory(append = false): Promise<void> {
    if (!state.accessToken) return
    if (append && (isLoading.value || isLoadingMore.value || !nextLink.value || loadedNudgeType !== nudgeType.value)) return
    abortController?.abort()
    abortController = new AbortController()
    const signal = abortController.signal
    const requestedNudgeType = nudgeType.value
    lastRequestWasAppend = append
    const sequence = ++requestSequence
    isLoadingMore.value = append
    isLoading.value = !append
    errorMessage.value = null
    try {
      const result = await getNudgeHistory((path, init) => authenticatedRequest(path, { ...init, signal }), {
        nextLink: append ? nextLink.value : null,
        nudgeType: nudgeType.value,
      })
      if (sequence !== requestSequence) return
      // Cursor pages can overlap when new nudges arrive. Keep one card per nudge.
      items.value = append ? [...new Map([...items.value, ...result.items].map(item => [item.id, item])).values()] : result.items
      nextLink.value = result.next
      loadedNudgeType = requestedNudgeType
    } catch (error) {
      if (sequence === requestSequence) errorMessage.value = error instanceof Error ? error.message : 'Unable to load nudge history.'
    } finally {
      if (sequence === requestSequence) {
        isLoading.value = false
        isLoadingMore.value = false
      }
    }
  }

  watch(nudgeType, () => loadHistory())
  onMounted(() => loadHistory())
  onUnmounted(() => { requestSequence += 1; abortController?.abort() })

  return { items, nextLink, isLoading, isLoadingMore, errorMessage, loadHistory, retryHistory: () => loadHistory(lastRequestWasAppend) }
}
