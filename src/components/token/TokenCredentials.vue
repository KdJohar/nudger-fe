<script setup lang="ts">
import { ref, useId } from 'vue'
import { API_TOKEN_MASK } from '../../lib/apiToken'
import type { MerchantApiTokenData } from '../../types/apiToken'

defineProps<{
  tokenData: MerchantApiTokenData | null
  isLoading: boolean
  isBusy: boolean
  isRevealed: boolean
  isSending: boolean
  errorMessage: string
  statusMessage: string
}>()
const emit = defineEmits<{
  reveal: []
  copy: []
  retry: []
  change: [operation: 'create' | 'rotate', close: () => void]
}>()
const headingId = useId()
const isRotationOpen = ref(false)
const rotateButton = ref<{ $el: HTMLElement } | null>(null)
</script>

<template>
  <section class="ui-panel ui-credential" :aria-labelledby="headingId" :aria-busy="isLoading || isBusy">
    <div class="ui-credential__heading">
      <span class="ui-credential__icon"><v-icon icon="mdi-key-outline" aria-hidden="true" /></span>
      <div class="ui-credential__copy">
        <h2 :id="headingId" class="ui-panel__title">Your API token</h2>
        <p class="ui-guide__description">One private key to connect your platform.</p>
      </div>
      <span v-if="tokenData?.has_token" class="ui-status-tag"><v-icon icon="mdi-check-circle-outline" size="16" aria-hidden="true" /> Active</span>
    </div>
    <v-alert v-if="errorMessage" class="ui-guide__notice" type="error" variant="tonal">{{ errorMessage }}<v-btn v-if="!tokenData" variant="text" @click="emit('retry')">Try again</v-btn></v-alert>
    <div v-if="isLoading" class="ui-credential__loading" role="status"><v-progress-circular color="secondary" size="24" indeterminate /><span>Loading your token…</span></div>
    <template v-else-if="tokenData?.has_token">
      <div class="ui-credential__field">
        <code class="ui-credential__value" :class="{ 'is-masked': !isRevealed }" :aria-label="isRevealed ? 'API token' : 'API token hidden'">{{ isRevealed && tokenData.token ? tokenData.token : API_TOKEN_MASK }}</code>
        <div class="ui-credential__controls">
          <v-btn :aria-label="isRevealed ? 'Hide API token' : 'Reveal API token'" :aria-pressed="isRevealed" :icon="isRevealed ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" :disabled="!tokenData.token || isBusy" variant="text" @click="emit('reveal')" />
          <v-btn aria-label="Copy API token" icon="mdi-content-copy" :disabled="!tokenData.token || isBusy" variant="text" @click="emit('copy')" />
        </div>
      </div>
      <p v-if="!tokenData.token" class="ui-guide__description">This older token cannot be revealed. Rotate it to get a new key.</p>
      <div class="ui-credential__footer">
        <p class="ui-guide__hint"><v-icon icon="mdi-lock-outline" size="18" aria-hidden="true" /> Keep this key on your server, out of public code.</p>
        <v-btn ref="rotateButton" prepend-icon="mdi-refresh" variant="text" aria-haspopup="dialog" :disabled="isSending || isBusy" @click="isRotationOpen = true">Rotate token</v-btn>
      </div>
    </template>
    <div v-else-if="tokenData" class="ui-credential__empty">
      <p class="ui-guide__description">Create a token to send nudges from your platform. You can explore the examples below first.</p>
      <v-btn color="secondary" rounded="pill" prepend-icon="mdi-plus" :loading="isBusy" @click="emit('change', 'create', () => {})">Create API token</v-btn>
    </div>
    <p class="ui-feedback" role="status">{{ statusMessage }}</p>
    <v-dialog v-model="isRotationOpen" max-width="440" :persistent="isBusy" aria-labelledby="rotation-heading" @after-leave="rotateButton?.$el.focus({ preventScroll: true })">
      <v-card class="ui-confirmation">
        <h2 id="rotation-heading" class="ui-panel__title">Rotate your API token?</h2>
        <p class="ui-guide__description">Your current key will stop working. Update every connected integration with the new token after rotating.</p>
        <p v-if="errorMessage" role="alert" class="ui-confirmation__error">{{ errorMessage }}</p>
        <div class="ui-confirmation__actions">
          <v-btn variant="text" :disabled="isBusy" @click="isRotationOpen = false">Cancel</v-btn>
          <v-btn color="secondary" :loading="isBusy" @click="emit('change', 'rotate', () => { isRotationOpen = false })">Rotate token</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </section>
</template>
