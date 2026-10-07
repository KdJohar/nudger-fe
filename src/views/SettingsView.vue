<script setup lang="ts">
import { ref } from 'vue'

import SectionHeader from '../components/ui/SectionHeader.vue'
import { useAppTheme, type AppThemeName } from '../composables/useAppTheme'

const { isDark, setTheme } = useAppTheme()
const isEmailReportsEnabled = ref(true)
const isWeeklyDigestEnabled = ref(false)

function handleThemeChange(themeName: AppThemeName): void {
  setTheme(themeName)
}
</script>

<template>
  <section class="page-view" aria-labelledby="settings-heading">
    <SectionHeader heading-id="settings-heading" eyebrow="Workspace / Settings" title="Settings" description="Make the workspace feel like yours." />

    <v-row class="content-grid settings-grid">
      <v-col cols="12" lg="8">
        <v-card class="surface-card" variant="flat">
          <v-card-text>
            <div class="surface-card__eyebrow">Appearance</div>
            <div class="surface-card__title surface-card__title--small">Choose your workspace mood</div>
            <div class="theme-picker" role="radiogroup" aria-label="Theme preference">
              <button class="theme-picker__option" :class="{ 'theme-picker__option--selected': !isDark }" type="button" @click="handleThemeChange('light')">
                <span class="theme-preview theme-preview--light"><span class="theme-preview__top" /><span class="theme-preview__body"><span /><span /><span /></span></span>
                <span class="theme-picker__label"><v-icon :color="!isDark ? 'secondary' : undefined" :icon="!isDark ? 'mdi-check-circle' : 'mdi-circle-outline'" size="18" /> Light mode</span>
              </button>
              <button class="theme-picker__option" :class="{ 'theme-picker__option--selected': isDark }" type="button" @click="handleThemeChange('dark')">
                <span class="theme-preview theme-preview--dark"><span class="theme-preview__top" /><span class="theme-preview__body"><span /><span /><span /></span></span>
                <span class="theme-picker__label"><v-icon :color="isDark ? 'secondary' : undefined" :icon="isDark ? 'mdi-check-circle' : 'mdi-circle-outline'" size="18" /> Dark mode</span>
              </button>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="surface-card" variant="flat">
          <v-card-text>
            <div class="surface-card__eyebrow">Notifications</div>
            <div class="surface-card__title surface-card__title--small">Stay in the loop</div>
            <div class="settings-list">
              <div class="settings-list__item"><div><div class="data-table__strong">Email reports</div><div class="data-table__muted">Receive a summary of your workspace performance.</div></div><v-switch v-model="isEmailReportsEnabled" aria-label="Toggle email reports" color="secondary" hide-details /></div>
              <v-divider />
              <div class="settings-list__item"><div><div class="data-table__strong">Weekly digest</div><div class="data-table__muted">A Monday morning recap of your most important signals.</div></div><v-switch v-model="isWeeklyDigestEnabled" aria-label="Toggle weekly digest" color="secondary" hide-details /></div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card class="surface-card surface-card--soft" variant="flat">
          <v-card-text>
            <v-avatar color="primary" size="42" variant="tonal"><v-icon icon="mdi-palette-outline" /></v-avatar>
            <div class="surface-card__title surface-card__title--small settings-card__title">Your brand system</div>
            <p class="surface-card__description">Plug&Nudge uses coral for subtle brand accents and indigo for hover, selected, and active states.</p>
            <div class="color-swatches"><span class="color-swatch color-swatch--primary"><span>#FF6B4A</span></span><span class="color-swatch color-swatch--secondary"><span>#4338CA</span></span></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>
