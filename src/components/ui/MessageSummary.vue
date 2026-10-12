<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div class="ui-message-summary">
    <h3 class="ui-message-summary__title">Full message</h3>
    <p class="ui-message-summary__text">{{ message }}</p>
  </div>
</template>
