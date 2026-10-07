<script setup lang="ts">
import ChoiceCards from '../ui/ChoiceCards.vue'
import { useAppTheme, type AppThemePreference } from '../../composables/useAppTheme'
import type { ChoiceCardItem } from '../../types/choiceCards'

const { preference, setTheme } = useAppTheme()
const options: ChoiceCardItem<AppThemePreference>[] = [
  { value: 'light', title: 'Light', icon: 'mdi-white-balance-sunny' },
  { value: 'dark', title: 'Dark', icon: 'mdi-weather-night' },
  { value: 'system', title: 'System', icon: 'mdi-monitor-cellphone' },
]
</script>

<template>
  <section class="ui-detail-card">
    <div class="ui-detail-card__heading"><v-icon icon="mdi-tune-variant" size="22" aria-hidden="true" /><h2 class="ui-detail-card__title">Settings</h2></div>
    <div class="ui-detail-card__settings">
      <ChoiceCards :model-value="preference" :items="options" label="Appearance" variant="inline"
        hint="System follows your device. Changes apply instantly and are remembered in this browser."
        @update:model-value="setTheme" />
    </div>
  </section>
</template>
