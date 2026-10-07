<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useNudgeHistory } from '../composables/useNudgeHistory'
import { useAuth } from '../composables/useAuth'
import type { NudgeType } from '../types/nudges'
import NudgeHistoryPanel from '../components/nudges/NudgeHistoryPanel.vue'
import NudgeComposerSheet from '../components/nudges/NudgeComposerSheet.vue'
import { usePagePresentation } from '../composables/usePageLayout'

interface NudgeFilterItem {
  title: string
  value: NudgeType
  icon: string
}

const nudgeType = ref<NudgeType>('broadcast')
const isComposerOpen = ref(false)
const { smAndDown } = useDisplay()
const { items, nextLink, isLoading, isLoadingMore, errorMessage, loadHistory, retryHistory } = useNudgeHistory(nudgeType)
const { state } = useAuth()
const isCreator = computed(() => state.merchantProfile?.profile_type === 'creator')
const canFilterNudgeTypes = computed(() => state.merchantProfile?.profile_type === 'platform')
const nudgeFilterItems = computed<NudgeFilterItem[]>(() => [
  { title: 'Broadcast', value: 'broadcast', icon: 'mdi-bullhorn-outline' },
  { title: 'Transactional', value: 'transactional', icon: 'mdi-message-processing-outline' },
])

watch(isCreator, (creator) => {
  if (creator) nudgeType.value = 'broadcast'
})

function handleNudgeQueued(): void {
  void loadHistory()
}

function handleCompose(): void {
  if (smAndDown.value) isComposerOpen.value = true
}
usePagePresentation(() => ({
  filter: canFilterNudgeTypes.value ? {
    label: 'Filter nudge history',
    items: nudgeFilterItems.value,
    modelValue: nudgeType.value,
    onSelect(value) {
      if (value === 'broadcast' || value === 'transactional') nudgeType.value = value
    },
  } : undefined,
}))
</script>

<template>
  <div class="nudges-view">
    <NudgeHistoryPanel
      :error-message="errorMessage"
      :is-loading="isLoading"
      :is-loading-more="isLoadingMore"
      :items="items"
      :next-link="nextLink"
      @load-more="loadHistory(true)"
      @retry="retryHistory()"
    />

    <v-btn
      aria-label="Send a nudge"
      class="nudges-view__fab"
      color="primary"
      icon="mdi-send-outline"
      title="Send a nudge"
      :to="smAndDown ? undefined : '/compose'"
      :aria-haspopup="smAndDown ? 'dialog' : undefined"
      @click="handleCompose"
      rounded="circle"
    />

    <NudgeComposerSheet v-model="isComposerOpen" @queued="handleNudgeQueued" />
  </div>
</template>
