<script setup lang="ts">
import { computed } from 'vue'

import {
  CHART_HEIGHT,
  CHART_PADDING,
  CHART_WIDTH,
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
const scale = computed(() => {
  const values = props.trend.flatMap((point) => [point.new_subscribers, point.unsubscribed_users])
  return scaleValues(values.length > 0 ? values : [0])
})
const newSubscriberPath = computed(() => createLinePath(scaleValues(props.trend.map((point) => point.new_subscribers), scale.value.maxValue).points))
const unsubscribePath = computed(() => createLinePath(scaleValues(props.trend.map((point) => point.unsubscribed_users), scale.value.maxValue).points))
const firstDate = computed(() => props.trend[0]?.date ? formatChartDate(props.trend[0].date, props.period) : '')
const lastDate = computed(() => props.trend.at(-1)?.date ? formatChartDate(props.trend.at(-1)!.date, props.period) : '')
</script>

<template>
  <figure class="space-y-4" aria-labelledby="audience-line-title">
    <div class="sr-only" id="audience-line-title">New subscribers and unsubscribes over time</div>
    <div class="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400" aria-label="Chart legend">
      <span class="inline-flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-indigo-500" aria-hidden="true"></i>New subscribers</span>
      <span class="inline-flex items-center gap-2"><i class="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true"></i>Unsubscribed</span>
    </div>
    <svg class="h-52 w-full overflow-visible" :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`" role="img" aria-label="Line chart comparing new subscribers and unsubscribes">
      <line :x1="CHART_PADDING.left" :x2="CHART_WIDTH - CHART_PADDING.right" :y1="CHART_HEIGHT - CHART_PADDING.bottom" :y2="CHART_HEIGHT - CHART_PADDING.bottom" class="stroke-slate-200 dark:stroke-slate-700" stroke-width="1" />
      <path v-if="newSubscriberPath" :d="newSubscriberPath" fill="none" stroke="#6366f1" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" />
      <path v-if="unsubscribePath" :d="unsubscribePath" fill="none" stroke="#fb7185" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" stroke-dasharray="7 7" />
      <text :x="CHART_PADDING.left" y="16" class="fill-slate-500 text-[14px] font-semibold">{{ formatMetric(scale.maxValue) }}</text>
      <text :x="CHART_PADDING.left" :y="CHART_HEIGHT - 8" class="fill-slate-400 text-[13px]">{{ firstDate }}</text>
      <text :x="CHART_WIDTH - CHART_PADDING.right" :y="CHART_HEIGHT - 8" text-anchor="end" class="fill-slate-400 text-[13px]">{{ lastDate }}</text>
    </svg>
    <figcaption class="text-xs text-slate-500 dark:text-slate-400">Subscriber movement in the selected period.</figcaption>
    <ul class="sr-only">
      <li v-for="point in trend" :key="point.date">{{ point.date }}: {{ point.new_subscribers }} new, {{ point.unsubscribed_users }} unsubscribed</li>
    </ul>
  </figure>
</template>
