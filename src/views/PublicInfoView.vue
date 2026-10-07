<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ topic: 'privacy' | 'terms' | 'security' }>()

const pageCopy = {
  privacy: { title: 'Privacy Policy', description: 'We are preparing the complete Privacy Policy for publication. Our goal is to let you follow channels without giving creators your personal contact information.' },
  terms: { title: 'Terms of Service', description: 'We are preparing the complete Terms of Service for publication. Please check back before the app becomes available.' },
  security: { title: 'Security Statement', description: 'We are preparing a detailed Security Statement. The receiver experience is designed to keep your personal identity separate from channel subscriber counts.' },
} as const

const copy = computed(() => pageCopy[props.topic])
</script>

<template>
  <section class="site-section site-section--intro" aria-labelledby="info-heading"><div class="site-wrap site-info"><span class="site-eyebrow">Plug &amp; Nudge</span><h1 id="info-heading" class="site-heading">{{ copy.title }}</h1><p class="site-intro">{{ copy.description }}</p><div class="site-info__notice"><v-icon icon="mdi-information-outline" size="24" /><span>Full document coming soon. This page is not the final legal policy.</span></div><RouterLink class="site-button site-button--primary" to="/">Back to home <v-icon icon="mdi-arrow-right" size="18" /></RouterLink></div></section>
</template>
