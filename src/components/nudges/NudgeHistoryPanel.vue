<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { useDisplay } from 'vuetify'
import SnackbarFeedback from '../ui/SnackbarFeedback.vue'
import ExpandableText from '../ui/ExpandableText.vue'
import NudgeHistoryDetails from './NudgeHistoryDetails.vue'
import { presentNudgeHistory } from '../../lib/nudgeHistoryPresentation'
import type { NudgeHistoryItem } from '../../types/nudges'

const props = defineProps<{
  items: NudgeHistoryItem[]
  nextLink: string | null
  isLoading: boolean
  isLoadingMore: boolean
  errorMessage: string | null
}>()
const emit = defineEmits<{ retry: []; loadMore: [] }>()
const { smAndDown } = useDisplay()
const rows = computed(() => props.items.map(presentNudgeHistory))
const expandedIds = ref(new Set<string>())
const selectedId = ref<string>()
const selectedItem = computed(() => props.items.find(item => item.id === selectedId.value))
const listElement = ref<HTMLElement | null>(null)
const isStatsOpen = ref(false)
const engagementNoteId = useId()
const paginationDisabled = computed(() => props.isLoading || props.isLoadingMore || Boolean(props.errorMessage))
const statusMessage = computed(() => {
  if (props.isLoading) return props.items.length ? 'Updating nudges. Showing previous results while loading.' : 'Loading nudges.'
  if (props.isLoadingMore) return 'Loading more nudges.'
  if (props.errorMessage) return '' // The shared snackbar announces failures once.
  return props.items.length ? `${props.items.length} nudges loaded.` : 'No nudges found.'
})

watch(() => props.items, items => {
  const visibleIds = new Set(items.map(item => item.id))
  expandedIds.value = new Set([...expandedIds.value].filter(id => visibleIds.has(id)))
  if (isStatsOpen.value && !visibleIds.has(selectedId.value ?? '')) isStatsOpen.value = false
})
function handleExpand(id: string, isExpanded: boolean): void {
  if (isExpanded) expandedIds.value.add(id)
  else expandedIds.value.delete(id)
}
function handleViewStats(id: string): void {
  selectedId.value = id
  isStatsOpen.value = true
}
async function handleStatsClosed(): Promise<void> {
  await nextTick()
  // A breakpoint change can replace the original trigger while the viewer is open.
  const triggers = listElement.value?.querySelectorAll<HTMLButtonElement>('[data-stats-id]') ?? []
  Array.from(triggers).find(trigger => trigger.dataset.statsId === selectedId.value)?.focus({ preventScroll: true })
}
function handleLoadMore(): void {
  if (!paginationDisabled.value) emit('loadMore')
}
</script>

<template>
  <div ref="listElement" class="ui-record-list">
    <p class="ui-visually-hidden" role="status">{{ statusMessage }}</p>
    <SnackbarFeedback :message="props.errorMessage ? props.errorMessage + (props.items.length ? ' Still showing previous results.' : '') : ''" action-text="Try again" :is-action-disabled="props.isLoading || props.isLoadingMore" @action="emit('retry')" />

    <div class="ui-record-list__content" :aria-busy="props.isLoading || props.isLoadingMore">
      <!-- Keep loaded entries mounted during refresh, preserving scroll and expanded messages. -->
      <div v-if="props.isLoading && !props.items.length" class="ui-record-list__loading" aria-hidden="true">
        <v-skeleton-loader v-for="item in 5" :key="item" type="list-item-two-line" />
      </div>
      <div v-else-if="!props.items.length" class="empty-state">
        <v-avatar color="primary" size="56" variant="tonal"><v-icon icon="mdi-message-badge-outline" size="28" /></v-avatar>
        <h2>{{ props.errorMessage ? 'Nudge history' : 'No nudges here yet' }}</h2>
        <p>{{ props.errorMessage ? 'Reload your history to see your nudges.' : 'Your sent messages and delivery details will appear here.' }}</p>
      </div>
      <template v-else>
        <p :id="engagementNoteId" class="ui-record-list__note">Rich engagement updates nightly. <span aria-hidden="true">—</span> means unavailable or not applicable.</p>

        <div v-if="!smAndDown" class="ui-record-table__scroll" role="region" aria-label="Nudge history — scroll to see all columns" tabindex="0">
          <table class="ui-record-table">
            <caption class="ui-visually-hidden">Nudge history, newest first</caption>
            <thead>
              <tr>
                <th class="ui-record-table__message" scope="col">Message</th>
                <th class="ui-record-table__format" scope="col">Type</th>
                <th class="ui-record-table__number" scope="col">Inbox audience</th>
                <th class="ui-record-table__number" scope="col">Push delivered</th>
                <th class="ui-record-table__number" scope="col">Push silenced</th>
                <th class="ui-record-table__number" scope="col">Total clicks</th>
                <th class="ui-record-table__number ui-record-table__rate" scope="col"><abbr title="Click-through rate">CTR</abbr></th>
                <th class="ui-record-table__status" scope="col">Status</th>
                <th class="ui-record-table__action" scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id" data-testid="history-item">
                <td class="ui-record-table__message">
                  <ExpandableText :text="row.message" :is-expanded="expandedIds.has(row.id)" @update:is-expanded="handleExpand(row.id, $event)" />
                  <span class="ui-record-list__meta">{{ row.sentLabel }}</span>
                </td>
                <td class="ui-record-table__format"><span class="ui-status-tag">{{ row.formatLabel }}</span></td>
                <td class="ui-record-table__number">{{ row.audience }}</td>
                <td class="ui-record-table__number ui-record-list__delivered">{{ row.delivered }}</td>
                <td class="ui-record-table__number">{{ row.muted }}</td>
                <td class="ui-record-table__number" :aria-describedby="engagementNoteId"><span :aria-label="row.totalClicksLabel">{{ row.totalClicks }}</span></td>
                <td class="ui-record-table__number ui-record-table__rate" :aria-describedby="engagementNoteId"><span :aria-label="row.ctrLabel">{{ row.ctr }}</span></td>
                <td class="ui-record-table__status">
                  <v-chip :color="row.statusDetails.color" size="small" variant="tonal"><v-icon start :icon="row.statusDetails.icon" />{{ row.cardStatusLabel }}</v-chip>
                  <span v-if="row.failed" class="ui-record-list__failure">{{ row.failed }}</span>
                </td>
                <td><button :data-stats-id="row.id" class="ui-text-action" type="button" aria-haspopup="dialog" @click="handleViewStats(row.id)">More stats<v-icon icon="mdi-chevron-right" size="16" aria-hidden="true" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="ui-record-cards" aria-label="Nudge history cards">
          <article v-for="row in rows" :key="row.id" class="ui-record-card" data-testid="history-item">
            <header class="ui-record-card__header">
              <span class="ui-status-tag">{{ row.formatLabel }}</span>
              <v-chip :color="row.statusDetails.color" size="small" variant="tonal"><v-icon start :icon="row.statusDetails.icon" />{{ row.cardStatusLabel }}</v-chip>
            </header>
            <span class="ui-record-list__meta">{{ row.sentLabel }}</span>
            <div class="ui-record-card__message">
              <ExpandableText :text="row.message" :is-expanded="expandedIds.has(row.id)" @update:is-expanded="handleExpand(row.id, $event)" />
            </div>
            <dl class="ui-record-card__metrics" aria-label="Inbox and push stats">
              <div v-for="metric in row.cardMetrics" :key="metric.key" :class="{ 'ui-record-list__delivered': metric.tone === 'success', 'is-error': metric.tone === 'error' }">
                <dt>{{ metric.label }}</dt><dd :aria-label="metric.accessibleLabel" :aria-describedby="['clicks', 'ctr'].includes(metric.key) ? engagementNoteId : undefined">{{ metric.compactValue }}</dd>
              </div>
            </dl>
            <button :data-stats-id="row.id" class="ui-text-action" type="button" aria-haspopup="dialog" @click="handleViewStats(row.id)">More stats<v-icon icon="mdi-chevron-right" size="16" aria-hidden="true" /></button>
          </article>
        </div>
        <div v-if="props.nextLink && !props.errorMessage" class="ui-record-list__footer">
          <v-btn :loading="props.isLoadingMore" :disabled="paginationDisabled" variant="tonal" @click="handleLoadMore">Load more nudges<v-icon end icon="mdi-arrow-down" /></v-btn>
        </div>
      </template>
      <div v-if="props.errorMessage" class="ui-record-list__footer">
        <v-btn :disabled="props.isLoading || props.isLoadingMore" variant="tonal" @click="emit('retry')">Reload nudges</v-btn>
      </div>
    </div>
    <NudgeHistoryDetails v-model="isStatsOpen" :item="selectedItem" @closed="handleStatsClosed" />
  </div>
</template>
