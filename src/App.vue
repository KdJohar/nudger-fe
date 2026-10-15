<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { provideAppTheme } from './composables/useAppTheme'
import { provideSnackbar } from './composables/useSnackbar'
import SnackbarHost from './components/ui/SnackbarHost.vue'

provideAppTheme()
provideSnackbar()
// Feedback is client-only; public HTML contains no session-dependent teleport state.
const isFeedbackReady = ref(false)
onMounted(() => { isFeedbackReady.value = true })
</script>

<template>
  <router-view />
  <SnackbarHost v-if="isFeedbackReady" />
</template>
