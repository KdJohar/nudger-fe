<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { completeGoogleLogin } from '../composables/useAuth'
import { navigateTo } from '../lib/navigation'

const errorMessage = ref<string | null>(null)

onMounted(async () => {
  const query = new URLSearchParams(window.location.search)
  const handoffCode = query.get('handoff_code')
  const providerError = query.get('error')

  if (providerError || !handoffCode) {
    errorMessage.value = 'Google sign-in was cancelled or could not be completed.'
    return
  }

  try {
    await completeGoogleLogin(handoffCode)
    navigateTo('/dashboard', true)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Sign-in could not be completed.'
  }
})
</script>

<template>
  <main class="auth-status" aria-labelledby="auth-status-heading">
    <section class="auth-status__panel" aria-live="polite">
      <div class="auth-status__spinner" aria-hidden="true"></div>
      <p class="eyebrow"><span class="eyebrow__dot"></span> Nudger workspace</p>
      <h1 id="auth-status-heading">Finishing sign-in</h1>
      <p v-if="!errorMessage" class="auth-status__copy">Connecting your Google identity to Nudger…</p>
      <p v-else class="auth-status__error" role="alert">{{ errorMessage }}</p>
      <a v-if="errorMessage" class="button button--outline" href="/login">Return to login</a>
    </section>
  </main>
</template>

<style scoped>
.auth-status {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px 20px;
}

.auth-status__panel {
  width: min(100%, 480px);
  padding: clamp(32px, 6vw, 56px);
  border: 1px solid var(--color-border);
  border-radius: 32px;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  text-align: center;
}

.auth-status__spinner {
  width: 42px;
  height: 42px;
  margin: 0 auto 28px;
  border: 3px solid rgba(255, 107, 74, 0.2);
  border-top-color: var(--color-coral);
  border-radius: 50%;
  animation: auth-status-spin 800ms linear infinite;
}

.auth-status h1 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2rem, 6vw, 3rem);
  letter-spacing: -0.06em;
  line-height: 1;
}

.auth-status__copy,
.auth-status__error {
  margin: 16px auto 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.auth-status__error {
  color: #ffb4a3;
}

.auth-status .button {
  margin-top: 28px;
}

@keyframes auth-status-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-status__spinner {
    animation: none;
  }
}
</style>
