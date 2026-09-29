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
      <section class="workspace-intro" aria-labelledby="workspace-heading">
        <p class="eyebrow"><span class="eyebrow__dot"></span> Nudger workspace</p>
        <h1 id="workspace-heading">Welcome, {{ firstName }}.</h1>
        <p>Everything you need to reach the people who choose your updates will live here.</p>
      </section>

      <section class="workspace-empty" aria-labelledby="empty-heading">
        <div class="workspace-empty__icon" aria-hidden="true">
          <IconGlyph name="layers" />
        </div>
        <p class="panel-label">Your workspace is ready</p>
        <h2 id="empty-heading">Your Nudger dashboard is empty for now.</h2>
        <p class="workspace-empty__copy">Once your profile and first audience are set up, this is where your updates, delivery activity, and workspace signals will appear.</p>

        <div class="workspace-empty__steps" aria-label="Workspace setup preview">
          <div class="workspace-empty__step">
            <span>01</span>
            <div>
              <strong>Set up your profile</strong>
              <small>Tell people who is sending the update.</small>
            </div>
          </div>
          <div class="workspace-empty__step">
            <span>02</span>
            <div>
              <strong>Connect your audience</strong>
              <small>Choose the people and tiers you want to reach.</small>
            </div>
          </div>
          <div class="workspace-empty__step">
            <span>03</span>
            <div>
              <strong>Send the moment</strong>
              <small>Share a useful update when it matters.</small>
            </div>
          </div>
        </div>
      </section>
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

.workspace-intro {
  max-width: 760px;
}

.workspace-intro h1 {
  max-width: 720px;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(3rem, 7vw, 6rem);
  font-weight: 850;
  letter-spacing: -0.075em;
  line-height: 0.96;
  text-wrap: balance;
}

.workspace-intro > p:last-child {
  max-width: 580px;
  margin: 24px 0 0;
  color: var(--color-text-muted);
  font-size: 18px;
  line-height: 1.6;
}

.workspace-empty {
  width: min(100%, 900px);
  padding: clamp(28px, 5vw, 48px);
  border: 1px solid var(--color-border);
  border-radius: 32px;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.workspace-empty__icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 18px;
  color: #c4c8ff;
  background: rgba(79, 70, 229, 0.2);
}

.workspace-empty__icon .icon-glyph {
  width: 26px;
  height: 26px;
}

.workspace-empty .panel-label {
  margin-top: 28px;
  color: #ffad9b;
}

.workspace-empty h2 {
  max-width: 700px;
  margin: 12px 0 0;
  color: var(--color-text);
  font-size: clamp(2rem, 4vw, 3.6rem);
  font-weight: 850;
  letter-spacing: -0.06em;
  line-height: 1;
}

.workspace-empty__copy {
  max-width: 620px;
  margin: 18px 0 0;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.6;
}

.workspace-empty__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 36px;
}

.workspace-empty__step {
  min-height: 136px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
}

.workspace-empty__step > span {
  color: #ff9a83;
  font-size: 12px;
  font-weight: 850;
  letter-spacing: 0.1em;
}

.workspace-empty__step div {
  display: grid;
  gap: 6px;
  margin-top: 22px;
}

.workspace-empty__step strong {
  color: var(--color-text);
  font-size: 14px;
}

.workspace-empty__step small {
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.45;
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

  .workspace-empty__steps {
    grid-template-columns: 1fr;
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
