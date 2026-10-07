<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

export interface DockAction {
  id: string
  label: string
  description?: string
  accessibleLabel?: string
  icon: string
  to: RouteLocationRaw
  isPrimary?: boolean
}

defineProps<{
  actions: DockAction[]
  isLoading?: boolean
}>()
</script>

<template>
  <nav class="ui-action-dock" aria-label="Quick actions" :aria-busy="isLoading">
    <div class="ui-action-dock__group">
      <p v-if="isLoading" class="ui-action-dock__status" role="status">Checking your session…</p>
      <RouterLink v-for="action in isLoading ? [] : actions" :key="action.id"
        class="ui-action-dock__action" :class="{ 'ui-action-dock__action--primary': action.isPrimary }"
        :to="action.to" :aria-label="action.accessibleLabel">
        <v-icon class="ui-action-dock__icon" :icon="action.icon" size="20" aria-hidden="true" />
        <span class="ui-action-dock__copy">
          <span class="ui-action-dock__label">{{ action.label }}</span>
          <span v-if="action.description" class="ui-action-dock__description">{{ action.description }}</span>
        </span>
      </RouterLink>
    </div>
  </nav>
</template>
