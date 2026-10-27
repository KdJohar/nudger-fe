<script setup lang="ts">
import { INTEGRATION_LABELS, IOS_URL, type Integration } from '../data/integrations'
import { PUBLISHED_INTEGRATIONS } from '../data/publicFeatures'
import ProductIntegrationView from './ProductIntegrationView.vue'
import IntegrationSteps from '../components/public/IntegrationSteps.vue'
import IntegrationCard from '../components/public/IntegrationCard.vue'
defineProps<{ integration: Integration }>()
</script>
<template>
  <ProductIntegrationView v-if="integration.product" :integration="integration" :product="integration.product" />
  <template v-else>
  <section class="m-wrap m-detail-intro"><a class="m-back" href="/integrations">← All integrations</a><div class="m-detail-identity"><span class="m-integration__mark" aria-hidden="true">{{ integration.mark }}</span><span class="m-status" :class="{ 'm-status--preview': integration.status === 'preview' }">{{ INTEGRATION_LABELS[integration.status] }}</span></div><p class="m-eyebrow">{{ integration.category }}</p><h1>{{ integration.name }}<br /><span>meets Nudge.</span></h1><p class="m-lead">{{ integration.description }}</p><div class="m-actions"><a class="m-button m-button--primary" :href="integration.status === 'preview' ? '/support' : '#setup'">{{ integration.status === 'preview' ? 'Ask about preview access' : 'Get connected' }} <span aria-hidden="true">→</span></a><a class="m-text-link" :href="IOS_URL">Get Nudge for iPhone ↗</a></div></section>
  <div class="m-wrap m-detail-grid"><aside class="m-requirements"><h2>Before you start</h2><ul class="m-check-list"><li v-for="requirement in integration.requirements" :key="requirement">{{ requirement }}</li></ul><h3>A few possibilities</h3><ul><li v-for="example in integration.examples" :key="example">{{ example }}</li></ul><a class="m-text-link" href="/support">Need a hand? →</a></aside><section id="setup" class="m-guide" aria-labelledby="setup-title"><p class="m-eyebrow">Make the connection</p><h2 id="setup-title">{{ integration.status === 'preview' ? 'Getting started in preview.' : 'A few steps. You’re connected.' }}</h2><IntegrationSteps :steps="integration.steps" /><div v-if="integration.code" class="m-code-block"><div><span>{{ integration.codeLanguage }}</span><button type="button" data-copy-code hidden>Copy example</button></div><pre tabindex="0" :aria-label="`${integration.codeLanguage} example`"><code>{{ integration.code }}</code></pre><p data-copy-status role="status" aria-live="polite" /></div><p class="m-guide-note">{{ integration.note }}</p></section></div>
  <section v-if="PUBLISHED_INTEGRATIONS.some(item => item.slug !== integration.slug)" class="m-section m-wrap"><div class="m-section-heading"><p class="m-eyebrow">Keep exploring</p><h2>Another way to connect.</h2></div><div class="m-integration-grid"><IntegrationCard v-for="item in PUBLISHED_INTEGRATIONS.filter(item => item.slug !== integration.slug).slice(0, 4)" :key="item.slug" :integration="item" /></div></section>
  </template>
</template>
