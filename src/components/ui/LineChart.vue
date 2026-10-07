<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { buildAreaPath, buildLinePath, chartCoordinate, createChartScale, formatChartDate, type ChartDatum } from '../../lib/chartGeometry'

const props = defineProps<{
  points: ChartDatum[]
  currentLabel: string
  comparisonLabel?: string
}>()
const selectedIndex = ref(0)
const chartId = useId()
const exactNumber = new Intl.NumberFormat('en')
const axisNumber = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const hasComparison = computed(() => props.points.some(point => point.comparisonValue !== undefined))
const scale = computed(() => createChartScale(props.points.flatMap(point =>
  point.comparisonValue === undefined ? [point.value] : [point.value, point.comparisonValue],
)))
const ticks = computed(() => [...scale.value.ticks].reverse())
const currentPath = computed(() => buildLinePath(props.points.map(point => point.value), scale.value))
const comparisonPath = computed(() => buildLinePath(props.points.map(point => point.comparisonValue), scale.value))
const areaPath = computed(() => buildAreaPath(props.points.map(point => point.value), scale.value))
const selectedPoint = computed(() => props.points[selectedIndex.value])
const selectedCoordinate = computed(() => chartCoordinate(selectedIndex.value, props.points.length, selectedPoint.value?.value ?? 0, scale.value))
const comparisonCoordinate = computed(() => selectedPoint.value?.comparisonValue === undefined ? null : chartCoordinate(
  selectedIndex.value, props.points.length, selectedPoint.value.comparisonValue, scale.value,
))
const dateLabels = computed(() => [...new Set([0, Math.floor((props.points.length - 1) / 2), props.points.length - 1])]
  .filter(index => props.points[index]).map(index => formatChartDate(props.points[index].date)))
const selectedDescription = computed(() => {
  const point = selectedPoint.value
  if (!point) return 'No daily data available.'
  const comparison = point.comparisonValue === undefined ? '' : '. Previous period: ' + exactNumber.format(point.comparisonValue)
    + (point.comparisonDate ? ' on ' + formatChartDate(point.comparisonDate, true) : '')
  return formatChartDate(point.date, true) + ': ' + exactNumber.format(point.value) + ' ' + props.currentLabel.toLowerCase() + comparison
})

watch(() => props.points, points => { selectedIndex.value = Math.max(0, points.length - 1) }, { immediate: true })
</script>

<template>
  <figure class="ui-trend">
    <template v-if="selectedPoint">
      <figcaption class="ui-trend__readout">
        <span class="ui-trend__date">{{ formatChartDate(selectedPoint.date, true) }}</span>
        <div class="ui-trend__values">
          <span><i class="ui-trend__key" aria-hidden="true" /><strong>{{ exactNumber.format(selectedPoint.value) }}</strong><small>{{ currentLabel }}</small></span>
          <span v-if="hasComparison">
            <i class="ui-trend__key ui-trend__key--comparison" aria-hidden="true" />
            <strong>{{ selectedPoint.comparisonValue === undefined ? '—' : exactNumber.format(selectedPoint.comparisonValue) }}</strong>
            <small>{{ comparisonLabel || 'Previous period' }}</small>
          </span>
        </div>
      </figcaption>
      <div class="ui-trend__plot">
        <div class="ui-trend__axis" aria-hidden="true"><span v-for="tick in ticks" :key="tick">{{ axisNumber.format(tick) }}</span></div>
        <div class="ui-trend__canvas">
          <svg viewBox="0 0 600 180" preserveAspectRatio="none" class="ui-trend__svg" aria-hidden="true">
            <line v-for="tick in ticks" :key="tick" class="ui-trend__gridline" x1="8" x2="592" :y1="chartCoordinate(0, 1, tick, scale).y" :y2="chartCoordinate(0, 1, tick, scale).y" />
            <path class="ui-trend__area" :d="areaPath" />
            <path v-if="hasComparison" class="ui-trend__line ui-trend__line--comparison" :d="comparisonPath" vector-effect="non-scaling-stroke" />
            <path class="ui-trend__line" :d="currentPath" vector-effect="non-scaling-stroke" />
            <line class="ui-trend__cursor" :x1="selectedCoordinate.x" :x2="selectedCoordinate.x" y1="8" y2="172" />
            <circle v-if="comparisonCoordinate" class="ui-trend__point ui-trend__point--comparison" :cx="comparisonCoordinate.x" :cy="comparisonCoordinate.y" r="4" vector-effect="non-scaling-stroke" />
            <circle class="ui-trend__point" :cx="selectedCoordinate.x" :cy="selectedCoordinate.y" r="5" vector-effect="non-scaling-stroke" />
          </svg>
          <input
            v-model.number="selectedIndex"
            class="ui-trend__scrubber"
            type="range"
            min="0"
            :max="Math.max(0, points.length - 1)"
            step="1"
            :disabled="points.length < 2"
            :aria-label="'Explore daily ' + currentLabel.toLowerCase()"
            :aria-valuetext="selectedDescription"
            :aria-describedby="chartId"
          />
        </div>
      </div>
      <div class="ui-trend__dates" aria-hidden="true"><span v-for="label in dateLabels" :key="label">{{ label }}</span></div>
      <p :id="chartId" class="ui-trend__hint"><v-icon icon="mdi-gesture-swipe-horizontal" size="16" /> Slide across the graph to explore each day. Use arrow keys when focused.</p>
      <details class="ui-trend__details">
        <summary><v-icon icon="mdi-table" size="16" /> View daily values</summary>
        <div class="ui-trend__table-scroll">
          <table class="ui-trend__table">
            <caption class="ui-visually-hidden">{{ currentLabel }} daily values</caption>
            <thead><tr><th scope="col">Date</th><th scope="col">{{ currentLabel }}</th><th v-if="hasComparison" scope="col">Previous period</th></tr></thead>
            <tbody>
              <tr v-for="point in points" :key="point.date">
                <th scope="row">{{ formatChartDate(point.date) }}</th>
                <td>{{ exactNumber.format(point.value) }}</td>
                <td v-if="hasComparison">{{ point.comparisonValue === undefined ? '—' : exactNumber.format(point.comparisonValue) }}<small v-if="point.comparisonDate">{{ formatChartDate(point.comparisonDate) }}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </template>
    <div v-else class="ui-trend__empty"><v-icon icon="mdi-chart-line" size="32" /><strong>No daily data yet</strong><span>Your graph will appear as audience activity is recorded.</span></div>
  </figure>
</template>
