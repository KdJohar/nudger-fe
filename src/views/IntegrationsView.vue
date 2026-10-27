<script setup lang="ts">
import { PUBLISHED_INTEGRATIONS, isIntegrationPublished } from '../data/publicFeatures'
import IntegrationCard from '../components/public/IntegrationCard.vue'
import DownloadBlock from '../components/public/DownloadBlock.vue'
const categories = [...new Set(PUBLISHED_INTEGRATIONS.map(item => item.category))]
</script>
<template>
  <section class="m-wrap m-page-intro"><p class="m-eyebrow">Bring your tools a little closer</p><h1>Your world.<br /><span>One useful nudge.</span></h1><p class="m-lead">Connect the tools you use. Get the updates you need.<br />Explore the available integrations and get connected.</p></section>
  <section class="m-wrap m-catalog" aria-labelledby="catalog-title">
    <h2 id="catalog-title" class="m-visually-hidden">Available integrations</h2>
    <div class="m-catalog-controls" data-catalog-controls hidden><label class="m-search"><span>Find an integration</span><input type="search" data-integration-search placeholder="Search tools or workflows" autocomplete="off" aria-controls="integration-list" /></label><label class="m-category"><span>Category</span><select data-integration-category aria-controls="integration-list"><option value="">All categories</option><option v-for="category in categories" :key="category">{{ category }}</option></select></label></div>
    <p class="m-catalog-count" data-result-count role="status" aria-live="polite">{{ PUBLISHED_INTEGRATIONS.length }} {{ PUBLISHED_INTEGRATIONS.length === 1 ? 'integration' : 'integrations and guides' }}</p>
    <div id="integration-list" class="m-integration-grid m-integration-grid--catalog m-integration-grid--adaptive"><IntegrationCard v-for="integration in PUBLISHED_INTEGRATIONS" :key="integration.slug" :integration="integration" /></div>
    <div class="m-empty" data-no-results hidden><h3>No matches yet.</h3><p>Try another name or choose All categories.</p><button class="m-button m-button--outline" type="button" data-reset-search>Clear filters</button></div>
  </section>
  <section class="m-wrap m-merchant-strip"><div><p class="m-eyebrow">Don’t see your tool?</p><h2>Tell us what you’d<br />like to connect.</h2><p>We’d love to hear which updates would be useful to you.</p></div><a v-if="isIntegrationPublished('webhooks')" class="m-button m-button--outline" href="/integrations/webhooks">Start with webhooks →</a><a v-else class="m-button m-button--outline" href="/support">Request an integration →</a></section><DownloadBlock />
</template>
