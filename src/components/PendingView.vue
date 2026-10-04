<script setup lang="ts">
import { computed } from 'vue'

import { useAuth } from '../composables/useAuth'
import MerchantProfileManager from './MerchantProfileManager.vue'
import WorkspaceShell from './WorkspaceShell.vue'

const { state } = useAuth()

const firstName = computed(() => {
  const name = state.user?.name?.trim()
  return name?.split(/\s+/)[0] || 'there'
})
</script>

<template>
  <WorkspaceShell>
    <section class="workspace-intro" aria-labelledby="workspace-heading">
      <p class="eyebrow"><span class="eyebrow__dot"></span> Nudger workspace</p>
      <h1 id="workspace-heading">Welcome, {{ firstName }}.</h1>
      <p>Everything you need to reach the people who choose your updates will live here.</p>
    </section>

    <MerchantProfileManager />
  </WorkspaceShell>
</template>

<style scoped>
.workspace-intro {
  max-width: 760px;
}

.workspace-intro h1 {
  max-width: 720px;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(3rem, 7vw, 6rem);
  font-weight: 850;
  letter-spacing: -0.075em;
  line-height: 0.96;
  text-wrap: balance;
}

.workspace-intro > p:last-child {
  max-width: 580px;
  margin: 24px 0 0;
  color: var(--color-text-muted);
  font-size: 18px;
  line-height: 1.6;
}
</style>
