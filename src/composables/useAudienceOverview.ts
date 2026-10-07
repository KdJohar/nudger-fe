import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { getAudienceOverview } from '../lib/audience'
import type { AudienceOverview, AudiencePeriod } from '../types/audience'
import { useAuth } from './useAuth'

export function useAudienceOverview(initialPeriod: AudiencePeriod = '30d') {
  const { state, authenticatedRequest } = useAuth()
  const period = ref<AudiencePeriod>(initialPeriod)
  const overview = ref<AudienceOverview | null>(null)
  const isLoading = ref(true)
  const errorMessage = ref<string | null>(null)
  let requestSequence = 0

  async function loadOverview(): Promise<void> {
    if (!state.accessToken) return
    const sequence = ++requestSequence
    isLoading.value = true
    errorMessage.value = null
    try {
      const result = await getAudienceOverview(period.value, authenticatedRequest)
      if (sequence === requestSequence) overview.value = result
    } catch (error) {
      if (sequence === requestSequence) errorMessage.value = error instanceof Error ? error.message : 'Unable to load audience insights.'
    } finally {
      if (sequence === requestSequence) isLoading.value = false
    }
  }

  watch(period as Ref<AudiencePeriod>, loadOverview)
  onMounted(loadOverview)
  onBeforeUnmount(() => { requestSequence += 1 })

  return { period, overview, isLoading, errorMessage, loadOverview }
}
