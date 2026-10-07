<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useRoute } from 'vue-router'

import BrandLogo from '../components/ui/BrandLogo.vue'
import PublicEntryActions from '../components/public/PublicEntryActions.vue'
import { resolveApiUrl } from '../lib/apiUrl'
import { useAppTheme } from '../composables/useAppTheme'

const isMenuOpen = ref(false)
const route = useRoute()
const { smAndDown } = useDisplay()
const hasActionDock = computed(() => smAndDown.value && route.name === 'home')
const { isDark, initializeTheme, toggleTheme } = useAppTheme()
initializeTheme()
const apiDocsUrl = resolveApiUrl('/docs')

function closeMenu(): void {
  isMenuOpen.value = false
}

function handleMenuToggle(): void {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <v-app class="public-app" :class="{ 'public-app--with-dock': hasActionDock }">
    <a class="site-skip" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="site-header__inner">
        <RouterLink class="site-header__brand" to="/" aria-label="Plug & Nudge home" @click="closeMenu">
          <BrandLogo size="small" alt="" />
          <span>Plug <span class="site-header__brand-mark">&</span> Nudge</span>
        </RouterLink>
        <button class="site-header__menu-button" type="button" aria-controls="site-navigation" :aria-expanded="isMenuOpen" :aria-label="isMenuOpen ? 'Close menu' : 'Open menu'" @click="handleMenuToggle">
          <v-icon :icon="isMenuOpen ? 'mdi-close' : 'mdi-menu'" size="24" />
        </button>
        <nav id="site-navigation" class="site-header__nav" :class="{ 'site-header__nav--open': isMenuOpen }" aria-label="Main navigation">
          <RouterLink to="/#features" @click="closeMenu">Features</RouterLink>
          <RouterLink to="/#privacy" @click="closeMenu">Privacy &amp; control</RouterLink>
          <RouterLink to="/for-nudgers" @click="closeMenu">For creators &amp; developers</RouterLink>
          <button class="site-header__theme" type="button" :aria-label="isDark ? 'Use light mode' : 'Use dark mode'" @click="toggleTheme"><v-icon :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'" size="20" /></button>
          <RouterLink class="site-header__cta" to="/#get-app" @click="closeMenu">Get the app <span>Free</span><v-icon icon="mdi-arrow-up-right" size="18" /></RouterLink>
        </nav>
      </div>
    </header>

    <main id="main-content" class="site-main" tabindex="-1">
      <router-view :key="route.path" />
    </main>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="site-footer__top">
          <div>
            <RouterLink class="site-footer__brand" to="/"><BrandLogo size="small" alt="" /><span>Plug &amp; Nudge</span></RouterLink>
            <p>Your attention belongs to you.</p>
          </div>
          <nav class="site-footer__links" aria-label="Footer navigation">
            <RouterLink to="/privacy">Privacy Policy</RouterLink>
            <RouterLink to="/terms">Terms of Service</RouterLink>
            <RouterLink to="/security">Security Statement</RouterLink>
            <a :href="apiDocsUrl" target="_blank" rel="noopener noreferrer">Developer API Docs <span class="site-footer__external" aria-label="opens in a new tab">↗</span></a>
          </nav>
        </div>
        <div class="site-footer__bottom"><span>© {{ new Date().getFullYear() }} Plug &amp; Nudge</span><span>Private by design. In control by default.</span></div>
      </div>
    </footer>
    <PublicEntryActions v-if="hasActionDock" />
  </v-app>
</template>
