<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { useDisplay } from 'vuetify'
import SnackbarFeedback from '../ui/SnackbarFeedback.vue'
import ExpandableText from '../ui/ExpandableText.vue'
import ImageViewer from '../ui/ImageViewer.vue'
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
const selectedMedia = ref<{ id: string; src: string; alt: string }>()
const listElement = ref<HTMLElement | null>(null)
const isImageOpen = ref(false)
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
})
function handleExpand(id: string, isExpanded: boolean): void {
  if (isExpanded) expandedIds.value.add(id)
  else expandedIds.value.delete(id)
}
function handleViewImage(row: ReturnType<typeof presentNudgeHistory>): void {
  if (!row.mediaUrl) return
  selectedMedia.value = { id: row.id, src: row.mediaUrl, alt: `Notification image from ${row.title}` }
  isImageOpen.value = true
}
async function handleImageClosed(): Promise<void> {
  await nextTick()
  // A breakpoint change can replace the original trigger while the viewer is open.
  const triggers = listElement.value?.querySelectorAll<HTMLButtonElement>('[data-media-id]') ?? []
  Array.from(triggers).find(trigger => trigger.dataset.mediaId === selectedMedia.value?.id)?.focus({ preventScroll: true })
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
                <th class="ui-record-table__number" scope="col">Audience</th>
                <th class="ui-record-table__number" scope="col">Delivered</th>
                <th class="ui-record-table__number" scope="col">Muted</th>
                <th class="ui-record-table__number" scope="col">Total clicks</th>
                <th class="ui-record-table__number ui-record-table__rate" scope="col"><abbr title="Click-through rate">CTR</abbr></th>
                <th class="ui-record-table__status" scope="col">Status</th>
                <th class="ui-record-table__action" scope="col">CTA</th>
                <th class="ui-record-table__media" scope="col">Media</th>
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
                <td><a v-if="row.actionUrl" class="ui-text-action" :href="row.actionUrl" target="_blank" rel="noopener noreferrer" :aria-label="`${row.actionLabel} (opens in a new tab)`">{{ row.actionLabel }}<v-icon icon="mdi-open-in-new" size="14" aria-hidden="true" /></a><span v-else>—</span></td>
                <td><button v-if="row.mediaUrl" :data-media-id="row.id" class="ui-text-action" type="button" aria-haspopup="dialog" @click="handleViewImage(row)">View image</button><span v-else>—</span></td>
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
            <dl class="ui-record-card__metrics" aria-label="Audience delivery stats">
              <div><dt>Audience</dt><dd>{{ row.audience }}</dd></div>
              <div class="ui-record-list__delivered"><dt>Delivered</dt><dd>{{ row.delivered }}</dd></div>
              <div><dt>Muted</dt><dd>{{ row.muted }}</dd></div>
              <div><dt>Total clicks</dt><dd :aria-label="row.totalClicksLabel" :aria-describedby="engagementNoteId">{{ row.totalClicks }}</dd></div>
              <div><dt><abbr title="Click-through rate">CTR</abbr></dt><dd :aria-label="row.ctrLabel" :aria-describedby="engagementNoteId">{{ row.ctr }}</dd></div>
              <div :class="{ 'is-error': row.stats.failed_deliveries > 0 }"><dt>Failed deliveries</dt><dd>{{ row.failedDeliveries }}</dd></div>
            </dl>
            <dl class="ui-record-card__actions">
              <div><dt>CTA</dt><dd><a v-if="row.actionUrl" class="ui-text-action" :href="row.actionUrl" target="_blank" rel="noopener noreferrer" :aria-label="`${row.actionLabel} (opens in a new tab)`">{{ row.actionLabel }}<v-icon icon="mdi-open-in-new" size="14" aria-hidden="true" /></a><span v-else>—</span></dd></div>
              <div><dt>Media</dt><dd><button v-if="row.mediaUrl" :data-media-id="row.id" class="ui-text-action" type="button" aria-haspopup="dialog" @click="handleViewImage(row)">View image</button><span v-else>—</span></dd></div>
            </dl>
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
    <ImageViewer v-model="isImageOpen" :src="selectedMedia?.src" :alt="selectedMedia?.alt" @closed="handleImageClosed" />
  </div>
</template>
