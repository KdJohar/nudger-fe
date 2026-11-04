<script setup lang="ts">
import PublicIcon from './PublicIcon.vue'
defineProps<{ href: string; icon: string }>()
</script>

<template>
  <a class="m-button m-button--primary m-button--icon" :href="href">
    <PublicIcon :name="icon" />
    <span><slot /></span>
  </a>
</template>
