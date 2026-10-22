<script setup lang="ts">
import { IOS_URL } from '../../data/integrations'
</script>
<template>
  <section id="get-app" class="m-download m-wrap" aria-labelledby="download-title">
    <img src="/showcase/nudge-mark.webp" alt="" width="72" height="72" loading="lazy" decoding="async" />
    <p class="m-eyebrow">A little nudge. A lot less checking.</p><h2 id="download-title">Make room for<br />what matters.</h2><p>Your people. Your tools. Your notifications.</p>
    <div class="m-actions"><a class="m-button m-button--primary" :href="IOS_URL">Download for iPhone <span aria-hidden="true">↗</span></a><span class="m-coming">Android <span>Coming soon</span></span></div>
  </section>
</template>
