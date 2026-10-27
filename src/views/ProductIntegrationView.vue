<script setup lang="ts">
import { IOS_URL, type Integration, type ProductIntegration } from '../data/integrations'
import IntegrationSteps from '../components/public/IntegrationSteps.vue'
import DownloadBlock from '../components/public/DownloadBlock.vue'
defineProps<{ integration: Integration; product: ProductIntegration }>()
</script>
<template>
  <section class="m-wrap m-product-intro">
    <a class="m-back" href="/integrations">← All integrations</a>
    <div class="m-product-hero">
      <div>
        <div class="m-detail-identity"><span class="m-eyebrow">{{ integration.name }} + Nudge</span><span class="m-status">Available</span></div>
        <h1>{{ product.headline }}</h1>
        <p class="m-lead">{{ integration.description }}</p>
        <div class="m-actions"><a class="m-button m-button--primary" :href="product.appUrl">{{ product.appLabel }} <span aria-hidden="true">↗</span></a><a class="m-text-link" href="#setup">See how to connect <span aria-hidden="true">↓</span></a></div>
        <p class="m-caption">For {{ product.versions.map(version => version.label).join(' and ') }} · iOS available · Android coming soon</p>
      </div>
      <figure class="m-product-story">
        <div class="m-product-connection"><span v-if="integration.logo" class="m-product-logo"><img :src="integration.logo.src" :alt="integration.logo.alt" :width="integration.logo.width" :height="integration.logo.height" /></span><span aria-hidden="true">→</span><img src="/showcase/nudge-mark.webp" alt="Nudge" width="56" height="56" /></div>
        <p class="m-eyebrow">Context you can act on</p>
        <blockquote>{{ product.notificationExample }}</blockquote>
        <p class="m-product-story__detail">See what changed, who’s involved and which record needs you. Learn more takes you back to the record.</p>
        <figcaption>Illustrative alert text with fictional names. Appearance varies by device.</figcaption>
      </figure>
    </div>
    <nav class="m-section-nav" aria-label="On this page"><a href="#alerts">Alerts</a><a href="#setup">Setup</a><a href="#delivery">Delivery</a><a href="#data-privacy">Privacy</a><a href="#questions">FAQs</a></nav>
  </section>

  <section class="m-wrap m-section" aria-labelledby="benefits-title">
    <div class="m-section-heading"><p class="m-eyebrow">Stay in the loop</p><h2 id="benefits-title">Less checking.<br />More following through.</h2></div>
    <div class="m-use-grid"><article v-for="(benefit, index) in product.benefits" :key="benefit.title"><span aria-hidden="true">0{{ index + 1 }}</span><h3>{{ benefit.title }}</h3><p>{{ benefit.body }}</p></article></div>
  </section>

  <section id="alerts" class="m-section m-product-band" aria-labelledby="alerts-title"><div class="m-wrap">
    <div class="m-section-heading"><p class="m-eyebrow">The updates that matter</p><h2 id="alerts-title">Your {{ integration.category }}, a little closer.</h2><p>From a new lead to the next conversation. Choose the alerts your team needs.</p></div>
    <div class="m-alert-grid"><article v-for="group in product.alertGroups" :key="group.title" class="m-alert-group"><h3>{{ group.title }}</h3><ul><li v-for="item in group.items" :key="item">{{ item }}</li></ul></article></div>
    <p class="m-guide-note">{{ product.alertNote }}</p>
  </div></section>

  <section class="m-wrap m-section" aria-labelledby="recipients-title"><div class="m-section-heading"><p class="m-eyebrow">Personal by design</p><h2 id="recipients-title">The right update.<br />The right person.</h2></div><div class="m-profile-grid"><article v-for="group in product.recipientGroups" :key="group.title" class="m-card"><h3>{{ group.title }}</h3><p>{{ group.body }}</p></article></div><p class="m-guide-note">{{ product.recipientNote }}</p></section>

  <section id="setup" class="m-wrap m-section" aria-labelledby="setup-title">
    <div class="m-section-heading"><p class="m-eyebrow">Make the connection</p><h2 id="setup-title">Set up once.<br />Stay connected.</h2></div>
    <div class="m-detail-grid">
      <aside class="m-requirements"><h3>Before you start</h3><ul><li v-for="requirement in integration.requirements" :key="requirement">{{ requirement }}</li></ul><p>{{ product.compatibility }}</p><div class="m-version-links"><a v-for="version in product.versions" :key="version.label" class="m-text-link" :href="version.url">Get {{ version.label }} module ↗</a></div><p>{{ product.moduleNote }}</p></aside>
      <div class="m-guide"><h3 class="m-guide-heading">For your administrator</h3><IntegrationSteps heading-level="h4" :steps="product.installSteps" /><div class="m-employee-setup"><h3 class="m-guide-heading">For each employee</h3><a class="m-text-link" :href="IOS_URL">Download Nudge for iOS ↗</a><IntegrationSteps heading-level="h4" :steps="integration.steps" /><p class="m-guide-note">{{ integration.note }}</p></div></div>
    </div>
  </section>

  <section id="delivery" class="m-wrap m-section" aria-labelledby="delivery-title"><div class="m-section-heading"><p class="m-eyebrow">Choose how updates reach you</p><h2 id="delivery-title">Two delivery modes.<br />One place for your alerts.</h2></div><div class="m-profile-grid"><article v-for="(mode, index) in product.deliveryModes" :key="mode.title" class="m-card" :class="{ 'm-card--platform': index === 0 }"><span class="m-kicker">{{ index === 0 ? 'Default' : 'Optional' }}</span><h3>{{ mode.title }}</h3><p>{{ mode.body }}</p></article></div><p class="m-guide-note">{{ product.deliveryNote }}</p></section>

  <section id="data-privacy" class="m-wrap m-section m-product-privacy" aria-labelledby="data-title"><div><p class="m-eyebrow">A connection you control</p><h2 id="data-title">Your records stay in {{ integration.name }}.<br />Selected alerts reach Nudge.</h2></div><div><p>{{ product.privacy }}</p><a class="m-text-link" href="/privacy">Read our privacy policy <span aria-hidden="true">→</span></a></div></section>

  <section id="questions" class="m-section m-wrap m-faq" aria-labelledby="faq-title"><div><p class="m-eyebrow">A few useful answers</p><h2 id="faq-title">Good to know.</h2><a class="m-text-link" href="/support">Ask Nudge support →</a></div><div><details v-for="faq in product.faqs" :key="faq.question"><summary>{{ faq.question }}</summary><p>{{ faq.answer }}</p></details></div></section>

  <section class="m-wrap m-merchant-strip"><div><p class="m-eyebrow">Ready when you are</p><h2>Bring your {{ integration.category }} updates<br />to your phone.</h2><p>Install the module, connect your account and choose what matters.</p></div><a class="m-button m-button--primary" :href="product.appUrl">{{ product.appLabel }} <span aria-hidden="true">↗</span></a></section>
  <DownloadBlock />
</template>
