<script setup lang="ts">
import { provideAppTheme } from './composables/useAppTheme'
import { provideSnackbar } from './composables/useSnackbar'
import SnackbarHost from './components/ui/SnackbarHost.vue'

provideAppTheme()
provideSnackbar()
</script>

<template>
  <router-view />
  <SnackbarHost />
</template>
