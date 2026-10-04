<script setup lang="ts">
import { computed, ref } from 'vue'

import { useAuth } from '../composables/useAuth'
import { navigateTo } from '../lib/navigation'
import IconGlyph from './IconGlyph.vue'

const { state, logout } = useAuth()
const isLoggingOut = ref(false)

const firstName = computed(() => {
  const name = state.user?.name?.trim()
  return name?.split(/\s+/)[0] || 'there'
})

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
  <div class="workspace-shell">
    <header class="workspace-header">
      <a class="brand" href="/" aria-label="Plug and Nudge home">
        <span class="brand__mark" aria-hidden="true">
          <img class="brand__image" src="/nudge-logo.png" alt="" />
        </span>
        <span class="brand__name">Plug <span>&amp;</span> Nudge</span>
      </a>

      <div class="workspace-header__account">
        <div class="workspace-header__identity">
          <span class="workspace-header__avatar" aria-hidden="true">{{ firstName.charAt(0).toUpperCase() }}</span>
          <span class="workspace-header__details">
            <strong>{{ state.user?.name || 'Nudger account' }}</strong>
            <small>{{ state.user?.email }}</small>
          </span>
        </div>
        <button class="button button--small button--outline" type="button" :disabled="isLoggingOut" :aria-busy="isLoggingOut" @click="handleLogout">
          <IconGlyph name="logout" />
          {{ isLoggingOut ? 'Signing out…' : 'Sign out' }}
        </button>
      </div>
    </header>

    <main class="workspace-main" id="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.workspace-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 88% 0%, rgba(79, 70, 229, 0.2), transparent 30rem),
    radial-gradient(circle at 8% 24%, rgba(255, 107, 74, 0.11), transparent 24rem),
    var(--color-canvas);
}

.workspace-header {
  display: flex;
  width: min(100% - 40px, 1180px);
  min-height: 84px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-inline: auto;
  border-bottom: 1px solid var(--color-border);
}

.workspace-header__account,
.workspace-header__identity {
  display: flex;
  align-items: center;
}

.workspace-header__account {
  gap: 20px;
}

.workspace-header__identity {
  gap: 10px;
}

.workspace-header__avatar {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 14px;
  color: #ffb4a3;
  background: rgba(255, 107, 74, 0.18);
  font-size: 15px;
  font-weight: 850;
}

.workspace-header__details {
  display: grid;
  gap: 2px;
}

.workspace-header__details strong {
  max-width: 190px;
  overflow: hidden;
  color: var(--color-text);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-header__details small {
  max-width: 190px;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-header .button .icon-glyph {
  width: 17px;
  height: 17px;
}

.workspace-main {
  display: grid;
  width: min(100% - 40px, 1180px);
  gap: 48px;
  margin-inline: auto;
  padding-block: clamp(64px, 9vw, 112px) 128px;
}

@media (max-width: 720px) {
  .workspace-header {
    width: min(100% - 32px, 1180px);
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
    padding-block: 16px;
  }

  .workspace-header__account {
    width: 100%;
    justify-content: space-between;
  }

  .workspace-main {
    width: min(100% - 32px, 1180px);
    gap: 36px;
    padding-block: 64px 80px;
  }
}

@media (max-width: 420px) {
  .workspace-header__details {
    display: none;
  }

  .workspace-header__account {
    justify-content: flex-end;
  }
}
</style>
