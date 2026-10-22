<script setup lang="ts">
import { IOS_URL } from '../data/integrations'
defineProps<{ pageName?: string }>()
</script>
<template>
  <div class="m-site" :class="{ 'm-site--download-dock': pageName === 'home' }">
    <a class="m-skip" href="#main-content">Skip to content</a>
    <header class="m-header"><div class="m-wrap m-header__inner">
      <a class="m-brand" href="/" aria-label="Plug & Nudge home"><img src="/showcase/nudge-mark.webp" alt="" width="32" height="32" /><span>plug<span class="m-brand__amp">&amp;</span>nudge</span></a>
      <nav class="m-desktop-nav" aria-label="Main navigation"><a href="/#possibilities">The app</a><a href="/integrations" :aria-current="pageName?.startsWith('integration') ? 'page' : undefined">Integrations</a><a href="/merchant" :aria-current="pageName === 'merchant' ? 'page' : undefined">For creators &amp; platforms</a></nav>
      <div class="m-header__actions"><button class="m-theme" type="button" data-theme-toggle aria-label="Change color theme" hidden><span aria-hidden="true">◐</span></button><a class="m-button m-button--small m-button--primary" :href="IOS_URL">Get the app <span aria-hidden="true">↗</span></a><details class="m-mobile-menu"><summary aria-label="Open navigation"><span aria-hidden="true">☰</span></summary><nav aria-label="Mobile navigation"><a href="/#possibilities">The app</a><a href="/integrations">Integrations</a><a href="/merchant">For creators &amp; platforms</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav></details></div>
    </div></header>
    <main id="main-content" tabindex="-1"><slot /></main>
    <footer class="m-footer"><div class="m-wrap"><div class="m-footer__top"><div><a class="m-brand" href="/"><img src="/showcase/nudge-mark.webp" alt="" width="32" height="32" /><span>plug&amp;nudge</span></a><p>Your attention belongs to you.</p></div><div class="m-footer__group"><strong>Explore</strong><a href="/integrations">Integrations</a><a href="/merchant">Creators &amp; platforms</a><a href="/login">Sign in</a></div><div class="m-footer__group"><strong>Your trust</strong><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/security">Security</a></div><div class="m-footer__group"><strong>Here to help</strong><a href="/support">Support</a><a href="/delete-account">Account deletion</a><a :href="IOS_URL">Download for iPhone</a></div></div><div class="m-footer__bottom"><span>© {{ new Date().getFullYear() }} Plug &amp; Nudge</span><span>Updates you choose. Alerts that matter.</span></div></div></footer>
    <aside v-if="pageName === 'home'" class="m-dock" aria-label="Download Nudge"><div><strong>Nudge for iPhone</strong><span>Your updates. On your terms.</span></div><a class="m-button m-button--primary" :href="IOS_URL">Get the app <span aria-hidden="true">↗</span></a></aside>
  </div>
</template>
