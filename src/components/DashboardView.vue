<script setup lang="ts">
import { computed } from 'vue'

import { useAuth } from '../composables/useAuth'
import IconGlyph from './IconGlyph.vue'
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
        <p>Your active Nudger workspace will appear here soon.</p>
      </section>

      <section class="workspace-empty" aria-labelledby="workspace-empty-heading">
        <div class="workspace-empty__icon" aria-hidden="true"><IconGlyph name="sparkles" /></div>
        <p class="panel-label">Workspace ready</p>
        <h2 id="workspace-empty-heading">Your sending tools are on the way.</h2>
        <p class="workspace-empty__copy">Your profile is active. We are keeping this space intentionally simple while the first Nudger operations arrive.</p>
      </section>
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

.workspace-empty {
  width: min(100%, 900px);
  padding: clamp(28px, 5vw, 48px);
  border: 1px solid var(--color-border);
  border-radius: 32px;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.workspace-empty__icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 18px;
  color: #c4c8ff;
  background: rgba(79, 70, 229, 0.2);
}

.workspace-empty__icon .icon-glyph {
  width: 26px;
  height: 26px;
}

.workspace-empty .panel-label {
  margin-top: 28px;
  color: #ffad9b;
}

.workspace-empty h2 {
  max-width: 700px;
  margin: 12px 0 0;
  color: var(--color-text);
  font-size: clamp(2rem, 4vw, 3.6rem);
  font-weight: 850;
  letter-spacing: -0.06em;
  line-height: 1;
}

.workspace-empty__copy {
  max-width: 620px;
  margin: 18px 0 0;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.6;
}

</style>
