<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import SnackbarFeedback from '../components/ui/SnackbarFeedback.vue'

const route = useRoute()
const router = useRouter()
const { state, completeGoogleLogin } = useAuth()
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  const handoffCode = typeof route.query.handoff_code === 'string' ? route.query.handoff_code : null
  const providerError = typeof route.query.error === 'string' ? route.query.error : null
  if (providerError) { errorMessage.value = providerError; return }
  if (!handoffCode) { errorMessage.value = 'This sign-in link is incomplete. Please try again.'; return }
  try { await completeGoogleLogin(handoffCode); await router.replace(state.merchantProfile ? (state.merchantProfile.is_active ? '/audience' : '/pending') : '/onboarding') } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Unable to finish sign-in.' }
})
</script>

<template><v-app class="auth-app"><SnackbarFeedback :message="errorMessage" action-text="Sign in" action-to="/login" /><v-main class="auth-callback"><v-card class="auth-callback__card" rounded="xl"><v-progress-circular v-if="!errorMessage" color="primary" indeterminate size="46" /><v-icon v-else color="error" icon="mdi-alert-circle-outline" size="46" /><div class="auth-card__eyebrow">Nudger workspace</div><h1>{{ errorMessage ? 'Sign-in needs another try' : 'Securing your workspace' }}</h1><p>{{ errorMessage ? 'Return to sign-in to start again.' : 'We are confirming your account and preparing your private workspace.' }}</p><v-btn v-if="errorMessage" color="primary" to="/login">Back to sign in</v-btn></v-card></v-main></v-app></template>
