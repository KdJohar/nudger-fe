<script setup lang="ts">
import { ANDROID_URL, IOS_URL } from '../../data/integrations'
import IconLink from './IconLink.vue'
</script>
<template>
  <section id="get-app" class="m-download m-wrap" aria-labelledby="download-title">
    <img src="/showcase/nudge-mark.webp" alt="" width="72" height="72" loading="lazy" decoding="async" />
    <p class="m-eyebrow">A little nudge. A lot less checking.</p><h2 id="download-title">Make room for<br />what matters.</h2><p>Your people. Your tools. Your notifications.</p>
    <div class="m-actions"><IconLink :href="IOS_URL" icon="apple">Download for iPhone</IconLink><IconLink :href="ANDROID_URL" icon="google-play">Download for Android</IconLink></div>
  </section>
</template>
