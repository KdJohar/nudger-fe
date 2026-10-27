<script setup lang="ts">
import PublicLayout from '../layouts/PublicLayout.vue'
import LandingView from '../views/LandingView.vue'
import ForNudgersView from '../views/ForNudgersView.vue'
import PublicInfoView from '../views/PublicInfoView.vue'
import IntegrationsView from '../views/IntegrationsView.vue'
import IntegrationView from '../views/IntegrationView.vue'
import { PUBLIC_PAGES } from '../data/publicPages'
import { PUBLISHED_INTEGRATIONS } from '../data/publicFeatures'
const props = defineProps<{ path: string }>()
const page = PUBLIC_PAGES.find(item => item.path === props.path)
const integration = page ? PUBLISHED_INTEGRATIONS.find(item => props.path === `/integrations/${item.slug}`) : undefined
</script>
<template>
  <PublicLayout :page-name="page?.name">
    <LandingView v-if="page?.name === 'home'" />
    <ForNudgersView v-else-if="page?.name === 'merchant'" />
    <IntegrationsView v-else-if="page?.name === 'integrations'" />
    <IntegrationView v-else-if="integration" :integration="integration" />
    <PublicInfoView v-else-if="page?.topic" :topic="page.topic" />
    <section v-else class="m-wrap m-error"><p class="m-eyebrow">404 · Page not found</p><h1>This page isn’t here.</h1><p>Let’s get you back to something useful.</p><a class="m-button m-button--primary" href="/">Back to home <span aria-hidden="true">→</span></a></section>
  </PublicLayout>
</template>
