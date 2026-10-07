<script setup lang="ts">
import { provideAppTheme } from './composables/useAppTheme'

provideAppTheme()
</script>

<template>
  <router-view />
</template>
