<script setup lang="ts">
import { computed } from 'vue'

import {
  CHART_HEIGHT,
  CHART_PADDING,
  CHART_WIDTH,
  createAreaPath,
  createLinePath,
  formatChartDate,
  formatMetric,
  scaleValues,
} from '../lib/audienceCharts'
import type { AudienceComparisonTrendPoint, AudiencePeriod } from '../types/audience'

interface Props {
  trend: AudienceComparisonTrendPoint[]
  period: AudiencePeriod
}

const props = defineProps<Props>()

const chartMaximum = computed(() => Math.max(
  ...props.trend.flatMap((point) => [point.active_subscribers, point.previous_active_subscribers]),
  1,
))
const currentScale = computed(() => scaleValues(
  props.trend.map((point) => point.active_subscribers),
  chartMaximum.value,
))
const previousScale = computed(() => scaleValues(
  props.trend.map((point) => point.previous_active_subscribers),
  chartMaximum.value,
))
const currentLinePath = computed(() => createLinePath(currentScale.value.points))
const currentAreaPath = computed(() => createAreaPath(currentScale.value.points))
const previousLinePath = computed(() => createLinePath(previousScale.value.points))
const firstDate = computed(() => props.trend[0]?.date
  ? formatChartDate(props.trend[0].date, props.period)
  : '')
const lastDate = computed(() => props.trend.at(-1)?.date
  ? formatChartDate(props.trend.at(-1)!.date, props.period)
  : '')
const firstCurrentValue = computed(() => props.trend[0]?.active_subscribers ?? 0)
const lastCurrentValue = computed(() => props.trend.at(-1)?.active_subscribers ?? 0)
const firstPreviousValue = computed(() => props.trend[0]?.previous_active_subscribers ?? 0)
const lastPreviousValue = computed(() => props.trend.at(-1)?.previous_active_subscribers ?? 0)
</script>

<template>
  <figure class="space-y-4" aria-labelledby="audience-area-caption">
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[var(--color-text-muted)]">
      <span class="inline-flex items-center gap-2">
        <i class="h-2.5 w-2.5 rounded-full bg-[var(--color-coral)]" aria-hidden="true"></i>
        Selected period
      </span>
      <span class="inline-flex items-center gap-2">
        <i class="h-2.5 w-2.5 rounded-full bg-indigo-400" aria-hidden="true"></i>
        Previous {{ period }}
      </span>
    </div>
    <svg class="h-64 w-full overflow-visible" :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="audience-total-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#ff6b4a" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#ff6b4a" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <line :x1="CHART_PADDING.left" :x2="CHART_WIDTH - CHART_PADDING.right" :y1="CHART_HEIGHT - CHART_PADDING.bottom" :y2="CHART_HEIGHT - CHART_PADDING.bottom" class="stroke-slate-200 dark:stroke-slate-700" stroke-width="1" />
      <path v-if="currentAreaPath" :d="currentAreaPath" fill="url(#audience-total-fill)" />
      <path v-if="previousLinePath" :d="previousLinePath" fill="none" stroke="#818cf8" stroke-dasharray="8 8" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" />
      <path v-if="currentLinePath" :d="currentLinePath" fill="none" stroke="#ff6b4a" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
      <circle v-if="currentScale.points.at(-1)" :cx="currentScale.points.at(-1)!.x" :cy="currentScale.points.at(-1)!.y" r="6" fill="#ff6b4a" stroke="white" stroke-width="3" />
      <text :x="CHART_PADDING.left" y="16" class="fill-slate-500 text-[14px] font-semibold">{{ formatMetric(chartMaximum) }}</text>
      <text :x="CHART_PADDING.left" :y="CHART_HEIGHT - 8" class="fill-slate-400 text-[13px]">{{ firstDate }}</text>
      <text :x="CHART_WIDTH - CHART_PADDING.right" :y="CHART_HEIGHT - 8" text-anchor="end" class="fill-slate-400 text-[13px]">{{ lastDate }}</text>
    </svg>
    <figcaption id="audience-area-caption" class="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
      <span>Total audience across matching windows</span>
      <span>{{ props.trend.length }} daily points</span>
    </figcaption>
    <p class="sr-only">
      The selected period changes from {{ formatMetric(firstCurrentValue) }} to {{ formatMetric(lastCurrentValue) }} subscribers. The previous matching period changes from {{ formatMetric(firstPreviousValue) }} to {{ formatMetric(lastPreviousValue) }} subscribers.
    </p>
    <ul class="sr-only">
      <li v-for="point in trend" :key="point.date">
        {{ point.date }}: {{ point.active_subscribers }} current, {{ point.previous_active_subscribers }} previous
      </li>
    </ul>
  </figure>
</template>
