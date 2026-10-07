<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'small' | 'medium' | 'large'
  alt?: string
}>(), {
  size: 'medium',
  alt: 'Plug&Nudge logo',
})
</script>

<template>
  <span class="brand-logo" :class="`brand-logo--${size}`">
    <img class="brand-logo__image" src="/nudge.png" :alt="alt" />
  </span>
</template>
