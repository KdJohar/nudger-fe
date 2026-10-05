<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import DashboardShell from './DashboardShell.vue'
import IconGlyph from './IconGlyph.vue'
import { useAuth } from '../composables/useAuth'
import { useNudgeHistory } from '../composables/useNudgeHistory'
import type { NudgeHistoryItem, NudgeStatus, NudgeType } from '../types/nudges'

const { state } = useAuth()
const selectedNudgeType = ref<NudgeType | null>(null)
const isPlatformMerchant = computed(() => state.merchantProfile?.profile_type === 'platform')
const typeFilterOptions: Array<{ value: NudgeType | null; label: string }> = [
  { value: null, label: 'All nudges' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'transactional', label: 'Transactional' },
]

const {
  items,
  nextLink,
  isLoading,
  isLoadingMore,
  errorMessage,
  loadMoreError,
  loadInitial,
  loadMore,
} = useNudgeHistory(selectedNudgeType)

function handleTypeFilter(type: NudgeType | null): void {
  if (selectedNudgeType.value === type) {
    return
  }

  selectedNudgeType.value = type
}

watch(
  () => state.merchantProfile?.profile_type,
  (profileType) => {
    if (profileType === 'creator' && selectedNudgeType.value !== null) {
      selectedNudgeType.value = null
    }
  },
)

watch(selectedNudgeType, () => {
  void loadInitial()
})

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDuration(createdAt: string, completedAt: string): string {
  const elapsedSeconds = Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(createdAt).getTime()) / 1000))

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s`
  }

  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`
}

function typeLabel(type: NudgeHistoryItem['nudge_type']): string {
  return type === 'transactional' ? 'Transactional' : 'Broadcast'
}

function senderLabel(sender: NudgeHistoryItem['sender']): string {
  return sender.charAt(0).toUpperCase() + sender.slice(1)
}

function statusLabel(status: NudgeStatus): string {
  switch (status) {
    case 'processing':
      return 'Processing'
    case 'completed':
      return 'Completed'
    default:
      return 'Created'
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

function handleRetry(): void {
  void loadInitial()
}
</script>

<template>
  <DashboardShell>
    <section class="history" aria-labelledby="nudges-heading">
      <div class="history__intro">
        <div>
          <p class="history__eyebrow"><span aria-hidden="true"></span> Nudge history</p>
          <h1 id="nudges-heading">Every message, accounted for.</h1>
          <p class="history__lede">Review the latest updates you sent and see how each one moved through your audience.</p>
        </div>
        <div class="history__summary" aria-label="Nudge history summary">
          <IconGlyph name="send" />
          <span><strong>Latest first</strong><small>Delivery details included</small></span>
        </div>
      </div>

      <div class="history__filters" aria-label="Nudge type filter">
        <span class="history__filters-label">Show</span>
        <div v-if="isPlatformMerchant" class="history__filter-group" role="group" aria-label="Filter nudges by type">
          <button
            v-for="option in typeFilterOptions"
            :key="option.label"
            class="history__filter"
            :class="{ 'history__filter--active': selectedNudgeType === option.value }"
            type="button"
            :aria-pressed="selectedNudgeType === option.value"
            @click="handleTypeFilter(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <span v-else class="history__filter-note">Broadcast nudges</span>
      </div>

      <div v-if="isLoading" class="history__loading" aria-busy="true" aria-label="Loading nudge history">
        <div v-for="row in 5" :key="row" class="history__loading-row"></div>
      </div>

      <div v-else-if="errorMessage" class="history__notice history__notice--error" role="alert">
        <strong>Nudge history is unavailable.</strong>
        <p>{{ errorMessage }}</p>
        <button type="button" class="history__button history__button--dark" @click="handleRetry">Try again</button>
      </div>

      <div v-else-if="items.length === 0" class="history__empty" role="status">
        <span class="history__empty-icon" aria-hidden="true"><IconGlyph name="send" /></span>
        <h2>No nudges yet.</h2>
        <p>Your sent updates will appear here with delivery and audience details.</p>
      </div>

      <div v-else class="history__table-wrap">
        <table class="history__table">
          <caption class="sr-only">Nudge history, ordered from newest to oldest</caption>
          <thead>
            <tr>
              <th scope="col">Nudge</th>
              <th scope="col">Type</th>
              <th scope="col">Platform user</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
              <th scope="col">Completed</th>
              <th scope="col">Audience outcome</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td data-label="Nudge">
                <div class="history__nudge">
                  <strong>{{ item.title }}</strong>
                  <span>{{ item.message }}</span>
                  <small>{{ senderLabel(item.sender) }}</small>
                </div>
              </td>
              <td data-label="Type">
                <span class="history__type" :class="`history__type--${item.nudge_type}`">{{ typeLabel(item.nudge_type) }}</span>
              </td>
              <td data-label="Platform user" class="history__platform-user">{{ item.merchant_platform_user_id || '—' }}</td>
              <td data-label="Status">
                <span class="history__status" :class="`history__status--${item.status}`">{{ statusLabel(item.status) }}</span>
              </td>
              <td data-label="Created"><time :datetime="item.created_at">{{ formatDate(item.created_at) }}</time></td>
              <td data-label="Completed">
                <template v-if="item.completed_at">
                  <time :datetime="item.completed_at">{{ formatDate(item.completed_at) }}</time>
                  <span class="history__duration">Completed in {{ formatDuration(item.created_at, item.completed_at) }}</span>
                </template>
                <span v-else>—</span>
              </td>
              <td data-label="Audience outcome">
                <ul class="history__stats" aria-label="Delivery statistics">
                  <li><strong>{{ formatNumber(item.stats.delivered_users) }}</strong><span>delivered</span></li>
                  <li><strong>{{ formatNumber(item.stats.muted_users) }}</strong><span>muted</span></li>
                  <li><strong>{{ formatNumber(item.stats.failed_deliveries) }}</strong><span>failed deliveries</span></li>
                </ul>
                <p class="history__reach">{{ formatNumber(item.stats.total_audience) }} audience · {{ formatNumber(item.stats.total_devices) }} devices</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="loadMoreError" class="history__load-more-error" role="alert">
          <span>{{ loadMoreError }}</span>
          <button type="button" class="history__text-button" @click="void loadMore()">Try again</button>
        </div>
        <div v-if="nextLink" class="history__load-more">
          <button type="button" class="history__button" :disabled="isLoadingMore" :aria-busy="isLoadingMore" @click="void loadMore()">
            {{ isLoadingMore ? 'Loading more…' : 'Load more nudges' }}
          </button>
        </div>
        <p v-else class="history__end" role="status">You’re all caught up.</p>
      </div>
    </section>
  </DashboardShell>
</template>

<style scoped>
.history {
  display: grid;
  gap: 28px;
}

.history__intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
}

.history__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--color-coral);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.history__eyebrow span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-coral);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-coral) 14%, transparent);
}

.history h1 {
  max-width: 700px;
  margin: 10px 0 0;
  color: var(--color-text);
  font-size: clamp(2.15rem, 5vw, 3.6rem);
  letter-spacing: -0.075em;
  line-height: 0.98;
}

.history__lede {
  max-width: 620px;
  margin: 16px 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.7;
}

.history__summary {
  display: flex;
  min-width: 190px;
  align-items: center;
  gap: 11px;
  padding: 15px 17px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  color: var(--color-coral);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.history__summary span {
  display: grid;
  gap: 3px;
}

.history__summary strong {
  color: var(--color-text);
  font-size: 12px;
}

.history__summary small {
  color: var(--color-text-muted);
  font-size: 10px;
}

.history__filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history__filters-label {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.history__filter-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.history__filter,
.history__filter-note {
  min-height: 40px;
  padding: 0 13px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--color-text-muted);
  background: transparent;
  font-size: 12px;
  font-weight: 800;
}

.history__filter {
  cursor: pointer;
}

.history__filter:hover {
  color: var(--color-text);
  background: var(--color-surface-strong);
}

.history__filter--active {
  color: #fff;
  border-color: #111b2e;
  background: #111b2e;
}

.history__filter:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-coral) 55%, transparent);
  outline-offset: 2px;
}

.history__filter-note {
  display: inline-flex;
  align-items: center;
  color: var(--color-text);
  border-color: var(--color-border);
  background: var(--color-surface);
}

.history__table-wrap,
.history__loading,
.history__empty,
.history__notice {
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.history__table-wrap {
  overflow: hidden;
}

.history__table {
  width: 100%;
  border-collapse: collapse;
  color: var(--color-text);
  font-size: 12px;
  table-layout: fixed;
}

.history__table th {
  padding: 16px 14px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-align: left;
  text-transform: uppercase;
}

.history__table th:first-child,
.history__table td:first-child {
  width: 25%;
  padding-left: 22px;
}

.history__table th:nth-child(2),
.history__table td:nth-child(2) {
  width: 11%;
}

.history__table th:nth-child(3),
.history__table td:nth-child(3) {
  width: 12%;
}

.history__table th:nth-child(4),
.history__table td:nth-child(4) {
  width: 12%;
}

.history__table th:nth-child(5),
.history__table td:nth-child(5),
.history__table th:nth-child(6),
.history__table td:nth-child(6) {
  width: 13%;
}

.history__table th:last-child,
.history__table td:last-child {
  width: 25%;
  padding-right: 22px;
}

.history__table td {
  padding: 19px 14px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
  overflow-wrap: anywhere;
}

.history__table tbody tr:last-child td {
  border-bottom: 0;
}

.history__nudge {
  display: grid;
  gap: 6px;
}

.history__nudge strong {
  font-size: 13px;
  letter-spacing: -0.02em;
}

.history__nudge span {
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-text-muted);
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.history__nudge small {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 750;
}

.history__platform-user {
  color: var(--color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
}

.history__duration {
  display: block;
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 750;
}

.history__type,
.history__status {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 850;
  white-space: nowrap;
}

.history__type--transactional {
  color: #b45309;
  background: #fef3c7;
}

.history__type--broadcast {
  color: #4338ca;
  background: #e0e7ff;
}

.history__status--completed {
  color: #047857;
  background: #d1fae5;
}

.history__status--processing,
.history__status--created {
  color: #a16207;
  background: #fef9c3;
}

.history__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history__stats li {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: var(--color-text-muted);
  font-size: 10px;
}

.history__stats strong {
  color: var(--color-text);
  font-size: 12px;
}

.history__reach {
  margin: 10px 0 0;
  color: var(--color-text-muted);
  font-size: 10px;
}

.history__loading {
  display: grid;
  gap: 1px;
  padding: 12px;
}

.history__loading-row {
  height: 78px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-text-muted) 13%, transparent);
  animation: history-pulse 1.4s ease-in-out infinite alternate;
}

@keyframes history-pulse {
  to { opacity: 0.45; }
}

.history__empty,
.history__notice {
  padding: clamp(30px, 6vw, 64px);
  text-align: center;
}

.history__empty-icon {
  display: grid;
  width: 52px;
  height: 52px;
  margin: 0 auto 18px;
  place-items: center;
  border-radius: 17px;
  color: var(--color-coral);
  background: color-mix(in srgb, var(--color-coral) 14%, transparent);
}

.history__empty h2,
.history__notice strong {
  margin: 0;
  color: var(--color-text);
  font-size: 18px;
}

.history__empty p,
.history__notice p {
  margin: 10px auto 0;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.history__notice--error {
  border-color: color-mix(in srgb, #ef4444 30%, var(--color-border));
}

.history__notice--error strong {
  color: #be123c;
}

.history__button {
  min-height: 48px;
  padding: 0 18px;
  border: 1px solid var(--color-border);
  border-radius: 13px;
  color: var(--color-text);
  background: var(--color-surface-strong);
  cursor: pointer;
  font-size: 12px;
  font-weight: 850;
}

.history__button:hover:not(:disabled) {
  border-color: var(--color-coral);
}

.history__button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.history__button--dark {
  margin-top: 18px;
  color: #fff;
  border-color: #111b2e;
  background: #111b2e;
}

.history__load-more,
.history__end {
  display: flex;
  justify-content: center;
  padding: 20px 22px 22px;
}

.history__end {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 11px;
}

.history__load-more-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 16px 22px 0;
  color: #be123c;
  font-size: 12px;
}

.history__text-button {
  color: inherit;
  background: transparent;
  cursor: pointer;
  font-weight: 850;
  text-decoration: underline;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1080px) {
  .history__table-wrap {
    overflow-x: auto;
  }

  .history__table {
    min-width: 980px;
  }
}

@media (max-width: 860px) {
  .history__intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .history__summary {
    min-width: 0;
  }

  .history__table-wrap {
    overflow: visible;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .history__table {
    display: block;
    min-width: 0;
  }

  .history__table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .history__table tbody,
  .history__table tr,
  .history__table td {
    display: block;
  }

  .history__table tr {
    margin-bottom: 14px;
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .history__table td,
  .history__table th:first-child,
  .history__table td:first-child,
  .history__table th:last-child,
  .history__table td:last-child {
    width: auto;
    padding: 14px 17px;
    border-bottom: 1px solid var(--color-border);
  }

  .history__table td:last-child {
    border-bottom: 0;
  }

  .history__table td::before {
    display: block;
    margin-bottom: 7px;
    color: var(--color-text-muted);
    content: attr(data-label);
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .history__nudge {
    gap: 5px;
  }

  .history__load-more,
  .history__end {
    border: 1px solid var(--color-border);
    border-radius: 20px;
    background: var(--color-surface);
  }
}

@media (max-width: 560px) {
  .history {
    gap: 22px;
  }

  .history__summary {
    width: 100%;
  }

  .history__filters {
    align-items: flex-start;
    flex-direction: column;
  }

  .history__filter-group {
    width: 100%;
  }

  .history__filter {
    flex: 1;
  }

  .history__load-more-error {
    align-items: flex-start;
    flex-direction: column;
    padding-inline: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history__loading-row {
    animation: none;
  }
}
</style>
