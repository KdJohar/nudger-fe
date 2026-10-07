<script setup lang="ts">
import SectionHeader from '../components/ui/SectionHeader.vue'

const customerStats = [
  { label: 'Total customers', value: '8,549', icon: 'mdi-account-group-outline', color: 'secondary' },
  { label: 'New this month', value: '684', icon: 'mdi-account-plus-outline', color: 'primary' },
  { label: 'Returning rate', value: '68.4%', icon: 'mdi-repeat', color: 'success' },
]

const customerSegments = [
  { name: 'Champions', detail: 'High value, highly engaged', value: '2,814', percent: 72, color: 'primary' },
  { name: 'Loyal customers', detail: 'Consistent repeat buyers', value: '3,106', percent: 58, color: 'secondary' },
  { name: 'At risk', detail: 'No activity in 60+ days', value: '1,024', percent: 24, color: 'warning' },
]
</script>

<template>
  <section class="page-view" aria-labelledby="customers-heading">
    <SectionHeader heading-id="customers-heading" eyebrow="Workspace / Customers" title="Customers" description="Understand the people behind your growth." />

    <v-row class="metric-grid">
      <v-col v-for="stat in customerStats" :key="stat.label" cols="12" sm="4">
        <v-card class="stat-card surface-card" variant="flat">
          <v-card-text class="stat-card__content">
            <v-avatar :color="stat.color" size="42" variant="tonal"><v-icon :icon="stat.icon" /></v-avatar>
            <div><div class="stat-card__label">{{ stat.label }}</div><div class="stat-card__value">{{ stat.value }}</div></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="content-grid">
      <v-col cols="12" lg="7">
        <v-card class="surface-card" variant="flat">
          <v-card-text>
            <div class="surface-card__header"><div><div class="surface-card__eyebrow">Audience health</div><div class="surface-card__title surface-card__title--small">Customer segments</div></div><v-btn color="secondary" size="small" variant="text">View all</v-btn></div>
            <div class="segment-list">
              <div v-for="segment in customerSegments" :key="segment.name" class="segment-list__item">
                <div class="segment-list__heading"><div><div class="data-table__strong">{{ segment.name }}</div><div class="data-table__muted">{{ segment.detail }}</div></div><span class="segment-list__value">{{ segment.value }}</span></div>
                <v-progress-linear :color="segment.color" :model-value="segment.percent" height="8" rounded="pill" />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="5">
        <v-card class="surface-card surface-card--soft" variant="flat">
          <v-card-text>
            <div class="surface-card__eyebrow">Retention opportunity</div>
            <div class="surface-card__title surface-card__title--small">Bring back 1,024 customers</div>
            <p class="surface-card__description">A thoughtful nudge today could turn dormant customers into your next repeat order.</p>
            <v-btn color="secondary" prepend-icon="mdi-send-outline">Create campaign</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>
