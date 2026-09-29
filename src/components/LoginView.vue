<script setup lang="ts">
import { ref } from 'vue'

import IconGlyph from './IconGlyph.vue'

interface LoginViewProps {
  googleAuthUrl: string
  isDarkMode: boolean
}

const props = defineProps<LoginViewProps>()

const emit = defineEmits<{
  'toggle-color-mode': []
}>()

const isConnecting = ref(false)
const authMessage = ref('')

function handleGoogleSignIn(): void {
  if (!props.googleAuthUrl) {
    authMessage.value = 'Google sign-in will be available when the Nudger auth service is connected.'
    return
  }

  isConnecting.value = true
  window.location.assign(props.googleAuthUrl)
}
</script>

<template>
  <div class="entry-screen">
    <header class="entry-screen__header">
      <a class="brand" href="/" aria-label="Plug and Nudge home">
        <span class="brand__mark" aria-hidden="true">
          <img class="brand__image" src="/nudge-logo.png" alt="" />
        </span>
        <span class="brand__name">Plug <span>&amp;</span> Nudge</span>
      </a>

      <button
        class="mode-button"
        type="button"
        :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="emit('toggle-color-mode')"
      >
        <IconGlyph :name="isDarkMode ? 'sun' : 'moon'" />
        <span>{{ isDarkMode ? 'Light mode' : 'Dark mode' }}</span>
      </button>
    </header>

    <main class="entry-screen__main" aria-labelledby="login-heading">
      <a class="entry-screen__back-link" href="/">← Back to Plug &amp; Nudge</a>

      <section class="entry-card" aria-describedby="login-description">
        <div class="entry-card__mark" aria-hidden="true">
          <img class="entry-card__logo" src="/nudge-logo.png" alt="" />
        </div>
        <p class="eyebrow"><span class="eyebrow__dot"></span> Nudger workspace</p>
        <h1 id="login-heading">Welcome back.</h1>
        <p id="login-description" class="entry-card__description">
          Sign in to manage the platform and creator updates your audience chooses to receive.
        </p>

        <button class="google-button" type="button" :disabled="isConnecting" @click="handleGoogleSignIn">
          <IconGlyph name="google" />
          <span>{{ isConnecting ? 'Connecting to Google…' : 'Continue with Google' }}</span>
        </button>

        <p v-if="authMessage" class="entry-card__status" role="status">{{ authMessage }}</p>
        <p class="entry-card__note">Nudger is for platforms and creators. Nudgee users receive updates in the mobile app.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.entry-screen {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr;
  padding-inline: max(20px, calc((100% - 1180px) / 2));
}

.entry-screen__header {
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid var(--color-border);
}

.entry-screen__main {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 24px;
  padding: 64px 0 96px;
}

.entry-screen__back-link {
  min-height: 48px;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 700;
}

.entry-screen__back-link:hover {
  color: var(--color-text);
}

.entry-card {
  position: relative;
  width: min(100%, 480px);
  overflow: hidden;
  padding: clamp(32px, 6vw, 56px);
  border: 1px solid var(--color-border);
  border-radius: 32px;
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  text-align: center;
}

.entry-card::before {
  position: absolute;
  width: 280px;
  height: 280px;
  top: -154px;
  left: 50%;
  border-radius: 50%;
  background: rgba(255, 107, 74, 0.18);
  content: '';
  filter: blur(12px);
  pointer-events: none;
  transform: translateX(-50%);
}

.entry-card > * {
  position: relative;
}

.entry-card__mark {
  display: grid;
  width: 64px;
  height: 64px;
  margin: 0 auto 28px;
  place-items: center;
  border: 1px solid rgba(255, 107, 74, 0.36);
  border-radius: 20px;
  background: rgba(255, 107, 74, 0.1);
}

.entry-card__logo {
  display: block;
  width: 44px;
  height: 32px;
  object-fit: contain;
}

.entry-card .eyebrow {
  margin-bottom: 16px;
}

.entry-card h1 {
  margin: 0;
  font-size: clamp(2.5rem, 7vw, 4.25rem);
  font-weight: 850;
  letter-spacing: -0.07em;
  line-height: 0.98;
  text-wrap: balance;
}

.entry-card__description {
  max-width: 34rem;
  margin: 20px auto 32px;
  color: var(--color-text-muted);
  font-size: 16px;
  line-height: 1.6;
  text-wrap: pretty;
}

.google-button {
  display: inline-flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 20px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16px;
  color: #172033;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(3, 7, 18, 0.16);
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.google-button:hover:not(:disabled) {
  box-shadow: 0 16px 32px rgba(3, 7, 18, 0.22);
  transform: translateY(-2px);
}

.google-button:disabled {
  cursor: progress;
  opacity: 0.72;
}

.google-button .icon-glyph {
  width: 21px;
  height: 21px;
}

.entry-card__status {
  margin: 16px 0 0;
  color: var(--color-coral);
  font-size: 13px;
  line-height: 1.5;
}

.entry-card__note {
  margin: 24px 0 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.55;
}

@media (max-width: 560px) {
  .entry-screen {
    padding-inline: 16px;
  }

  .entry-screen__header {
    min-height: 68px;
  }

  .entry-screen__header .brand__name {
    display: none;
  }

  .entry-screen__main {
    padding: 40px 0 64px;
  }

  .entry-card {
    border-radius: 24px;
  }

  .mode-button {
    min-height: 44px;
  }

  .mode-button span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .google-button {
    transition: none;
  }
}
</style>
