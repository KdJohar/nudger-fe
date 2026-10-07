<script setup lang="ts">
import { ref, watch } from 'vue'
import { copyText } from '../../lib/clipboard'
import SnackbarFeedback from './SnackbarFeedback.vue'

const props = withDefaults(defineProps<{
  code: string
  label: string
  canCopy?: boolean
  copyCode?: string
  isCopyDisabled?: boolean
}>(), { canCopy: true, isCopyDisabled: false })
const statusMessage = ref('')
const hasCopyError = ref(false)
watch(() => [props.code, props.copyCode], () => { statusMessage.value = '' })
async function handleCopy(): Promise<void> {
  if (props.isCopyDisabled) return
  statusMessage.value = ''
  hasCopyError.value = false
  try { await copyText(props.copyCode ?? props.code); statusMessage.value = 'Copied.' }
  catch { hasCopyError.value = true; statusMessage.value = props.copyCode !== undefined && props.copyCode !== props.code
    ? 'Could not copy. Reveal hidden values, then select and copy the code manually.'
    : 'Could not copy. Select the code to copy it manually.' }
}
</script>

<template>
  <div class="ui-code-block">
    <div class="ui-code-block__toolbar">
      <span class="ui-code-block__label">{{ label }}</span>
      <slot name="controls" />
      <v-btn v-if="canCopy" :aria-label="`Copy ${label}`" :disabled="isCopyDisabled" icon="mdi-content-copy" variant="text" @click="handleCopy" />
      <div v-if="$slots.actions" class="ui-code-block__actions"><slot name="actions" /></div>
    </div>
    <pre class="ui-code-block__content" tabindex="0" :aria-label="label"><code>{{ code }}</code></pre>
    <SnackbarFeedback :message="statusMessage" :tone="hasCopyError ? 'error' : 'success'" />
  </div>
</template>
