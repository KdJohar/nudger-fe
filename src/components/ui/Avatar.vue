<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ src?: string | null }>()
const hasImageError = ref(false)
watch(() => props.src, () => { hasImageError.value = false })
</script>

<template>
  <span class="ui-avatar-image" aria-hidden="true">
    <img v-if="src && !hasImageError" :src="src" alt="" @error="hasImageError = true" />
    <v-icon v-else icon="mdi-account-outline" size="26" />
  </span>
</template>
