<script setup lang="ts">
import { computed } from 'vue'

import { formatMetric } from '../lib/audienceCharts'

interface Props {
  activeSubscribers: number
  mutedSubscribers: number
  reachableSubscribers: number
  profileType: 'creator' | 'platform'
}

const props = defineProps<Props>()
const radius = 72
const circumference = 2 * Math.PI * radius
const segments = computed(() => {
  const preferenceOff = Math.max(props.activeSubscribers - props.mutedSubscribers - props.reachableSubscribers, 0)
  const values = [
    { label: 'Reachable', value: props.reachableSubscribers, color: '#ff6b4a' },
    { label: 'Muted', value: props.mutedSubscribers, color: '#6366f1' },
    ...(props.profileType === 'platform' ? [{ label: 'Preferences off', value: preferenceOff, color: '#cbd5e1' }] : []),
  ]
  const total = Math.max(props.activeSubscribers, 1)
  let offset = 0
  return values.map((segment) => {
    const length = (segment.value / total) * circumference
    const result = { ...segment, length, offset }
    offset -= length
    return result
  })
})
</script>

<template>
  <figure class="flex flex-col items-center gap-6 sm:flex-row sm:items-center" aria-labelledby="audience-pie-caption">
    <div class="relative h-44 w-44 shrink-0">
      <svg class="h-full w-full -rotate-90" viewBox="0 0 180 180" aria-hidden="true" focusable="false">
        <circle cx="90" cy="90" :r="radius" fill="none" class="stroke-slate-100 dark:stroke-slate-800" stroke-width="24" />
        <circle
          v-for="segment in segments"
          :key="segment.label"
          cx="90"
          cy="90"
          :r="radius"
          fill="none"
          :stroke="segment.color"
          :stroke-dasharray="`${segment.length} ${circumference - segment.length}`"
          :stroke-dashoffset="segment.offset"
          stroke-width="24"
        />
      </svg>
      <div class="absolute inset-0 grid place-content-center text-center">
        <strong class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{{ formatMetric(activeSubscribers) }}</strong>
        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">active</span>
      </div>
    </div>
    <figcaption id="audience-pie-caption" class="grid w-full gap-3 text-sm">
      <span class="sr-only">Audience notification reach breakdown</span>
      <div v-for="segment in segments" :key="segment.label" class="flex items-center justify-between gap-4">
        <span class="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <i class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: segment.color }" aria-hidden="true"></i>
          {{ segment.label }}
        </span>
        <strong class="tabular-nums text-slate-900 dark:text-white">{{ formatMetric(segment.value) }}</strong>
      </div>
    </figcaption>
  </figure>
</template>
