<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAudienceOverview } from '../../composables/useAudienceOverview'
import { compareMetric, formatDelta, formatMetric, formatPercent } from '../../lib/audienceCharts'
import { formatChartDate, type ChartDatum } from '../../lib/chartGeometry'
import type { AudiencePeriod } from '../../types/audience'
import MetricCard from '../ui/MetricCard.vue'
import LineChart from '../ui/LineChart.vue'
import { usePagePresentation } from '../../composables/usePageLayout'

const { period, overview, isLoading, errorMessage, loadOverview } = useAudienceOverview('30d')
const graphMode = ref<'audience' | 'new'>('audience')
const periodOptions: { title: string; value: AudiencePeriod }[] = [
  { title: '7 days', value: '7d' },
  { title: '30 days', value: '30d' },
  { title: '90 days', value: '90d' },
]
const exactNumber = new Intl.NumberFormat('en')
const displayedPeriod = computed(() => overview.value?.period ?? period.value)
const periodLabel = computed(() => displayedPeriod.value.slice(0, -1) + ' days')
const reachPercent = computed(() => overview.value?.total_audience
  ? Math.min(100, Math.max(0, overview.value.reachable_subscribers / overview.value.total_audience * 100)) : 0)
const mutedPercent = computed(() => overview.value?.total_audience
  ? overview.value.muted_subscribers / overview.value.total_audience * 100 : 0)
const dateRange = computed(() => {
  const trend = overview.value?.trend
  return trend?.length ? formatChartDate(trend[0].date) + ' – ' + formatChartDate(trend[trend.length - 1].date) : 'Last ' + periodLabel.value
})
const updatedAt = computed(() => {
  const date = new Date(overview.value?.generated_at ?? '')
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(date)
})

function describeChange(current: number, previous: number): { text: string; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { text: current === 0 ? 'No change' : 'New this period', direction: 'flat' }
  const change = compareMetric(current, previous)
  return { text: change.direction === 'flat' ? 'No change' : formatDelta(change.value), direction: change.direction }
}

const metricItems = computed(() => {
  const summary = overview.value
  if (!summary) return []
  const totalChange = describeChange(summary.total_audience, summary.comparison.previous.total_audience)
  const newChange = describeChange(summary.new_subscribers, summary.comparison.previous.new_subscribers)
  return [
    { label: 'Total audience', value: summary.total_audience, icon: 'mdi-account-multiple-outline', tone: 'primary' as const, change: totalChange.text, direction: totalChange.direction, detail: 'vs previous ' + periodLabel.value },
    { label: 'New subscribers', value: summary.new_subscribers, icon: 'mdi-account-plus-outline', tone: 'secondary' as const, change: newChange.text, direction: newChange.direction, detail: 'vs previous ' + periodLabel.value },
    { label: 'Reachable', value: summary.reachable_subscribers, icon: 'mdi-broadcast', tone: 'success' as const, change: '', direction: 'flat' as const, detail: formatPercent(reachPercent.value) + ' of your audience' },
    { label: 'Muted', value: summary.muted_subscribers, icon: 'mdi-bell-off-outline', tone: 'neutral' as const, change: '', direction: 'flat' as const, detail: formatPercent(mutedPercent.value) + ' of your audience' },
  ]
})
const chartPoints = computed<ChartDatum[]>(() => {
  const summary = overview.value
  if (!summary) return []
  if (graphMode.value === 'new') return summary.trend.map(point => ({ date: point.date, value: point.new_subscribers }))
  const comparisons = new Map(summary.comparison_trend.map(point => [point.date, point]))
  return summary.trend.map(point => ({
    date: point.date,
    value: point.active_subscribers,
    comparisonValue: comparisons.get(point.date)?.previous_active_subscribers,
    comparisonDate: comparisons.get(point.date)?.previous_date,
  }))
})
const statusMessage = computed(() => isLoading.value
  ? 'Loading audience for the last ' + period.value.slice(0, -1) + ' days.'
  : errorMessage.value ? 'Could not refresh audience.' : 'Audience updated. Showing the last ' + periodLabel.value + '.')
usePagePresentation(() => ({
  filter: {
    label: 'Audience time window',
    items: periodOptions,
    modelValue: period.value,
    onSelect(value) {
      const option = periodOptions.find(item => item.value === value)
      if (option) period.value = option.value
    },
  },
  metadata: [
    ...(updatedAt.value ? [{ label: 'Updated ' + updatedAt.value, icon: 'mdi-clock-outline' }] : []),
    { label: isLoading.value && overview.value ? 'Updating…' : dateRange.value, icon: 'mdi-calendar-range-outline' },
  ],
}))
</script>

<template>
  <div class="ui-insights">
    <p class="ui-visually-hidden" role="status">{{ statusMessage }}</p>

    <v-alert v-if="errorMessage" class="ui-insights__notice" type="error" variant="tonal" role="alert">
      <p>{{ errorMessage }}</p>
      <p v-if="overview">Still showing the last {{ periodLabel }}. Try again to load your selected window.</p>
      <v-btn class="ui-insights__retry" variant="text" @click="loadOverview">Try again</v-btn>
    </v-alert>

    <div v-if="isLoading && !overview" class="ui-insights__loading" aria-label="Loading audience" aria-busy="true">
      <div class="ui-insights__metrics"><v-skeleton-loader v-for="item in 4" :key="item" class="ui-stat" type="list-item-two-line" /></div>
      <v-skeleton-loader class="ui-insights__chart-placeholder" type="card" />
    </div>

    <div v-else-if="overview" class="ui-insights__content" :aria-busy="isLoading">
      <p v-if="overview.total_audience === 0" class="ui-insights__notice">Your audience starts here. These insights will grow as people subscribe to your profile.</p>
      <div class="ui-insights__metrics" aria-label="Audience summary">
        <MetricCard
          v-for="item in metricItems"
          :key="item.label"
          :label="item.label"
          :value="formatMetric(item.value)"
          :exact-value="exactNumber.format(item.value)"
          :icon="item.icon"
          :tone="item.tone"
          :change="item.change"
          :change-direction="item.direction"
          :detail="item.detail"
        />
      </div>

      <div class="ui-insights__grid">
        <article class="ui-panel ui-insights__chart">
          <div class="ui-panel__heading">
            <div><h2 class="ui-panel__title">{{ graphMode === 'audience' ? 'Audience growth' : 'New subscribers' }}</h2><p class="ui-panel__description">Daily {{ graphMode === 'audience' ? 'active subscribers' : 'new subscriptions' }} · last {{ periodLabel }}</p></div>
            <v-progress-circular v-if="isLoading" color="secondary" size="20" width="2" indeterminate aria-label="Updating graph" />
          </div>
          <div class="ui-segmented-control" role="group" aria-label="Graph metric">
            <button type="button" :aria-pressed="graphMode === 'audience'" @click="graphMode = 'audience'"><v-icon icon="mdi-chart-line" size="17" />Audience</button>
            <button type="button" :aria-pressed="graphMode === 'new'" @click="graphMode = 'new'"><v-icon icon="mdi-account-plus-outline" size="17" />New subscribers</button>
          </div>
          <LineChart :points="chartPoints" :current-label="graphMode === 'audience' ? 'Subscribers' : 'New subscribers'" comparison-label="Previous period" />
        </article>

        <aside class="ui-insights__support" aria-label="Audience delivery summary">
          <article class="ui-panel">
            <div class="ui-panel__heading"><h2 class="ui-panel__title">Ready to reach</h2><v-icon icon="mdi-broadcast" size="20" /></div>
            <div class="ui-summary-value"><strong>{{ formatPercent(reachPercent) }}</strong><span>of your audience is reachable</span></div>
            <v-progress-linear :model-value="reachPercent" color="secondary" height="8" rounded aria-label="Reachable share of your audience" />
            <dl class="ui-detail-list">
              <div><dt><v-icon icon="mdi-bell-check-outline" size="17" />Reachable</dt><dd>{{ exactNumber.format(overview.reachable_subscribers) }}</dd></div>
              <div><dt><v-icon icon="mdi-bell-off-outline" size="17" />Muted</dt><dd>{{ exactNumber.format(overview.muted_subscribers) }}</dd></div>
              <div><dt><v-icon icon="mdi-account-minus-outline" size="17" />Unsubscribed <small>in {{ periodLabel }}</small></dt><dd>{{ exactNumber.format(overview.comparison.current.unsubscribed_users) }}</dd></div>
            </dl>
          </article>
          <article class="ui-panel">
            <h2 class="ui-panel__title">Delivery reach</h2>
            <p class="ui-panel__description">Subscribers open to each type of nudge.</p>
            <div class="ui-channel-grid">
              <div class="ui-channel-grid__item"><v-icon icon="mdi-bullhorn-outline" size="20" /><strong :title="exactNumber.format(overview.broadcast_reach)">{{ formatMetric(overview.broadcast_reach) }}</strong><span>Broadcast</span></div>
              <div v-if="overview.profile_type === 'platform' && overview.transactional_reach !== undefined" class="ui-channel-grid__item"><v-icon icon="mdi-message-processing-outline" size="20" /><strong :title="exactNumber.format(overview.transactional_reach)">{{ formatMetric(overview.transactional_reach) }}</strong><span>Transactional</span></div>
            </div>
            <p v-if="overview.profile_type === 'platform'" class="ui-panel__footnote">People can subscribe to both types.</p>
          </article>
        </aside>
      </div>
    </div>
  </div>
</template>
