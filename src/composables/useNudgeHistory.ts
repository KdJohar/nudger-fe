import { onMounted, onUnmounted, ref, type Ref } from 'vue'

import { getNudgeHistory } from '../lib/nudges'
import type { NudgeHistoryItem, NudgeType } from '../types/nudges'

export function useNudgeHistory(nudgeType: Ref<NudgeType | null>) {
  const items = ref<NudgeHistoryItem[]>([])
  const nextLink = ref<string | null>(null)
  const isLoading = ref(true)
  const isLoadingMore = ref(false)
  const errorMessage = ref<string | null>(null)
  const loadMoreError = ref<string | null>(null)
  let requestVersion = 0

  function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Nudge history could not be loaded. Please try again.'
  }

  async function loadInitial(): Promise<void> {
    const version = ++requestVersion
    isLoading.value = true
    errorMessage.value = null
    loadMoreError.value = null
    items.value = []
    nextLink.value = null

    try {
      const response = await getNudgeHistory({
        nudgeType: nudgeType.value ?? undefined,
      })
      if (version !== requestVersion) {
        return
      }
      items.value = response.data.items
      nextLink.value = response.data.next
    } catch (error) {
      if (version === requestVersion) {
        errorMessage.value = getErrorMessage(error)
      }
    } finally {
      if (version === requestVersion) {
        isLoading.value = false
      }
    }
  }

  async function loadMore(): Promise<void> {
    if (!nextLink.value || isLoadingMore.value) {
      return
    }

    const version = requestVersion
    const link = nextLink.value
    isLoadingMore.value = true
    loadMoreError.value = null

    try {
      const response = await getNudgeHistory({ nextLink: link })
      if (version !== requestVersion) {
        return
      }
      items.value = [...items.value, ...response.data.items]
      nextLink.value = response.data.next
    } catch (error) {
      if (version === requestVersion) {
        loadMoreError.value = getErrorMessage(error)
      }
    } finally {
      if (version === requestVersion) {
        isLoadingMore.value = false
      }
    }
  }

  onMounted(() => {
    void loadInitial()
  })

  onUnmounted(() => {
    requestVersion += 1
  })

  return {
    items,
    nextLink,
    isLoading,
    isLoadingMore,
    errorMessage,
    loadMoreError,
    loadInitial,
    loadMore,
  }
}
