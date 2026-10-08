<script setup lang="ts">
import { computed } from 'vue'
import type { PageDefinition, PagePresentation } from '../../types/pageLayout'
import PillTabs from './PillTabs.vue'

const props = defineProps<{
  definition: PageDefinition
  presentation: PagePresentation
  headingId: string
  panelId: string
  tabsId: string
}>()
const emit = defineEmits<{ select: [value: string] }>()
const badge = computed(() => props.presentation.badge ?? props.definition.badge)
</script>

<template>
  <header class="header">
    <div class="header__content" :class="{ 'header__content--mobile-hidden': definition.mobileHeadingHidden }">
      <div class="header__copy">
        <h1 :id="headingId" class="header__title">{{ definition.title }}</h1>
        <p class="header__description">{{ definition.description }}</p>
      </div>
      <div class="header__metadata">
        <span v-for="item in presentation.metadata ?? []" :key="item.icon ?? item.label" class="header__detail">
          <v-icon v-if="item.icon" :icon="item.icon" size="16" />{{ item.label }}
        </span>
      </div>
      <div class="header__actions" :class="{ 'header__actions--multiple': presentation.badges?.length }">
        <v-chip v-for="item in presentation.badges ?? []" :key="item.label" :color="item.tone" size="small" variant="tonal">
          <v-icon v-if="item.icon" start :icon="item.icon" aria-hidden="true" />
          {{ item.label }}
        </v-chip>
        <v-chip
          v-if="badge"
          :color="badge.tone"
          size="small"
          variant="tonal"
        >
          <v-icon v-if="badge.icon" start :icon="badge.icon" />
          {{ badge.label }}
        </v-chip>
        <v-btn v-if="definition.action" :to="definition.action.to" :prepend-icon="definition.action.icon" variant="text">
          {{ definition.action.label }}
        </v-btn>
      </div>
    </div>
    <div class="header__filters" :hidden="!presentation.filter">
      <PillTabs
        mobile-compact
        :model-value="presentation.filter?.modelValue ?? ''"
        :items="presentation.filter?.items ?? []"
        :label="presentation.filter?.label ?? 'Page filters'"
        :tabs-id="tabsId"
        :panel-id="panelId"
        @update:model-value="emit('select', $event)"
      />
    </div>
  </header>
</template>
