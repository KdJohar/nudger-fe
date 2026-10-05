<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

import DashboardShell from './DashboardShell.vue'
import IconGlyph from './IconGlyph.vue'
import { useAuth } from '../composables/useAuth'
import { ApiError } from '../lib/api'
import { generateMerchantApiToken, getMerchantApiToken, rotateMerchantApiToken } from '../lib/apiToken'
import type { MerchantApiTokenData } from '../types/apiToken'

const { state } = useAuth()
const tokenStatus = ref<MerchantApiTokenData | null>(null)
const issuedToken = ref<string | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const copied = ref(false)
const isIssuedTokenVisible = ref(false)
let copyResetTimer: number | null = null

const isPlatformMerchant = computed(() => state.merchantProfile?.profile_type === 'platform')
const tokenExists = computed(() => tokenStatus.value?.has_token === true)
const tokenActionLabel = computed(() => tokenExists.value ? 'Rotate token' : 'Generate token')
const displayedIssuedToken = computed(() => {
  if (!issuedToken.value || isIssuedTokenVisible.value) {
    return issuedToken.value ?? ''
  }

  return `${issuedToken.value.slice(0, 20)}••••••••`
})
const tokenVisibilityLabel = computed(() => isIssuedTokenVisible.value ? 'Hide token' : 'Show token')

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not generated yet'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === 'MERCHANT_API_TOKEN_FORBIDDEN') {
    return 'API tokens are available only to approved platform profiles.'
  }
  return error instanceof Error ? error.message : 'API token could not be loaded. Please try again.'
}

async function loadTokenStatus(): Promise<void> {
  if (!isPlatformMerchant.value) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = null
  try {
    const response = await getMerchantApiToken()
    tokenStatus.value = response.data
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

watch(
  [isPlatformMerchant, () => state.isInitialized],
  ([isPlatform, isInitialized]) => {
    if (!isInitialized) {
      return
    }

    if (isPlatform && tokenStatus.value === null) {
      void loadTokenStatus()
      return
    }

    if (!isPlatform) {
      isLoading.value = false
    }
  },
  { immediate: true },
)

async function handleTokenAction(): Promise<void> {
  if (isSubmitting.value) {
    return
  }

  if (tokenExists.value && !window.confirm('Rotate this token? The current token will stop working immediately.')) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = null
  successMessage.value = null
  issuedToken.value = null
  isIssuedTokenVisible.value = false
  copied.value = false

  try {
    const response = tokenExists.value
      ? await rotateMerchantApiToken()
      : await generateMerchantApiToken()
    tokenStatus.value = response.data
    issuedToken.value = response.data.token
    successMessage.value = response.message
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

function handleIssuedTokenVisibility(): void {
  isIssuedTokenVisible.value = !isIssuedTokenVisible.value
}

async function handleCopy(): Promise<void> {
  if (!issuedToken.value) {
    return
  }

  try {
    await navigator.clipboard.writeText(issuedToken.value)
    copied.value = true
    if (copyResetTimer !== null) {
      window.clearTimeout(copyResetTimer)
    }
    copyResetTimer = window.setTimeout(() => {
      copied.value = false
      copyResetTimer = null
    }, 2400)
  } catch {
    errorMessage.value = 'The token could not be copied. Select it and copy it manually.'
  }
}

onUnmounted(() => {
  if (copyResetTimer !== null) {
    window.clearTimeout(copyResetTimer)
  }
})
</script>

<template>
  <DashboardShell>
    <section class="token-page" aria-labelledby="token-heading">
      <div class="token-page__intro">
        <div>
          <p class="token-page__eyebrow"><span aria-hidden="true"></span> Developer access</p>
          <h1 id="token-heading">Connect your sending tools.</h1>
          <p class="token-page__lede">Use one secure token to connect your platform to Nudger. Rotate it whenever access needs to change.</p>
        </div>
        <div class="token-page__badge" aria-label="Platform API access">
          <IconGlyph name="key" />
          <span><strong>Platform only</strong><small>One active token</small></span>
        </div>
      </div>

      <div v-if="isLoading" class="token-card token-card--loading" aria-busy="true" aria-label="Loading API token status">
        <div class="token-card__skeleton token-card__skeleton--short"></div>
        <div class="token-card__skeleton"></div>
        <div class="token-card__skeleton token-card__skeleton--button"></div>
      </div>

      <div v-else-if="errorMessage" class="token-card token-card--error" role="alert">
        <IconGlyph name="close" />
        <div>
          <strong>Token access is unavailable.</strong>
          <p>{{ errorMessage }}</p>
          <button type="button" class="token-page__button token-page__button--dark" @click="void loadTokenStatus()">Try again</button>
        </div>
      </div>

      <div v-else-if="isPlatformMerchant" class="token-layout">
        <article class="token-card" aria-labelledby="token-card-heading">
          <div class="token-card__header">
            <div class="token-card__icon" aria-hidden="true"><IconGlyph name="key" /></div>
            <div>
              <p class="token-card__eyebrow">API credential</p>
              <h2 id="token-card-heading">{{ tokenExists ? 'Your token is active' : 'Create your first token' }}</h2>
            </div>
          </div>

          <p v-if="!tokenExists" class="token-card__copy">Generate one token for your platform integration. You will see the secret once and can rotate it later.</p>
          <p v-else class="token-card__copy">The current secret is hidden after creation. Rotate it if you need to replace access for your integration.</p>

          <dl class="token-card__details">
            <div>
              <dt>Status</dt>
              <dd><span class="token-card__status-dot" aria-hidden="true"></span>{{ tokenExists ? 'Active' : 'Not generated' }}</dd>
            </div>
            <div v-if="tokenExists && tokenStatus?.token_prefix">
              <dt>Token</dt>
              <dd><code class="token-card__prefix">{{ tokenStatus.token_prefix }}••••••••</code></dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ formatDate(tokenStatus?.created_at ?? null) }}</dd>
            </div>
            <div v-if="tokenStatus?.rotated_at">
              <dt>Last rotated</dt>
              <dd>{{ formatDate(tokenStatus.rotated_at) }}</dd>
            </div>
          </dl>

          <button type="button" class="token-page__button token-page__button--primary" :disabled="isSubmitting" :aria-busy="isSubmitting" @click="void handleTokenAction()">
            <IconGlyph name="key" />
            {{ isSubmitting ? 'Working…' : tokenActionLabel }}
          </button>
        </article>

        <aside class="token-card token-card--accent" aria-labelledby="token-guidance-heading">
          <p class="token-card__eyebrow">Keep it safe</p>
          <h2 id="token-guidance-heading">Treat it like a password.</h2>
          <ul class="token-card__guidance">
            <li><IconGlyph name="check" /><span>Store it in your server environment, never in browser code.</span></li>
            <li><IconGlyph name="check" /><span>Copy it now—the full secret is not shown again.</span></li>
            <li><IconGlyph name="check" /><span>Rotation invalidates the previous token immediately.</span></li>
          </ul>
        </aside>

        <div v-if="issuedToken" class="token-card token-card--issued" role="status" aria-live="polite">
          <div>
            <p class="token-card__eyebrow">New token · copy now</p>
            <h2>Your secret is ready.</h2>
            <p class="token-card__copy">This is the only time the full token will be visible.</p>
          </div>
          <div class="token-card__secret-row">
            <code class="token-card__secret" tabindex="0">{{ displayedIssuedToken }}</code>
            <button
              type="button"
              class="token-page__button token-page__button--light"
              :aria-label="tokenVisibilityLabel"
              :aria-pressed="isIssuedTokenVisible"
              @click="handleIssuedTokenVisibility"
            >
              <IconGlyph :name="isIssuedTokenVisible ? 'eye-off' : 'eye'" />
              {{ tokenVisibilityLabel }}
            </button>
            <button type="button" class="token-page__button token-page__button--light" @click="void handleCopy()">
              <IconGlyph name="copy" />
              {{ copied ? 'Copied' : 'Copy token' }}
            </button>
          </div>
          <p v-if="successMessage" class="token-card__success">{{ successMessage }}</p>
        </div>
      </div>

      <div v-else class="token-card token-card--notice" role="status">
        <IconGlyph name="key" />
        <div>
          <strong>API tokens are for platform profiles.</strong>
          <p>Creator profiles send broadcast updates through the creator experience and do not need a platform API token.</p>
        </div>
      </div>
    </section>
  </DashboardShell>
</template>

<style scoped>
.token-page {
  display: grid;
  gap: 28px;
}

.token-page__intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
}

.token-page__eyebrow,
.token-card__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  color: var(--color-coral);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.token-page__eyebrow span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.token-page h1 {
  max-width: 700px;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2.8rem, 6vw, 5.2rem);
  font-weight: 850;
  letter-spacing: -0.075em;
  line-height: 0.96;
}

.token-page__lede {
  max-width: 580px;
  margin: 24px 0 0;
  color: var(--color-text-muted);
  font-size: 16px;
  line-height: 1.6;
}

.token-page__badge,
.token-card__header,
.token-card__details div,
.token-card__secret-row,
.token-card--notice {
  display: flex;
  align-items: center;
}

.token-page__badge {
  gap: 12px;
  min-width: 190px;
  padding: 13px 15px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  color: var(--color-text);
  background: var(--color-surface-strong);
}

.token-page__badge > svg {
  color: var(--color-coral);
}

.token-page__badge span {
  display: grid;
  gap: 4px;
}

.token-page__badge strong,
.token-page__badge small {
  font-size: 11px;
}

.token-page__badge small {
  color: var(--color-text-muted);
}

.token-card {
  display: grid;
  gap: 24px;
  padding: clamp(22px, 4vw, 34px);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.token-card--loading {
  min-height: 310px;
  align-content: center;
}

.token-card__skeleton {
  width: 64%;
  height: 18px;
  border-radius: 8px;
  background: var(--color-border);
  opacity: 0.55;
}

.token-card__skeleton--short {
  width: 28%;
}

.token-card__skeleton--button {
  width: 150px;
  height: 48px;
}

.token-card--error,
.token-card--notice {
  grid-template-columns: auto 1fr;
  align-items: start;
}

.token-card--error > svg,
.token-card--notice > svg {
  width: 28px;
  height: 28px;
  color: var(--color-coral);
}

.token-card--error strong,
.token-card--notice strong {
  font-size: 16px;
}

.token-card--error p,
.token-card--notice p {
  margin: 8px 0 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.token-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.8fr);
  gap: 18px;
}

.token-card__header {
  gap: 14px;
}

.token-card__icon {
  display: grid;
  width: 48px;
  height: 48px;
  flex: none;
  place-items: center;
  border-radius: 15px;
  color: #fff;
  background: var(--color-coral);
}

.token-card__eyebrow {
  margin-bottom: 6px;
  font-size: 10px;
}

.token-card h2 {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.45rem, 3vw, 2.2rem);
  font-weight: 850;
  letter-spacing: -0.055em;
}

.token-card__copy {
  max-width: 580px;
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.token-card__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.token-card__details div {
  min-height: 68px;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: 15px;
  background: var(--color-background);
}

.token-card__details dt {
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.token-card__details dd {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--color-text);
  font-size: 12px;
  font-weight: 800;
}

.token-card__prefix {
  max-width: 100%;
  overflow: hidden;
  color: var(--color-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.token-card__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10b981;
}

.token-page__button {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  padding: 0 17px;
  border: 1px solid transparent;
  border-radius: 13px;
  font-size: 12px;
  font-weight: 850;
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.token-page__button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.token-page__button:focus-visible {
  outline: 3px solid var(--color-coral);
  outline-offset: 3px;
}

.token-page__button:disabled {
  cursor: progress;
  opacity: 0.6;
}

.token-page__button--primary {
  color: #fff;
  background: #111b2e;
}

.token-page__button--dark {
  margin-top: 18px;
  color: #fff;
  background: #111b2e;
}

.token-page__button--light {
  color: var(--color-text);
  border-color: var(--color-border);
  background: var(--color-surface);
}

.token-card--accent {
  color: #fff;
  border-color: transparent;
  background: #111b2e;
}

.token-card--accent h2 {
  color: #fff;
}

.token-card--accent .token-card__eyebrow {
  color: #ffb09c;
}

.token-card__guidance {
  display: grid;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.token-card__guidance li {
  display: flex;
  gap: 10px;
  color: #c9d4e5;
  font-size: 12px;
  line-height: 1.55;
}

.token-card__guidance svg {
  width: 18px;
  height: 18px;
  flex: none;
  color: #ffb09c;
}

.token-card--issued {
  grid-column: 1 / -1;
  border-color: rgba(255, 107, 74, 0.5);
  background: color-mix(in srgb, var(--color-coral) 8%, var(--color-surface));
}

.token-card__secret-row {
  gap: 10px;
  min-width: 0;
}

.token-card__secret {
  min-width: 0;
  flex: 1;
  overflow: auto;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 13px;
  color: var(--color-text);
  background: var(--color-background);
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
}

.token-card__success {
  margin: 0;
  color: #047857;
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .token-page__intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .token-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .token-card__details {
    grid-template-columns: 1fr;
  }

  .token-card__secret-row {
    align-items: stretch;
    flex-direction: column;
  }

  .token-page__button--light {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .token-page__button {
    transition: none;
  }
}
</style>
