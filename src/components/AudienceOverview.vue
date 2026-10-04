<script setup lang="ts">
import { computed } from 'vue'

import { useAudienceOverview } from '../composables/useAudienceOverview'
import { formatMetric, formatPercent } from '../lib/audienceCharts'
import { useAuth } from '../composables/useAuth'
import type { AudiencePeriod } from '../types/audience'
import AudienceAreaChart from './AudienceAreaChart.vue'
import AudienceLineChart from './AudienceLineChart.vue'
import AudiencePieChart from './AudiencePieChart.vue'
import IconGlyph from './IconGlyph.vue'

type StatIcon = 'users' | 'send' | 'bell' | 'layers' | 'sparkles'

interface StatCard {
  label: string
  value: string
  helper: string
  icon: StatIcon
  tone: string
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

const statCards = computed<StatCard[]>(() => {
  const data = overview.value
  if (!data) {
    return []
  }

  const cards: StatCard[] = [
    {
      label: 'Active subscribers',
      value: formatMetric(data.active_subscribers),
      helper: 'People currently subscribed',
      icon: 'users',
      tone: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-200',
    },
    {
      label: 'New subscribers',
      value: formatMetric(data.new_subscribers),
      helper: `Added in ${selectedPeriod.value}`,
      icon: 'sparkles',
      tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-200',
    },
    {
      label: 'Unsubscribe rate',
      value: formatPercent(data.unsubscribe_rate),
      helper: `Across ${periodLabel.value.toLowerCase()}`,
      icon: 'send',
      tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-200',
    },
    {
      label: 'Muted subscribers',
      value: formatMetric(data.muted_subscribers),
      helper: 'Subscribed, but quiet for now',
      icon: 'bell',
      tone: 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-200',
    },
    {
      label: 'Reachable subscribers',
      value: formatMetric(data.reachable_subscribers),
      helper: 'Ready to receive a nudge',
      icon: 'users',
      tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200',
    },
    {
      label: 'Broadcast reach',
      value: formatMetric(data.broadcast_reach),
      helper: 'Eligible for announcements',
      icon: 'layers',
      tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-200',
    },
  ]

  if (profileType.value === 'platform') {
    cards.push({
      label: 'Transactional reach',
      value: formatMetric(data.transactional_reach ?? 0),
      helper: 'Eligible for service updates',
      icon: 'send',
      tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-200',
    })
  }

  return cards
})

function handleRetry(): void {
  void loadOverview(selectedPeriod.value)
}
</script>

<template>
  <section class="mt-10 space-y-6" aria-labelledby="audience-overview-heading">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-coral)]">Audience overview</p>
        <h2 id="audience-overview-heading" class="mt-2 text-3xl font-black tracking-[-0.06em] text-[var(--color-text)] sm:text-4xl">Know who is ready to hear from you.</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">A clear view of subscribers, reach, and audience movement. Insights refresh once every 24 hours.</p>
      </div>
      <div class="flex flex-col items-start gap-2 sm:items-end">
        <label for="audience-period" class="text-xs font-bold text-[var(--color-text-muted)]">Time period</label>
        <select id="audience-period" v-model="selectedPeriod" class="min-h-12 min-w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-text)] shadow-sm outline-none transition focus:border-[var(--color-coral)] focus:ring-4 focus:ring-orange-500/10">
          <option v-for="option in periodOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading && !overview" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading audience overview" aria-busy="true">
      <div v-for="index in 7" :key="index" class="h-36 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"></div>
    </div>

    <div v-else-if="errorMessage" class="rounded-2xl border border-rose-300/60 bg-rose-50 p-6 text-rose-900 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-100" role="alert">
      <p class="font-bold">Audience insights are unavailable.</p>
      <p class="mt-2 text-sm opacity-80">{{ errorMessage }}</p>
      <button type="button" class="mt-4 min-h-12 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-rose-500" @click="handleRetry">Try again</button>
    </div>

    <template v-else-if="overview">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Audience metrics" aria-live="polite">
        <article v-for="card in statCards" :key="card.label" class="min-h-36 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold text-[var(--color-text-muted)]">{{ card.label }}</p>
              <p class="mt-2 tabular-nums text-3xl font-black tracking-[-0.06em] text-[var(--color-text)]">{{ card.value }}</p>
            </div>
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl" :class="card.tone"><IconGlyph :name="card.icon" /></span>
          </div>
          <p class="mt-5 text-xs text-[var(--color-text-muted)]">{{ card.helper }}</p>
        </article>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <article class="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--color-coral)]">Audience growth</p>
              <h3 class="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--color-text)]">Active subscribers</h3>
            </div>
            <span class="text-xs font-semibold text-[var(--color-text-muted)]">{{ periodLabel }}</span>
          </div>
          <AudienceAreaChart :trend="overview.trend" :period="overview.period" />
        </article>

        <article class="min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div class="mb-6">
            <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--color-coral)]">Audience health</p>
            <h3 class="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--color-text)]">Who can hear you?</h3>
          </div>
          <AudiencePieChart
            :active-subscribers="overview.active_subscribers"
            :muted-subscribers="overview.muted_subscribers"
            :reachable-subscribers="overview.reachable_subscribers"
            :profile-type="overview.profile_type"
          />
        </article>
      </div>

      <article class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--color-coral)]">Subscriber movement</p>
            <h3 class="mt-2 text-xl font-black tracking-[-0.04em] text-[var(--color-text)]">New subscribers vs. unsubscribes</h3>
          </div>
          <span class="text-xs font-semibold text-[var(--color-text-muted)]">{{ periodLabel }}</span>
        </div>
        <AudienceLineChart :trend="overview.trend" :period="overview.period" />
      </article>

      <p class="text-right text-xs text-[var(--color-text-muted)]" role="status">Updated {{ updatedAtLabel }} · Refreshes daily</p>
    </template>
  </section>
</template>
