<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useAppTheme } from '../composables/useAppTheme'
import BrandLogo from '../components/ui/BrandLogo.vue'
import SnackbarFeedback from '../components/ui/SnackbarFeedback.vue'

const { state, startGoogleLogin } = useAuth()
const { isDark, initializeTheme, toggleTheme } = useAppTheme()
const isDisabled = computed(() => state.isBusy)
initializeTheme()

async function signIn(): Promise<void> {
  try { await startGoogleLogin() } catch { /* auth state renders the error */ }
}
</script>

<template>
  <v-app class="auth-app"><v-main class="auth-main"><div class="auth-layout"><div class="auth-visual"><div class="auth-visual__glow auth-visual__glow--one" /><div class="auth-visual__glow auth-visual__glow--two" /><div class="auth-brand"><BrandLogo alt="Plug&Nudge logo" size="medium" /><span>Plug<span>&</span>Nudge</span></div><div class="auth-visual__copy"><div class="section-header__eyebrow">Nudger workspace</div><h1>Turn every message into a moment that matters.</h1><p>Understand your audience, keep your community close, and see the impact of every nudge in one calm workspace.</p></div><div class="auth-visual__signal"><v-icon icon="mdi-chart-timeline-variant-shimmer" /><span>Audience signals, made human.</span></div></div><div class="auth-panel"><div class="auth-panel__top"><span>Already part of the network?</span><v-btn aria-label="Toggle theme" :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" size="small" variant="text" @click="toggleTheme" /></div><v-card class="auth-card" rounded="xl"><v-icon class="auth-card__icon" color="primary" icon="mdi-shield-account-outline" size="30" /><div class="auth-card__eyebrow">Welcome back</div><h2>Sign in to Nudger</h2><p>Access your audience insights and nudge history securely with Google.</p><SnackbarFeedback :message="state.errorMessage" /><v-btn block color="primary" :disabled="isDisabled" :loading="isDisabled" size="large" @click="signIn"><v-icon start icon="mdi-google" />Continue with Google</v-btn><div class="auth-card__note"><v-icon icon="mdi-lock-outline" size="16" /> Secure sign-in powered by your Google account</div></v-card><div class="auth-panel__footer">Nudger is for platforms and creators building meaningful subscriber relationships.</div></div></div></v-main></v-app>
</template>
