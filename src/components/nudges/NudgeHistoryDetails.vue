<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useDisplay } from 'vuetify'
import Sheet from '../ui/Sheet.vue'
import DialogFrame from '../ui/DialogFrame.vue'
import MediaPreview from '../ui/MediaPreview.vue'
import { presentNudgeHistory } from '../../lib/nudgeHistoryPresentation'
import type { NudgeHistoryItem } from '../../types/nudges'

const props = defineProps<{ item?: NudgeHistoryItem }>()
const emit = defineEmits<{ closed: [] }>()
const isOpen = defineModel<boolean>({ default: false })
const { smAndDown } = useDisplay()
const row = computed(() => props.item ? presentNudgeHistory(props.item) : undefined)
const hasLongValues = computed(() => row.value?.metrics.some(metric => metric.value.length > 12) ?? false)
const isSheet = ref(false)
const isMediaVisible = ref(false)
const titleId = useId()
const mediaId = useId()
const titleElement = ref<HTMLElement | null>(null)
const contentElement = ref<HTMLElement | null>(null)
let activeDialog: HTMLElement | null = null
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') { event.stopPropagation(); isOpen.value = false }
}
function stopKeyboardHandling(): void {
  activeDialog?.removeEventListener('keydown', handleKeydown)
  activeDialog = null
}
// Include the Sheet's header close button and handle, even during Vuetify's stack transition.
watch([isOpen, contentElement], ([opened, element]) => {
  stopKeyboardHandling()
  if (opened) {
    activeDialog = element?.closest<HTMLElement>('[role="dialog"]') ?? null
    activeDialog?.addEventListener('keydown', handleKeydown)
  }
}, { flush: 'post' })
onBeforeUnmount(stopKeyboardHandling)
// Keep the open surface stable through rotation; both layouts render this same content.
watch(isOpen, opened => {
  if (opened) { isSheet.value = smAndDown.value; isMediaVisible.value = false }
}, { immediate: true })
watch(() => props.item?.id, () => { isMediaVisible.value = false })
const surface = computed(() => isSheet.value ? Sheet : 'v-dialog')
const surfaceProps = computed(() => isSheet.value
  ? { title: 'Nudge stats', closeLabel: 'Close stats' }
  : { maxWidth: 680, 'aria-labelledby': titleId })
</script>

<template>
  <component :is="surface" v-model="isOpen" v-bind="surfaceProps"
    @after-enter="titleElement?.focus({ preventScroll: true })" @after-leave="emit('closed')">
    <component :is="isSheet ? 'div' : DialogFrame" class="ui-details" body-label="Nudge stats and content">
      <template v-if="!isSheet" #header>
        <h2 :id="titleId" ref="titleElement" class="ui-details__title" tabindex="-1">Nudge stats</h2>
      </template>
      <div v-if="row && isOpen" ref="contentElement" class="ui-details__content">
        <div class="ui-details__metadata">
          <span class="ui-status-tag">{{ row.formatLabel }}</span>
          <v-chip :color="row.statusDetails.color" size="small" variant="tonal"><v-icon start :icon="row.statusDetails.icon" />{{ row.cardStatusLabel }}</v-chip>
          <span class="ui-record-list__meta">{{ row.sentLabel }}</span>
        </div>
        <dl class="ui-stat-list" :class="{ 'ui-stat-list--stacked': hasLongValues }" aria-label="Notification statistics">
          <div v-for="metric in row.metrics" :key="metric.key" :class="{ 'is-success': metric.tone === 'success', 'is-error': metric.tone === 'error' }">
            <dt><span>{{ metric.label }}</span><small>{{ metric.description }}</small></dt>
            <dd :aria-label="metric.accessibleLabel">{{ metric.value }}</dd>
          </div>
        </dl>
        <p class="ui-details__note">{{ row.engagementLabel }}</p>
        <p class="ui-details__note">Push delivered counts device sends, not unique people or confirmation that a notification appeared on a phone. People without a registered device still receive the inbox message.</p>
        <p v-if="row.status === 'completed'" class="ui-details__note">Processing is complete. Any failed pushes are counted separately.</p>
        <div v-if="row.actionUrl || row.mediaUrl" class="ui-details__actions">
          <a v-if="row.actionUrl" class="ui-text-action" :href="row.actionUrl" target="_blank" rel="noopener noreferrer" :aria-label="`${row.actionLabel} (opens in a new tab)`">{{ row.actionLabel }}<v-icon icon="mdi-open-in-new" size="16" aria-hidden="true" /></a>
          <button v-if="row.mediaUrl" class="ui-text-action" type="button" :aria-expanded="isMediaVisible" :aria-controls="mediaId" @click="isMediaVisible = !isMediaVisible"><v-icon icon="mdi-image-outline" size="16" aria-hidden="true" />{{ isMediaVisible ? 'Hide image' : 'View image' }}</button>
        </div>
        <div v-if="row.mediaUrl" :id="mediaId" class="ui-details__media" :hidden="!isMediaVisible">
          <MediaPreview v-if="isMediaVisible" :key="row.mediaUrl" :src="row.mediaUrl" alt="Notification image" />
          <p v-if="isMediaVisible" class="ui-details__note">Older images may no longer be available. Your message and stats remain in history.</p>
        </div>
      </div>
      <template v-if="!isSheet" #footer><v-btn variant="tonal" @click="isOpen = false">Close stats</v-btn></template>
    </component>
  </component>
</template>
