<script setup lang="ts">
import { computed } from 'vue'

import { formatMetric } from '../lib/audienceCharts'
import type { AudienceBreakdown } from '../types/audience'

interface Props {
  profileType: 'creator' | 'platform'
  totalAudience: number
  breakdown: AudienceBreakdown
}

interface BreakdownSegment {
  label: string
  value: number
  tone: string
}

interface BreakdownGroup {
  label: string
  total: number
  segments: BreakdownSegment[]
}

const props = defineProps<Props>()

const breakdownGroups = computed<BreakdownGroup[]>(() => {
  if (props.profileType === 'creator') {
    return [
      {
        label: 'Broadcast delivery',
        total: props.totalAudience,
        segments: [
          { label: 'Ready to receive', value: props.breakdown.reachable_subscribers, tone: 'bg-[var(--color-coral)]' },
          { label: 'Muted', value: props.breakdown.muted_subscribers, tone: 'bg-indigo-400' },
        ],
      },
    ]
  }

  return [
    {
      label: 'Broadcast preferences',
      total: (props.breakdown.broadcast_subscribed ?? 0) + (props.breakdown.broadcast_unsubscribed ?? 0),
      segments: [
        { label: 'Subscribed', value: props.breakdown.broadcast_subscribed ?? 0, tone: 'bg-[var(--color-coral)]' },
        { label: 'Not subscribed', value: props.breakdown.broadcast_unsubscribed ?? 0, tone: 'bg-slate-300 dark:bg-slate-600' },
      ],
    },
    {
      label: 'Transactional preferences',
      total: (props.breakdown.transactional_subscribed ?? 0) + (props.breakdown.transactional_unsubscribed ?? 0),
      segments: [
        { label: 'Subscribed', value: props.breakdown.transactional_subscribed ?? 0, tone: 'bg-sky-500' },
        { label: 'Not subscribed', value: props.breakdown.transactional_unsubscribed ?? 0, tone: 'bg-slate-300 dark:bg-slate-600' },
      ],
    },
  ]
})

const mutedLabel = computed(() => `${formatMetric(props.breakdown.muted_subscribers)} muted`)
</script>

<template>
  <figure class="space-y-5" aria-labelledby="audience-breakdown-title">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div id="audience-breakdown-title" class="text-sm font-bold text-[var(--color-text)]">Notification preferences</div>
        <p class="mt-1 text-xs text-[var(--color-text-muted)]">Grouped by the way subscribers want to hear from you.</p>
      </div>
      <span class="rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-200">{{ mutedLabel }}</span>
    </div>

    <div class="grid gap-5" :class="profileType === 'platform' ? 'md:grid-cols-2' : 'grid-cols-1'">
      <div v-for="group in breakdownGroups" :key="group.label" class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/60 p-4" role="group" :aria-label="group.label">
        <div class="flex items-center justify-between gap-3 text-sm">
          <span class="font-bold text-[var(--color-text)]">{{ group.label }}</span>
          <span class="tabular-nums text-xs font-bold text-[var(--color-text-muted)]">{{ formatMetric(group.total) }} total</span>
        </div>
        <div class="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" :aria-label="`${group.label}: ${group.segments.map((segment) => `${segment.label} ${segment.value}`).join(', ')}`">
          <span v-for="segment in group.segments" :key="segment.label" class="h-full transition-[width] duration-300" :class="segment.tone" :style="{ width: `${group.total > 0 ? (segment.value / group.total) * 100 : 0}%` }"></span>
        </div>
        <div class="mt-3 grid gap-2 text-xs text-[var(--color-text-muted)]">
          <div v-for="segment in group.segments" :key="segment.label" class="flex items-center justify-between gap-3">
            <span class="inline-flex items-center gap-2">
              <i class="h-2.5 w-2.5 rounded-full" :class="segment.tone" aria-hidden="true"></i>
              {{ segment.label }}
            </span>
            <strong class="tabular-nums text-[var(--color-text)]">{{ formatMetric(segment.value) }}</strong>
          </div>
        </div>
      </div>
    </div>

    <ul class="sr-only">
      <li v-for="group in breakdownGroups" :key="group.label">{{ group.label }}: {{ group.segments.map((segment) => `${segment.label} ${segment.value}`).join(', ') }}</li>
    </ul>
  </figure>
</template>
