<script setup lang="ts">
import { INTEGRATION_LABELS, type Integration } from '../../data/integrations'
defineProps<{ integration: Integration }>()
</script>
<template>
  <a class="m-integration" :href="`/integrations/${integration.slug}`" :data-category="integration.category" :data-search="`${integration.name} ${integration.category} ${integration.summary}`.toLowerCase()">
    <span class="m-integration__top"><span v-if="integration.logo" class="m-integration__logo"><img :src="integration.logo.src" :alt="integration.logo.alt" :width="integration.logo.width" :height="integration.logo.height" loading="lazy" /></span><span v-else class="m-integration__mark" aria-hidden="true">{{ integration.mark }}</span><span class="m-status" :class="{ 'm-status--preview': integration.status === 'preview' }">{{ INTEGRATION_LABELS[integration.status] }}</span></span>
    <h3>{{ integration.name }}</h3><p>{{ integration.summary }}</p><span class="m-integration__link">Explore {{ integration.name }} <span aria-hidden="true">↗</span></span>
  </a>
</template>
