<script setup lang="ts">
interface SectionHeaderProps {
  headingId?: string
  eyebrow?: string
  title: string
  description?: string
  actionLabel?: string
}

withDefaults(defineProps<SectionHeaderProps>(), {
  headingId: undefined,
  eyebrow: undefined,
  description: undefined,
  actionLabel: undefined,
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="section-header">
    <div class="section-header__copy">
      <span v-if="eyebrow" class="section-header__eyebrow">{{ eyebrow }}</span>
      <h1 :id="headingId" class="section-header__title">{{ title }}</h1>
      <p v-if="description" class="section-header__description">{{ description }}</p>
    </div>
    <v-btn v-if="actionLabel" class="section-header__action" color="primary" @click="emit('action')">
      {{ actionLabel }}
    </v-btn>
    <slot name="action" />
  </div>
</template>
