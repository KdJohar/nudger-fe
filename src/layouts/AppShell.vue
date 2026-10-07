<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useRoute, useRouter } from 'vue-router'
import { NAVIGATION_ITEMS } from '../data/navigation'
import { useAppTheme } from '../composables/useAppTheme'
import { useAuth } from '../composables/useAuth'
import BrandLogo from '../components/ui/BrandLogo.vue'
import Avatar from '../components/ui/Avatar.vue'
import PageLayout from '../components/ui/PageLayout.vue'
import { WORKSPACE_PAGES } from '../data/workspacePages'

const route = useRoute()
const router = useRouter()
const { smAndDown } = useDisplay()
const { isDark, initializeTheme, toggleTheme } = useAppTheme()
const { state, displayName, logout } = useAuth()

const isBottomNavigationCompact = ref(false)
const pageTitle = computed(() => String(route.meta.title ?? 'Audience'))
const pageDefinition = computed(() => WORKSPACE_PAGES[String(route.name)] ?? { title: pageTitle.value, description: '' })
const visibleNavigationItems = computed(() => NAVIGATION_ITEMS.filter((item) => !item.platformOnly || state.merchantProfile?.profile_type === 'platform'))
const mobileNavigationItems = computed(() => visibleNavigationItems.value
  .filter(item => item.mobileOrder !== undefined)
  .sort((first, second) => first.mobileOrder! - second.mobileOrder!))
const initials = computed(() => displayName.value.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase())
let previousScrollTop = 0
let scrollIdleTimer: number | undefined

initializeTheme()

function handleWindowScroll(): void {
  const currentScrollTop = Math.max(window.scrollY, 0)
  const scrollDelta = currentScrollTop - previousScrollTop
  previousScrollTop = currentScrollTop

  if (!smAndDown.value) {
    isBottomNavigationCompact.value = false
    return
  }

  if (Math.abs(scrollDelta) >= 4) {
    isBottomNavigationCompact.value = scrollDelta > 0 && currentScrollTop > 24
  }

  if (scrollIdleTimer !== undefined) window.clearTimeout(scrollIdleTimer)
  scrollIdleTimer = window.setTimeout(() => {
    isBottomNavigationCompact.value = false
  }, 500)
}

onMounted(() => {
  previousScrollTop = window.scrollY
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleWindowScroll)
  if (scrollIdleTimer !== undefined) window.clearTimeout(scrollIdleTimer)
})

async function signOut(): Promise<void> {
  await logout()
  await router.push('/login')
}
</script>

<template>
  <v-app>
    <a class="app-shell__skip-link" href="#main-content">Skip to main content</a>
    <v-navigation-drawer v-if="!smAndDown" :model-value="true" class="app-drawer" permanent width="272">
      <div class="app-drawer__brand">
        <BrandLogo alt="Plug&Nudge logo" size="small" />
        <div><div class="app-drawer__brand-name">Plug<span>&</span>Nudge</div><div class="app-drawer__brand-caption">Nudger workspace</div></div>
      </div>
      <v-divider class="app-drawer__divider" />
      <div class="app-drawer__section-label">Workspace</div>
      <v-list class="app-nav" nav density="comfortable">
        <v-list-item v-for="item in visibleNavigationItems" :key="item.to" class="app-nav__item" active-class="app-nav__item--active" :prepend-icon="item.icon" :subtitle="item.description" :title="item.label" :to="item.to" />
      </v-list>
      <template #append>
        <div class="app-drawer__footer">
          <v-switch
            v-if="!smAndDown"
            class="app-drawer__theme-toggle"
            :model-value="isDark"
            label="Dark mode"
            color="secondary"
            true-icon="mdi-weather-night"
            false-icon="mdi-white-balance-sunny"
            hide-details
            inset
            @update:model-value="toggleTheme"
          />
          <div class="app-drawer__insight-card"><v-icon class="app-drawer__help-icon" icon="mdi-shield-check-outline" size="20" /><div><div class="app-drawer__help-title">Nudger workspace</div><div class="app-drawer__help-copy">Your account is protected</div></div></div>
          <div class="app-drawer__profile"><v-avatar color="secondary" size="38">{{ initials }}</v-avatar><div class="app-drawer__profile-copy"><div class="app-drawer__profile-name">{{ displayName }}</div><div class="app-drawer__profile-role">{{ state.merchantProfile?.profile_type === 'platform' ? 'Platform' : 'Creator' }}</div></div><v-btn aria-label="Sign out" icon="mdi-logout-variant" size="small" variant="text" @click="signOut" /></div>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Absolute layout mode preserves header space but lets the bar scroll with the document. -->
    <v-app-bar v-if="smAndDown" class="app-bar" absolute flat>
      <v-app-bar-title class="app-bar__title">{{ pageTitle }}</v-app-bar-title>
      <div class="app-bar__mobile-brand" aria-label="Plug&Nudge"><BrandLogo alt="Plug&Nudge logo" size="small" /></div>
      <div class="app-bar__actions"><div class="app-bar__context"><span class="app-bar__context-dot" /> Live workspace</div></div>
    </v-app-bar>

    <v-main id="main-content" class="app-main">
      <v-container class="app-main__container" fluid>
        <PageLayout :page-key="String(route.name ?? route.path)" :definition="pageDefinition">
          <router-view v-slot="{ Component }"><Suspense><component :is="Component" /><template #fallback><div class="app-loading" role="status"><v-progress-circular color="primary" indeterminate /><span>Loading workspace…</span></div></template></Suspense></router-view>
        </PageLayout>
      </v-container>
    </v-main>

    <v-bottom-navigation v-if="smAndDown" class="app-bottom-nav" :class="{ 'app-bottom-nav--compact': isBottomNavigationCompact }" grow aria-label="Workspace navigation">
      <v-btn v-for="item in mobileNavigationItems" :key="item.to" :to="item.to" :value="item.to"
        :class="{ 'app-bottom-nav__avatar': item.mobileVariant === 'avatar' }" :aria-label="item.mobileLabel ?? item.label">
        <Avatar v-if="item.mobileVariant === 'avatar'" :src="state.merchantProfile?.profile_image_url" />
        <template v-else><v-icon :icon="item.icon" /><span>{{ item.mobileLabel ?? item.label }}</span></template>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
