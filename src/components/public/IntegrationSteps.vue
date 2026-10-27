<script setup lang="ts">
import type { IntegrationStep } from '../../data/integrations'
withDefaults(defineProps<{ steps: IntegrationStep[]; headingLevel?: 'h3' | 'h4' }>(), { headingLevel: 'h3' })
</script>
<template>
  <ol class="m-steps">
    <li v-for="(step, index) in steps" :key="step.title">
      <span aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
      <div><component :is="headingLevel">{{ step.title }}</component><p>{{ step.body }}</p></div>
    </li>
  </ol>
</template>
