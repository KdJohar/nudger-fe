<script setup lang="ts">
import { ref } from 'vue'
import TokenCredentials from '../components/token/TokenCredentials.vue'
import NudgeApiPlayground from '../components/token/NudgeApiPlayground.vue'
import NudgeApiReference from '../components/token/NudgeApiReference.vue'
import { useAuth } from '../composables/useAuth'
import { useApiToken } from '../composables/useApiToken'

const { authenticatedRequest } = useAuth()
const { tokenData, isLoading, isBusy, isRevealed, errorMessage, statusMessage, handleLoad, handleChange, handleCopy, handleToggleReveal } = useApiToken(authenticatedRequest)
const isSending = ref(false)

async function handleTokenChange(operation: 'create' | 'rotate', close: () => void): Promise<void> {
  if (!isSending.value && await handleChange(operation)) close()
}
</script>

<template>
  <div class="ui-content-stack">
    <TokenCredentials
      :token-data="tokenData"
      :is-loading="isLoading"
      :is-busy="isBusy"
      :is-revealed="isRevealed"
      :is-sending="isSending"
      :error-message="errorMessage"
      :status-message="statusMessage"
      @reveal="handleToggleReveal"
      @copy="handleCopy"
      @retry="handleLoad"
      @change="handleTokenChange"
    />
    <NudgeApiPlayground :token="tokenData?.token ?? null" :is-revealed="isRevealed" :is-credential-busy="isLoading || isBusy" @reveal="handleToggleReveal" @busy="isSending = $event" />
    <NudgeApiReference />
  </div>
</template>
