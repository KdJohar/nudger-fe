<script setup lang="ts">
import SectionHeader from '../components/ui/SectionHeader.vue'

const channelData = [
  { label: 'Direct', value: '42%', amount: '$54,100', color: 'primary' },
  { label: 'Organic search', value: '28%', amount: '$35,960', color: 'secondary' },
  { label: 'Referral', value: '18%', amount: '$23,118', color: 'success' },
  { label: 'Social', value: '12%', amount: '$15,252', color: 'warning' },
]

const funnelSteps = [
  { label: 'Visitors', value: '48,290', widthClass: 'funnel-list__bar--full' },
  { label: 'Engaged', value: '24,104', widthClass: 'funnel-list__bar--wide' },
  { label: 'Added to cart', value: '9,862', widthClass: 'funnel-list__bar--medium' },
  { label: 'Purchased', value: '4,218', widthClass: 'funnel-list__bar--narrow' },
]
</script>

<template>
  <section class="page-view" aria-labelledby="analytics-heading">
    <SectionHeader heading-id="analytics-heading" eyebrow="Workspace / Analytics" title="Analytics" description="Turn your activity into your next best decision.">
      <template #action><v-btn class="section-header__action" color="primary" prepend-icon="mdi-calendar-range">Last 30 days</v-btn></template>
    </SectionHeader>

    <v-row class="content-grid">
      <v-col cols="12" lg="8">
        <v-card class="surface-card" variant="flat">
          <v-card-text>
            <div class="surface-card__header"><div><div class="surface-card__eyebrow">Conversion performance</div><div class="surface-card__title surface-card__title--small">Funnel overview</div></div><v-chip color="success" prepend-icon="mdi-trending-up" size="small" variant="tonal">+9.4%</v-chip></div>
            <div class="funnel-list">
              <div v-for="step in funnelSteps" :key="step.label" class="funnel-list__item">
                <div class="funnel-list__labels"><span>{{ step.label }}</span><span class="data-table__strong">{{ step.value }}</span></div>
                <div class="funnel-list__track"><div class="funnel-list__bar" :class="step.widthClass" /></div>
              </div>
            </div>
            <div class="funnel-list__footer"><span>Overall conversion rate</span><span class="text-success">8.7%</span></div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card class="surface-card" variant="flat">
          <v-card-text>
            <div class="surface-card__eyebrow">Revenue mix</div><div class="surface-card__title surface-card__title--small">By channel</div>
            <div class="channel-list">
              <div v-for="channel in channelData" :key="channel.label" class="channel-list__item"><div class="channel-list__label"><span class="channel-list__dot" :class="`bg-${channel.color}`" />{{ channel.label }}</div><div class="channel-list__amount"><span>{{ channel.amount }}</span><span class="data-table__muted">{{ channel.value }}</span></div></div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="surface-card" variant="flat">
      <v-card-text>
        <div class="surface-card__header"><div><div class="surface-card__eyebrow">Signals</div><div class="surface-card__title surface-card__title--small">What changed this month</div></div></div>
        <div class="insight-grid">
          <div class="insight-card"><v-avatar color="success" size="38" variant="tonal"><v-icon icon="mdi-arrow-top-right" /></v-avatar><div><div class="insight-card__value">+18.2%</div><div class="insight-card__label">Repeat purchases</div></div></div>
          <div class="insight-card"><v-avatar color="primary" size="38" variant="tonal"><v-icon icon="mdi-clock-fast" /></v-avatar><div><div class="insight-card__value">-2.4 days</div><div class="insight-card__label">Average time to convert</div></div></div>
          <div class="insight-card"><v-avatar color="secondary" size="38" variant="tonal"><v-icon icon="mdi-heart-outline" /></v-avatar><div><div class="insight-card__value">4.8 / 5</div><div class="insight-card__label">Customer sentiment</div></div></div>
        </div>
      </v-card-text>
    </v-card>
  </section>
</template>
