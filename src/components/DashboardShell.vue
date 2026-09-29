<script setup lang="ts">
import { computed, ref } from 'vue'

import { useAuth } from '../composables/useAuth'
import { navigateTo } from '../lib/navigation'
import IconGlyph from './IconGlyph.vue'

const { state, logout } = useAuth()
const isSidebarOpen = ref(false)
const isLoggingOut = ref(false)

const firstName = computed(() => {
  const name = state.user?.name?.trim()
  return name?.split(/\s+/)[0] || 'there'
})

const navigationItems = [
  { label: 'Overview', icon: 'sparkles' as const, isAvailable: true },
  { label: 'Broadcasts', icon: 'send' as const, isAvailable: false },
  { label: 'Audience', icon: 'users' as const, isAvailable: false },
  { label: 'Integrations', icon: 'link' as const, isAvailable: false },
]

function closeSidebar(): void {
  isSidebarOpen.value = false
}

async function handleLogout(): Promise<void> {
  if (isLoggingOut.value) {
    return
  }

  isLoggingOut.value = true
  try {
    await logout()
  } catch {
    // The local session is cleared by logout even when the server is unavailable.
  } finally {
    navigateTo('/login', true)
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="dashboard-shell" @keydown.esc="closeSidebar">
    <aside class="dashboard-sidebar" :class="{ 'dashboard-sidebar--open': isSidebarOpen }" aria-label="Workspace navigation">
      <div class="dashboard-sidebar__top">
        <a class="dashboard-brand" href="/" aria-label="Plug and Nudge home" @click="closeSidebar">
          <span class="dashboard-brand__mark" aria-hidden="true">
            <img src="/nudge-logo.png" alt="" />
          </span>
          <span>
            <strong>Nudger</strong>
            <small>by Plug &amp; Nudge</small>
          </span>
        </a>
        <button class="dashboard-sidebar__close" type="button" aria-label="Close navigation" @click="closeSidebar">
          <IconGlyph name="close" />
        </button>
      </div>

      <div class="dashboard-sidebar__body">
        <p class="dashboard-sidebar__label">Workspace</p>
        <nav class="dashboard-nav" aria-label="Workspace sections">
          <button
            v-for="item in navigationItems"
            :key="item.label"
            class="dashboard-nav__item"
            :class="{ 'dashboard-nav__item--active': item.isAvailable }"
            type="button"
            :disabled="!item.isAvailable"
            :aria-current="item.isAvailable ? 'page' : undefined"
            @click="closeSidebar"
          >
            <IconGlyph :name="item.icon" />
            <span>{{ item.label }}</span>
            <small v-if="!item.isAvailable">Soon</small>
          </button>
        </nav>

        <div class="dashboard-sidebar__note">
          <span class="dashboard-sidebar__note-icon"><IconGlyph name="bell" /></span>
          <strong>Your notification home</strong>
          <p>Useful updates for the people who choose to hear from you.</p>
        </div>
      </div>

      <div class="dashboard-account">
        <div class="dashboard-account__identity">
          <span class="dashboard-account__avatar" aria-hidden="true">{{ firstName.charAt(0).toUpperCase() }}</span>
          <span>
            <strong>{{ state.user?.name || 'Nudger account' }}</strong>
            <small>{{ state.user?.email }}</small>
          </span>
        </div>
        <button class="dashboard-account__logout" type="button" :disabled="isLoggingOut" :aria-busy="isLoggingOut" @click="handleLogout">
          <IconGlyph name="logout" />
          <span>{{ isLoggingOut ? 'Signing out…' : 'Sign out' }}</span>
        </button>
      </div>
    </aside>

    <button v-if="isSidebarOpen" class="dashboard-sidebar__backdrop" type="button" aria-label="Close navigation" @click="closeSidebar"></button>

    <div class="dashboard-content">
      <header class="dashboard-topbar">
        <button class="dashboard-topbar__menu" type="button" aria-label="Open navigation" :aria-expanded="isSidebarOpen" @click="isSidebarOpen = true">
          <IconGlyph name="menu" />
        </button>
        <div>
          <p class="dashboard-topbar__eyebrow">Nudger workspace <span>/</span> Overview</p>
          <h2>Overview</h2>
        </div>
        <div class="dashboard-topbar__status"><span></span> Workspace active</div>
      </header>

      <main id="main-content" class="dashboard-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 248px minmax(0, 1fr);
  color: var(--color-text);
  background: var(--color-canvas);
}

.dashboard-sidebar {
  position: sticky;
  top: 0;
  z-index: 12;
  display: flex;
  height: 100vh;
  flex-direction: column;
  padding: 22px 16px 18px;
  color: #dce4f1;
  background: #111b2e;
}

.dashboard-sidebar__top,
.dashboard-account__identity,
.dashboard-topbar,
.dashboard-topbar__status,
.dashboard-nav__item,
.dashboard-account__logout,
.dashboard-brand {
  display: flex;
  align-items: center;
}

.dashboard-sidebar__top {
  justify-content: space-between;
  gap: 10px;
}

.dashboard-brand {
  gap: 10px;
  min-height: 48px;
  color: #fff;
}

.dashboard-brand__mark {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  overflow: hidden;
  border-radius: 11px;
  background: #ff6b4a;
}

.dashboard-brand__mark img {
  width: 25px;
  height: 25px;
  object-fit: contain;
}

.dashboard-brand > span:last-child {
  display: grid;
  gap: 1px;
}

.dashboard-brand strong {
  font-size: 15px;
  letter-spacing: -0.02em;
}

.dashboard-brand small {
  color: #8f9db4;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.dashboard-sidebar__close,
.dashboard-topbar__menu {
  display: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  color: currentColor;
  background: transparent;
  cursor: pointer;
}

.dashboard-sidebar__close:hover,
.dashboard-topbar__menu:hover {
  background: rgba(255, 255, 255, 0.08);
}

.dashboard-sidebar__body {
  display: grid;
  gap: 12px;
  margin-top: 54px;
}

.dashboard-sidebar__label {
  margin: 0 10px 4px;
  color: #718099;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.dashboard-nav {
  display: grid;
  gap: 5px;
}

.dashboard-nav__item {
  width: 100%;
  min-height: 46px;
  gap: 12px;
  padding: 0 12px;
  border-radius: 13px;
  color: #91a0b8;
  background: transparent;
  font-size: 12px;
  font-weight: 750;
  text-align: left;
}

.dashboard-nav__item .icon-glyph {
  width: 18px;
  height: 18px;
}

.dashboard-nav__item--active {
  color: #fff;
  background: rgba(255, 107, 74, 0.16);
  box-shadow: inset 3px 0 0 #ff6b4a;
}

.dashboard-nav__item:not(:disabled):hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.07);
}

.dashboard-nav__item small {
  margin-left: auto;
  color: #6f7d95;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
}

.dashboard-sidebar__note {
  display: grid;
  gap: 7px;
  margin-top: 38px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
}

.dashboard-sidebar__note-icon {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 10px;
  color: #ffad9b;
  background: rgba(255, 107, 74, 0.15);
}

.dashboard-sidebar__note-icon .icon-glyph {
  width: 16px;
  height: 16px;
}

.dashboard-sidebar__note strong {
  color: #f5f7fb;
  font-size: 11px;
}

.dashboard-sidebar__note p {
  margin: 0;
  color: #8f9db4;
  font-size: 10px;
  line-height: 1.5;
}

.dashboard-account {
  display: grid;
  gap: 14px;
  margin-top: auto;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.dashboard-account__identity {
  min-width: 0;
  gap: 9px;
}

.dashboard-account__avatar {
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;
  border-radius: 11px;
  color: #ffb4a3;
  background: rgba(255, 107, 74, 0.18);
  font-size: 12px;
  font-weight: 850;
}

.dashboard-account__identity > span:last-child {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.dashboard-account__identity strong,
.dashboard-account__identity small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-account__identity strong {
  color: #f5f7fb;
  font-size: 11px;
}

.dashboard-account__identity small {
  color: #8492a9;
  font-size: 10px;
}

.dashboard-account__logout {
  justify-content: flex-start;
  gap: 10px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: 11px;
  color: #91a0b8;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  font-weight: 750;
  text-align: left;
}

.dashboard-account__logout:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.07);
}

.dashboard-account__logout .icon-glyph {
  width: 16px;
  height: 16px;
}

.dashboard-content {
  min-width: 0;
}

.dashboard-topbar {
  min-height: 86px;
  justify-content: space-between;
  gap: 20px;
  padding: 0 clamp(24px, 4vw, 56px);
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-canvas) 86%, transparent);
}

.dashboard-topbar__eyebrow {
  margin: 0 0 4px;
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.04em;
}

.dashboard-topbar__eyebrow span {
  margin-inline: 4px;
  color: var(--color-coral);
}

.dashboard-topbar h2 {
  margin: 0;
  color: var(--color-text);
  font-size: 20px;
  letter-spacing: -0.04em;
}

.dashboard-topbar__status {
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 750;
}

.dashboard-topbar__status span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.12);
}

.dashboard-main {
  width: min(100% - 48px, 1180px);
  margin-inline: auto;
  padding-block: clamp(34px, 5vw, 64px) 96px;
}

.dashboard-sidebar__backdrop {
  display: none;
}

@media (max-width: 860px) {
  .dashboard-shell {
    display: block;
  }

  .dashboard-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(86vw, 300px);
    box-shadow: 20px 0 50px rgba(3, 7, 18, 0.3);
    transform: translateX(-102%);
    transition: transform 180ms ease;
  }

  .dashboard-sidebar--open {
    transform: translateX(0);
  }

  .dashboard-sidebar__close,
  .dashboard-topbar__menu {
    display: grid;
  }

  .dashboard-sidebar__backdrop {
    position: fixed;
    z-index: 11;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    background: rgba(3, 7, 18, 0.55);
    cursor: pointer;
  }

  .dashboard-topbar {
    justify-content: flex-start;
  }

  .dashboard-topbar__status {
    margin-left: auto;
  }
}

@media (max-width: 560px) {
  .dashboard-topbar {
    min-height: 76px;
    padding-inline: 16px;
  }

  .dashboard-topbar__status {
    display: none;
  }

  .dashboard-main {
    width: min(100% - 32px, 1180px);
    padding-block: 32px 72px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-sidebar {
    transition: none;
  }
}
</style>
