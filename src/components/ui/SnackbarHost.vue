<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useSnackbar } from '../../composables/useSnackbar'

const { current, dismiss } = useSnackbar()
const target = shallowRef<HTMLElement | string>('body')
const isInDialog = computed(() => target.value !== 'body')
const isFocused = ref(false)
const icon = computed(() => ({ success: 'mdi-check-circle-outline', error: 'mdi-alert-circle-outline', warning: 'mdi-alert-outline', info: 'mdi-information-outline' })[current.value?.tone ?? 'info'])
const isUrgent = computed(() => current.value?.tone === 'error' || current.value?.tone === 'warning')
const timeout = computed(() => isFocused.value ? -1 : 20_000)
let observer: MutationObserver | undefined
let frame = 0
let previousFocus: HTMLElement | null = null
watch(() => current.value?.id, () => { isFocused.value = false; previousFocus = null }, { flush: 'post' })

function updateTarget(): void {
  // Keep feedback inside an open modal's focus boundary and outside the inert app root.
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('.v-dialog.v-overlay--active'))
  dialogs.sort((left, right) => Number(getComputedStyle(left).zIndex) - Number(getComputedStyle(right).zIndex))
  target.value = dialogs.at(-1)?.querySelector<HTMLElement>(':scope > .v-overlay__content') ?? 'body'
}
function scheduleTarget(): void {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(updateTarget)
}
watch(() => Boolean(current.value), async active => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  if (!active) { isFocused.value = false; return }
  await nextTick()
  if (!current.value) return
  updateTarget()
  observer = new MutationObserver(scheduleTarget)
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
}, { immediate: true, flush: 'post' })
onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(frame) })

function handleFocusIn(event: FocusEvent): void {
  isFocused.value = true
  if (event.relatedTarget instanceof HTMLElement && !event.relatedTarget.closest('.ui-snackbar')) previousFocus = event.relatedTarget
}
function handleFocusOut(event: FocusEvent): void {
  if (!(event.relatedTarget instanceof HTMLElement) || !event.relatedTarget.closest('.ui-snackbar')) isFocused.value = false
}
function handleDismiss(): void {
  if (!current.value) return
  const shouldRestoreFocus = document.activeElement instanceof HTMLElement && document.activeElement.closest('.ui-snackbar')
  dismiss(current.value.id)
  if (shouldRestoreFocus && previousFocus?.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus({ preventScroll: true })
}
function handleAction(): void {
  const notice = current.value
  if (!notice || notice.isActionDisabled?.()) return
  handleDismiss()
  notice.onAction?.()
}
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); handleDismiss() }
}
</script>

<template>
  <Teleport :to="target">
    <div class="ui-visually-hidden" role="alert" aria-atomic="true">{{ isUrgent && current ? current.message : '' }}</div>
    <div class="ui-visually-hidden" role="status" aria-atomic="true">{{ !isUrgent && current ? current.message : '' }}</div>
    <v-snackbar
      v-if="current" :key="current.id" :model-value="true" class="ui-snackbar"
      :class="[`ui-snackbar--${current.tone}`, { 'is-in-dialog': isInDialog }]"
      location="top right" :attach="true" :z-index="3000"
      :timeout="timeout" color="surface" rounded="xl"
      :content-props="{ onFocusin: handleFocusIn, onFocusout: handleFocusOut, onKeydown: handleKeydown }"
      @update:model-value="value => { if (!value) handleDismiss() }"
    >
      <div class="ui-snackbar__message" aria-hidden="true"><v-icon :icon="icon" size="24" /><span>{{ current.message }}</span></div>
      <template #actions>
        <v-btn v-if="current.actionText" class="ui-snackbar__action" :to="current.actionTo" :disabled="current.isActionDisabled?.()" variant="text" rounded="pill" @click="handleAction">{{ current.actionText }}</v-btn>
        <v-btn aria-label="Dismiss notification" class="ui-snackbar__dismiss" icon="mdi-close" variant="text" rounded="circle" @click="handleDismiss" />
      </template>
    </v-snackbar>
  </Teleport>
</template>
