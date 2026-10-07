<script setup lang="ts">
import { computed } from 'vue'
import SnackbarFeedback from '../ui/SnackbarFeedback.vue'
import type { NudgeHistoryItem, NudgeStatus } from '../../types/nudges'

interface NudgeHistoryPanelProps {
  items: NudgeHistoryItem[]
  nextLink: string | null
  isLoading: boolean
  isLoadingMore: boolean
  errorMessage: string | null
}

const props = defineProps<NudgeHistoryPanelProps>()

const emit = defineEmits<{
  retry: []
  loadMore: []
}>()

const paginationDisabled = computed(() => props.isLoading || props.isLoadingMore || Boolean(props.errorMessage))
const statusMessage = computed(() => {
  if (props.isLoading) return props.items.length ? 'Updating nudges. Showing previous results while loading.' : 'Loading nudges.'
  if (props.isLoadingMore) return 'Loading more nudges.'
  if (props.errorMessage) return '' // The shared snackbar announces failures once.
  return props.items.length ? `${props.items.length} nudges loaded.` : 'No nudges found.'
})

function loadMore(): void {
  if (!paginationDisabled.value) emit('loadMore')
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusColor(status: NudgeStatus): string {
  return status === 'completed' ? 'success' : status === 'processing' ? 'info' : 'secondary'
}

function statusIcon(status: NudgeStatus): string {
  return status === 'completed' ? 'mdi-check-circle-outline' : status === 'processing' ? 'mdi-progress-clock' : 'mdi-clock-outline'
}

function statusLabel(status: NudgeStatus): string {
  return status === 'completed' ? 'Completed' : status === 'processing' ? 'Processing' : 'Queued'
}

function completionDuration(item: NudgeHistoryItem): string | null {
  if (!item.completed_at) return null

  const durationSeconds = Math.max(
    0,
    Math.round((new Date(item.completed_at).getTime() - new Date(item.created_at).getTime()) / 1000),
  )

  return durationSeconds === 0 ? '<1s' : `${durationSeconds}s`
}
</script>

<template>
  <div class="nudge-history">
    <p class="ui-visually-hidden" role="status">{{ statusMessage }}</p>
    <SnackbarFeedback :message="props.errorMessage ? props.errorMessage + (props.items.length ? ' Still showing previous results.' : '') : ''" action-text="Try again" :is-action-disabled="props.isLoading || props.isLoadingMore" @action="emit('retry')" />

    <v-card class="surface-card nudge-list" rounded="xl" :aria-busy="props.isLoading || props.isLoadingMore">
      <!-- Retain loaded cards during filter refreshes so the document cannot collapse and reset scroll. -->
      <div v-if="props.isLoading && !props.items.length" class="nudge-list__loading" aria-hidden="true">
        <v-skeleton-loader v-for="item in 5" :key="item" type="list-item-two-line" />
      </div>

      <div v-else-if="!props.items.length" class="empty-state">
        <v-avatar color="primary" size="56" variant="tonal">
          <v-icon icon="mdi-message-badge-outline" size="28" />
        </v-avatar>
        <h2>{{ props.errorMessage ? 'Nudge history' : 'No nudges here yet' }}</h2>
        <p>{{ props.errorMessage ? 'Reload your history to see your nudges.' : 'When messages move through your profile, their delivery story will appear in this timeline.' }}</p>
      </div>

      <template v-else>
        <div class="nudge-cards" aria-label="Nudge history cards">
          <v-card v-for="item in props.items" :key="item.id" class="nudge-card" rounded="xl" variant="flat">
            <div class="nudge-card__header">
              <div class="nudge-card__identity">
                <v-avatar
                  :color="item.nudge_type === 'broadcast' ? 'primary' : 'secondary'"
                  size="44"
                  variant="tonal"
                  aria-hidden="true"
                >
                  <v-icon :icon="item.nudge_type === 'broadcast' ? 'mdi-bullhorn-outline' : 'mdi-message-processing-outline'" />
                </v-avatar>
                <div class="nudge-card__heading">
                  <strong>{{ item.title }}</strong>
                  <span>Sent {{ formatDate(item.created_at) }}</span>
                </div>
              </div>

              <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
                <v-icon start :icon="statusIcon(item.status)" />
                {{ statusLabel(item.status) }}
              </v-chip>
            </div>

            <p class="nudge-card__message">{{ item.message }}</p>

            <div class="nudge-card__stats" aria-label="Audience delivery stats" role="list">
              <div class="nudge-card__stat nudge-card__stat--audience" role="listitem">
                <v-icon aria-hidden="true" icon="mdi-account-multiple-outline" size="18" />
                <span>
                  <small>Audience</small>
                  <strong>{{ item.stats.total_audience.toLocaleString() }}</strong>
                </span>
              </div>
              <div class="nudge-card__stat nudge-card__stat--delivered" role="listitem">
                <v-icon aria-hidden="true" icon="mdi-check-circle-outline" size="18" />
                <span>
                  <small>Delivered</small>
                  <strong>{{ item.stats.delivered_users.toLocaleString() }}</strong>
                </span>
              </div>
              <div class="nudge-card__stat nudge-card__stat--muted" role="listitem">
                <v-icon aria-hidden="true" icon="mdi-volume-off-outline" size="18" />
                <span>
                  <small>Muted</small>
                  <strong>{{ item.stats.muted_users.toLocaleString() }}</strong>
                </span>
              </div>
            </div>

            <div class="nudge-card__footer">
              <span class="nudge-card__timing">
                <v-icon aria-hidden="true" :icon="item.completed_at ? 'mdi-timer-outline' : statusIcon(item.status)" size="14" />
                {{ completionDuration(item) ? `Completed in ${completionDuration(item)}` : item.status === 'processing' ? 'Delivery in progress' : 'Queued for delivery' }}
              </span>
              <span v-if="item.stats.failed_deliveries > 0" class="nudge-card__delivery">
                <v-icon aria-hidden="true" icon="mdi-alert-circle-outline" size="14" />
                {{ item.stats.failed_deliveries.toLocaleString() }} failed
              </span>
            </div>
          </v-card>
        </div>

        <div v-if="props.nextLink && !props.errorMessage" class="nudge-list__footer">
          <v-btn :loading="props.isLoadingMore" :disabled="paginationDisabled" variant="tonal" @click="loadMore">
            Load more nudges
            <v-icon end icon="mdi-arrow-down" />
          </v-btn>
        </div>
      </template>
      <div v-if="props.errorMessage" class="nudge-list__footer">
        <v-btn :disabled="props.isLoading || props.isLoadingMore" variant="tonal" @click="emit('retry')">Reload nudges</v-btn>
      </div>
    </v-card>
  </div>
</template>
