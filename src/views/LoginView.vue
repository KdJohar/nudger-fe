<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import BrandLogo from '../components/ui/BrandLogo.vue'
import SnackbarFeedback from '../components/ui/SnackbarFeedback.vue'

const { state, startGoogleLogin } = useAuth()
const isDisabled = computed(() => state.isBusy)

async function signIn(): Promise<void> {
  try { await startGoogleLogin() } catch { /* auth state renders the error */ }
}
</script>

<template>
  <v-app class="ui-welcome-app">
    <main class="ui-welcome" aria-labelledby="welcome-heading">
      <div class="ui-welcome__visual">
        <div class="ui-welcome__ring">
          <BrandLogo size="medium" alt="" />
          <span class="ui-welcome__wordmark">Plug <span class="ui-welcome__brand-mark">&amp;</span> Nudge</span>
        </div>
        <div class="ui-welcome__note" aria-hidden="true">
          <v-icon icon="mdi-chart-timeline-variant-shimmer" />
          <div><strong>Audience signals, made human.</strong><span>See what matters before you send.</span></div>
        </div>
        <div class="ui-welcome__note" aria-hidden="true">
          <v-icon icon="mdi-check-circle-outline" />
          <div><strong>Your next nudge is ready</strong><span>Keep your community close and informed.</span></div>
        </div>
      </div>
      <div class="ui-welcome__copy">
        <span class="ui-eyebrow">YOUR COMMUNITY, WITHOUT THE NOISE</span>
        <h1 id="welcome-heading">Turn every message<br />into a moment<span>.</span></h1>
        <p>Understand your audience, send useful updates, and keep every relationship meaningful.</p>
      </div>
      <div class="ui-welcome__actions">
        <v-btn color="secondary" rounded="pill" size="large" block :loading="isDisabled" :disabled="isDisabled" prepend-icon="mdi-google" @click="signIn">Continue with Google</v-btn>
        <p><v-icon icon="mdi-lock-outline" size="16" /> Secure sign-in powered by your Google account.</p>
      </div>
      <SnackbarFeedback :message="state.errorMessage" />
    </main>
  </v-app>
</template>
