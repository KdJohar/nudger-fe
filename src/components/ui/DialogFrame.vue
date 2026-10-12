<script setup lang="ts">
defineProps<{ bodyLabel: string; isBusy?: boolean }>()
</script>

<template>
  <!-- The outer VDialog owns focus/dismissal; only this frame's body scrolls. -->
  <section class="ui-dialog" :aria-busy="isBusy">
    <header class="ui-dialog__header"><slot name="header" /></header>
    <div class="ui-dialog__body" role="region" :aria-label="bodyLabel" tabindex="0">
      <div class="ui-dialog__content"><slot /></div>
    </div>
    <footer class="ui-dialog__footer"><slot name="footer" /></footer>
  </section>
</template>
