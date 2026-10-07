<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAudienceOverview } from '../composables/useAudienceOverview'
import { formatMetric, formatPercent } from '../lib/audienceCharts'
import { useAuth } from '../composables/useAuth'
import SnackbarFeedback from '../components/ui/SnackbarFeedback.vue'

const router = useRouter()
const { displayName, state } = useAuth()
const { overview, isLoading, errorMessage, loadOverview } = useAudienceOverview('30d')
const firstName = computed(() => displayName.value.split(' ')[0])
const today = computed(() => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()))
</script>

<template>
  <section class="dashboard page-view">
    <div class="dashboard__welcome"><div><div class="section-header__eyebrow">{{ today }}</div><h1 class="dashboard__title">Good to see you, {{ firstName }}.</h1><p class="dashboard__description">Here is the clearest signal from your Nudger workspace today.</p></div><v-btn color="primary" prepend-icon="mdi-send-outline" to="/compose">Create a nudge</v-btn></div>
    <SnackbarFeedback :message="errorMessage" action-text="Try again" :is-action-disabled="isLoading" @action="loadOverview" />
    <div v-if="isLoading" class="dashboard__loading"><v-skeleton-loader v-for="item in 3" :key="item" class="surface-card" type="card" /></div>
    <template v-else-if="overview">
      <v-row class="metric-grid" dense><v-col cols="12" sm="4"><v-card class="metric-card" rounded="xl"><div class="metric-card__content"><div class="metric-card__topline"><span class="metric-card__label">Total audience</span><v-avatar color="primary" variant="tonal"><v-icon icon="mdi-account-multiple-outline" /></v-avatar></div><strong class="metric-card__value">{{ formatMetric(overview.total_audience) }}</strong><span class="metric-card__helper">Across your {{ state.merchantProfile?.profile_type }} profile</span></div></v-card></v-col><v-col cols="12" sm="4"><v-card class="metric-card" rounded="xl"><div class="metric-card__content"><div class="metric-card__topline"><span class="metric-card__label">Audience health</span><v-avatar color="success" variant="tonal"><v-icon icon="mdi-heart-pulse" /></v-avatar></div><strong class="metric-card__value">{{ formatPercent(overview.total_audience ? (overview.reachable_subscribers / overview.total_audience) * 100 : 0) }}</strong><span class="metric-card__helper">Reachable for a nudge</span></div></v-card></v-col><v-col cols="12" sm="4"><v-card class="metric-card" rounded="xl"><div class="metric-card__content"><div class="metric-card__topline"><span class="metric-card__label">New subscribers</span><v-avatar color="secondary" variant="tonal"><v-icon icon="mdi-account-plus-outline" /></v-avatar></div><strong class="metric-card__value">{{ formatMetric(overview.new_subscribers) }}</strong><span class="metric-card__helper">In the last 30 days</span></div></v-card></v-col></v-row>
      <v-row class="content-grid" dense><v-col cols="12" lg="7"><v-card class="surface-card dashboard-card dashboard-card--welcome" rounded="xl"><div class="dashboard-card__decor dashboard-card__decor--one" /><div class="dashboard-card__decor dashboard-card__decor--two" /><div class="dashboard-card__eyebrow">Your next best move</div><h2>Reach the people who chose to hear from you.</h2><p>Write one clear message, see how it will appear on a phone, and send it to your subscribers.</p><div class="dashboard-card__actions"><v-btn color="primary" to="/compose">Create a nudge</v-btn><v-btn variant="text" to="/audience">Explore audience <v-icon end icon="mdi-arrow-right" /></v-btn></div></v-card></v-col><v-col cols="12" lg="5"><v-card class="surface-card dashboard-card" rounded="xl"><div class="dashboard-card__head"><div><div class="surface-card__eyebrow">Workspace setup</div><h2 class="chart-card__title">You are ready to nudge</h2></div><v-icon color="success" icon="mdi-check-decagram-outline" size="28" /></div><div class="setup-list"><div class="setup-list__item"><v-icon color="success" icon="mdi-check-circle" /><span>Profile connected</span><v-btn size="small" variant="text" to="/profile">View</v-btn></div><div class="setup-list__item"><v-icon color="success" icon="mdi-check-circle" /><span>Audience synced</span><v-btn size="small" variant="text" to="/audience">Explore</v-btn></div><div class="setup-list__item"><v-icon color="primary" icon="mdi-arrow-right-circle-outline" /><span>Review nudge history</span><v-btn size="small" variant="text" to="/nudges">Open</v-btn></div></div></v-card></v-col></v-row>
    </template>
  </section>
</template>
