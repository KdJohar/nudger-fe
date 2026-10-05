<script setup lang="ts">
import { computed } from 'vue'

import { useAuth } from '../composables/useAuth'
import { useAudienceOverview } from '../composables/useAudienceOverview'
import {
  compareMetric,
  formatDelta,
  formatMetric,
  formatPercent,
  formatRelativeChange,
} from '../lib/audienceCharts'
import type { AudiencePeriod, AudienceSnapshot } from '../types/audience'
import AudienceAreaChart from './AudienceAreaChart.vue'
import AudienceBreakdownChart from './AudienceBreakdownChart.vue'
import AudienceLineChart from './AudienceLineChart.vue'
import AudiencePieChart from './AudiencePieChart.vue'

interface ComparisonRow {
  label: string
  current: number
  previous: number
  tone: string
  isRate?: boolean
  isInverse?: boolean
}

const periodOptions: Array<{ value: AudiencePeriod; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const { state } = useAuth()
const {
  selectedPeriod,
  overview,
  isLoading,
  errorMessage,
  loadOverview,
} = useAudienceOverview()

const profileType = computed(() => overview.value?.profile_type ?? state.merchantProfile?.profile_type ?? 'creator')
const periodLabel = computed(() => periodOptions.find((option) => option.value === selectedPeriod.value)?.label ?? 'Selected period')
const currentSnapshot = computed<AudienceSnapshot | null>(() => overview.value?.comparison.current ?? null)
const previousSnapshot = computed<AudienceSnapshot | null>(() => overview.value?.comparison.previous ?? null)
const totalComparison = computed(() => compareMetric(
  currentSnapshot.value?.total_audience ?? 0,
  previousSnapshot.value?.total_audience ?? 0,
))
const updatedAtLabel = computed(() => {
  if (!overview.value) {
    return ''
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(overview.value.generated_at))
})

const comparisonRows = computed<ComparisonRow[]>(() => {
  const current = currentSnapshot.value
  const previous = previousSnapshot.value
  if (!current || !previous) {
    return []
  }

  return [
    {
      label: 'New subscribers',
      current: current.new_subscribers,
      previous: previous.new_subscribers,
      tone: 'bg-indigo-500',
    },
    {
      label: 'Unsubscribed',
      current: current.unsubscribed_users,
      previous: previous.unsubscribed_users,
      tone: 'bg-rose-400',
      isInverse: true,
    },
    {
      label: 'Unsubscribe rate',
      current: current.unsubscribe_rate,
      previous: previous.unsubscribe_rate,
      tone: 'bg-slate-400',
      isRate: true,
      isInverse: true,
    },
  ]
})

const pulseRows = computed<ComparisonRow[]>(() => {
  const current = currentSnapshot.value
  const previous = previousSnapshot.value
  if (!current || !previous) {
    return []
  }

  const rows: ComparisonRow[] = [
    {
      label: 'Reachable subscribers',
      current: current.reachable_subscribers,
      previous: previous.reachable_subscribers,
      tone: 'bg-emerald-500',
    },
    {
      label: 'Broadcast reach',
      current: current.broadcast_reach,
      previous: previous.broadcast_reach,
      tone: 'bg-[var(--color-coral)]',
    },
  ]

  if (profileType.value === 'platform' && current.transactional_reach !== null && previous.transactional_reach !== null) {
    rows.push({
      label: 'Transactional reach',
      current: current.transactional_reach,
      previous: previous.transactional_reach,
      tone: 'bg-sky-500',
    })
  }

  return rows
})

function formatComparison(row: ComparisonRow): string {
  if (row.isRate) {
    const delta = row.current - row.previous
    if (delta === 0) {
      return 'No change'
    }
    return `${delta > 0 ? '+' : ''}${formatPercent(delta)} pp`
  }
  return formatRelativeChange(compareMetric(row.current, row.previous).relativeChange)
}

function comparisonTone(row: ComparisonRow): string {
  const delta = row.current - row.previous
  if (delta === 0) {
    return 'text-[var(--color-text-muted)]'
  }
  const isPositive = row.isInverse ? delta < 0 : delta > 0
  return isPositive ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
}

function comparisonDirection(row: ComparisonRow): string {
  const delta = row.current - row.previous
  if (delta === 0) {
    return 'No change'
  }
  return row.isInverse
    ? delta < 0 ? 'Improved' : 'Increased'
    : delta > 0 ? 'Increased' : 'Decreased'
}

function handleRetry(): void {
  void loadOverview(selectedPeriod.value)
}
</script>

<template>
  <section class="mt-10 space-y-5" aria-labelledby="audience-overview-heading">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-coral)]">Audience overview</p>
        <h2 id="audience-overview-heading" class="mt-2 max-w-3xl text-3xl font-black tracking-[-0.06em] text-[var(--color-text)] sm:text-4xl">See who is ready to hear from you.</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">Compare audience movement and notification preferences in one focused view. Insights refresh every 24 hours.</p>
      </div>
      <div class="flex flex-col items-start gap-2 sm:items-end">
        <label for="audience-period" class="text-xs font-bold text-[var(--color-text-muted)]">Compare periods</label>
        <select id="audience-period" v-model="selectedPeriod" class="min-h-12 min-w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-text)] shadow-sm outline-none transition focus:border-[var(--color-coral)] focus:ring-4 focus:ring-orange-500/10">
          <option v-for="option in periodOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading && !overview" class="grid gap-4 lg:grid-cols-12" aria-label="Loading audience overview" aria-busy="true">
      <div class="h-[30rem] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] lg:col-span-8 animate-pulse"></div>
      <div class="h-[30rem] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] lg:col-span-4 animate-pulse"></div>
      <div class="h-72 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] lg:col-span-8 animate-pulse"></div>
      <div class="h-72 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] lg:col-span-4 animate-pulse"></div>
    </div>

    <div v-else-if="errorMessage" class="rounded-3xl border border-rose-300/60 bg-rose-50 p-6 text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100" role="alert">
      <p class="font-bold">Audience insights are unavailable.</p>
      <p class="mt-2 text-sm opacity-80">{{ errorMessage }}</p>
      <button type="button" class="mt-4 min-h-12 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-rose-500" @click="handleRetry">Try again</button>
    </div>

    <template v-else-if="overview && currentSnapshot && previousSnapshot">
      <div class="grid gap-4 lg:grid-cols-12">
        <article class="min-w-0 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-8" aria-labelledby="total-audience-heading">
          <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--color-coral)]">Total audience</p>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <h3 id="total-audience-heading" class="tabular-nums text-5xl font-black tracking-[-0.08em] text-[var(--color-text)] sm:text-6xl">{{ formatMetric(currentSnapshot.total_audience) }}</h3>
                <span class="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold" :class="comparisonTone({ label: 'total', current: totalComparison.current, previous: totalComparison.previous, tone: '' })">
                  {{ formatDelta(totalComparison.delta) }} · {{ formatRelativeChange(totalComparison.relativeChange) }}
                </span>
              </div>
              <p class="mt-2 text-sm text-[var(--color-text-muted)]">{{ periodLabel }} compared with the previous matching window.</p>
            </div>
            <div class="grid min-w-0 gap-3 sm:min-w-[20rem]">
              <div v-for="row in comparisonRows" :key="row.label" class="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 text-sm">
                <i class="h-2.5 w-2.5 rounded-full" :class="row.tone" aria-hidden="true"></i>
                <span class="truncate text-[var(--color-text-muted)]">{{ row.label }}</span>
                <strong class="tabular-nums text-[var(--color-text)]">{{ row.isRate ? formatPercent(row.current) : formatMetric(row.current) }}</strong>
                <span class="text-right text-xs font-bold" :class="comparisonTone(row)" :aria-label="`${comparisonDirection(row)} compared with the previous period`">{{ formatComparison(row) }}</span>
              </div>
            </div>
          </div>
          <div class="mt-8 rounded-2xl bg-[var(--color-background)]/60 px-2 py-4 sm:px-4">
            <AudienceAreaChart :trend="overview.comparison_trend" :period="overview.period" />
          </div>
        </article>

        <article class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-4" aria-labelledby="audience-pulse-heading">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--color-coral)]">Audience pulse</p>
              <h3 id="audience-pulse-heading" class="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--color-text)]">What changed</h3>
            </div>
            <span class="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-text-muted)]">{{ selectedPeriod }}</span>
          </div>
          <div class="mt-7 divide-y divide-[var(--color-border)]">
            <div v-for="row in pulseRows" :key="row.label" class="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
              <div class="flex min-w-0 items-center gap-3">
                <i class="h-2.5 w-2.5 shrink-0 rounded-full" :class="row.tone" aria-hidden="true"></i>
                <span class="truncate text-sm text-[var(--color-text-muted)]">{{ row.label }}</span>
              </div>
              <div class="text-right">
                <strong class="block tabular-nums text-lg font-black text-[var(--color-text)]">{{ formatMetric(row.current) }}</strong>
                <span class="text-xs font-bold" :class="comparisonTone(row)">{{ formatComparison(row) }}</span>
              </div>
            </div>
          </div>
          <div class="mt-7 rounded-2xl bg-[var(--color-background)]/70 p-4">
            <p class="text-xs font-bold text-[var(--color-text-muted)]">Current reach</p>
            <div class="mt-3 flex items-end justify-between gap-3">
              <strong class="tabular-nums text-3xl font-black tracking-[-0.06em] text-[var(--color-text)]">{{ formatMetric(currentSnapshot.reachable_subscribers) }}</strong>
              <span class="text-right text-xs text-[var(--color-text-muted)]">of {{ formatMetric(currentSnapshot.total_audience) }} active</span>
            </div>
          </div>
        </article>

        <article class="min-w-0 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-8" aria-labelledby="audience-breakdown-heading">
          <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--color-coral)]">Audience bifurcation</p>
              <h3 id="audience-breakdown-heading" class="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--color-text)]">Notification preferences at a glance</h3>
            </div>
            <span class="text-xs font-semibold text-[var(--color-text-muted)]">{{ profileType === 'platform' ? 'Platform audience' : 'Creator audience' }}</span>
          </div>
          <AudienceBreakdownChart :profile-type="profileType" :total-audience="currentSnapshot.total_audience" :breakdown="overview.breakdown" />
        </article>

        <article class="min-w-0 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-4" aria-labelledby="reach-mix-heading">
          <div class="mb-6">
            <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--color-coral)]">Reach mix</p>
            <h3 id="reach-mix-heading" class="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--color-text)]">Who can hear you?</h3>
          </div>
          <AudiencePieChart :active-subscribers="currentSnapshot.total_audience" :muted-subscribers="currentSnapshot.muted_subscribers" :reachable-subscribers="currentSnapshot.reachable_subscribers" :profile-type="profileType" />
        </article>

        <article class="min-w-0 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7 lg:col-span-12" aria-labelledby="movement-heading">
          <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--color-coral)]">Subscriber movement</p>
              <h3 id="movement-heading" class="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--color-text)]">New subscribers vs. unsubscribes</h3>
            </div>
            <span class="text-xs font-semibold text-[var(--color-text-muted)]">{{ periodLabel }}</span>
          </div>
          <AudienceLineChart :trend="overview.trend" :period="overview.period" />
        </article>
      </div>

      <p class="text-right text-xs text-[var(--color-text-muted)]" role="status">Updated {{ updatedAtLabel }} · Refreshes daily</p>
    </template>
  </section>
</template>
