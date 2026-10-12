<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div class="ui-message-summary">
    <p class="ui-message-summary__text">{{ message }}</p>
  </div>
</template>
