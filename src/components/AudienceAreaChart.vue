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
import type { AudiencePeriod, AudienceTrendPoint } from '../types/audience'

interface Props {
  trend: AudienceTrendPoint[]
  period: AudiencePeriod
}

const props = defineProps<Props>()
const scale = computed(() => scaleValues(props.trend.map((point) => point.active_subscribers)))
const linePath = computed(() => createLinePath(scale.value.points))
const areaPath = computed(() => createAreaPath(scale.value.points))
const firstDate = computed(() => props.trend[0]?.date ? formatChartDate(props.trend[0].date, props.period) : '')
const lastDate = computed(() => props.trend.at(-1)?.date ? formatChartDate(props.trend.at(-1)!.date, props.period) : '')
</script>

<template>
  <figure class="space-y-4" aria-labelledby="audience-area-title">
    <div class="sr-only" id="audience-area-title">Active subscribers over time</div>
    <svg class="h-60 w-full overflow-visible" :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`" role="img" aria-label="Area chart showing active subscribers over the selected period">
      <defs>
        <linearGradient id="audience-area-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#ff6b4a" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#ff6b4a" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <line :x1="CHART_PADDING.left" :x2="CHART_WIDTH - CHART_PADDING.right" :y1="CHART_HEIGHT - CHART_PADDING.bottom" :y2="CHART_HEIGHT - CHART_PADDING.bottom" class="stroke-slate-200 dark:stroke-slate-700" stroke-width="1" />
      <path v-if="areaPath" :d="areaPath" fill="url(#audience-area-fill)" />
      <path v-if="linePath" :d="linePath" fill="none" stroke="#ff6b4a" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
      <circle v-if="scale.points.at(-1)" :cx="scale.points.at(-1)!.x" :cy="scale.points.at(-1)!.y" r="6" fill="#ff6b4a" stroke="white" stroke-width="3" />
      <text :x="CHART_PADDING.left" y="16" class="fill-slate-500 text-[14px] font-semibold">{{ formatMetric(scale.maxValue) }}</text>
      <text :x="CHART_PADDING.left" :y="CHART_HEIGHT - 8" class="fill-slate-400 text-[13px]">{{ firstDate }}</text>
      <text :x="CHART_WIDTH - CHART_PADDING.right" :y="CHART_HEIGHT - 8" text-anchor="end" class="fill-slate-400 text-[13px]">{{ lastDate }}</text>
    </svg>
    <figcaption class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
      <span>Active audience trend</span>
      <span>{{ props.trend.length }} daily points</span>
    </figcaption>
    <ul class="sr-only">
      <li v-for="point in trend" :key="point.date">{{ point.date }}: {{ point.active_subscribers }} active subscribers</li>
    </ul>
  </figure>
</template>
