import { onMounted, onUnmounted, ref, watch } from 'vue'

import { ApiError } from '../lib/api'
import { getAudienceOverview } from '../lib/audience'
import type { AudienceOverview, AudiencePeriod } from '../types/audience'

const DEFAULT_PERIOD: AudiencePeriod = '30d'

export function useAudienceOverview() {
  const selectedPeriod = ref<AudiencePeriod>(DEFAULT_PERIOD)
  const overview = ref<AudienceOverview | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const requestSequence = ref(0)

  async function loadOverview(period: AudiencePeriod = selectedPeriod.value): Promise<void> {
    const requestId = ++requestSequence.value
    isLoading.value = true
    errorMessage.value = null

    try {
      const response = await getAudienceOverview(period)
      if (requestId !== requestSequence.value) {
        return
      }
      overview.value = response.data
    } catch (error) {
      if (requestId !== requestSequence.value) {
        return
      }
      errorMessage.value = error instanceof ApiError
        ? error.message
        : 'Audience insights could not be loaded. Please try again.'
    } finally {
      if (requestId === requestSequence.value) {
        isLoading.value = false
      }
    }
  }

  function handlePeriodChange(period: AudiencePeriod): void {
    selectedPeriod.value = period
  }

  let stopPeriodWatch: (() => void) | null = null

  onMounted(() => {
    stopPeriodWatch = watch(selectedPeriod, (period) => {
      void loadOverview(period)
    })
    void loadOverview()
  })

  onUnmounted(() => {
    requestSequence.value += 1
    stopPeriodWatch?.()
  })

  return {
    selectedPeriod,
    overview,
    isLoading,
    errorMessage,
    loadOverview,
    handlePeriodChange,
  }
}
