<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string
  exactValue?: string
  icon: string
  tone?: 'primary' | 'secondary' | 'success' | 'neutral'
  change?: string
  changeDirection?: 'up' | 'down' | 'flat'
  detail: string
}>(), { tone: 'neutral', change: '', changeDirection: 'flat', exactValue: undefined })
</script>

<template>
  <article class="ui-stat">
    <div class="ui-stat__heading">
      <span class="ui-stat__icon" :class="'ui-stat__icon--' + tone"><v-icon :icon="icon" size="19" /></span>
      <h2 class="ui-stat__label">{{ label }}</h2>
    </div>
    <strong class="ui-stat__value" :title="exactValue"><span aria-hidden="true">{{ value }}</span><span class="ui-visually-hidden">{{ exactValue ?? value }}</span></strong>
    <div v-if="change" class="ui-stat__change" :class="'ui-stat__change--' + changeDirection">
      <v-icon :icon="changeDirection === 'up' ? 'mdi-trending-up' : changeDirection === 'down' ? 'mdi-trending-down' : 'mdi-minus'" size="16" />
      <span>{{ change }}</span>
    </div>
    <p class="ui-stat__detail">{{ detail }}</p>
  </article>
</template>
