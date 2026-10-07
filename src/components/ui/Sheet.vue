<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useSheetDrag } from '../../composables/useSheetDrag'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  isBusy?: boolean
}>(), { description: '', isBusy: false })
const isOpen = defineModel<boolean>({ default: false })
const titleId = useId()
const descriptionId = useId()
const surface = ref<HTMLElement | null>(null)
const titleElement = ref<HTMLElement | null>(null)
const isKeyboardOpen = ref(false)
let previousFocus: HTMLElement | null = null
let appRoot: HTMLElement | null = null
let wasInert = false
let viewportAnimation: Animation | null = null
let visualViewport: VisualViewport | null = null

function handleClose(): void {
  if (!props.isBusy) isOpen.value = false
}

const {
  isDragging, isDragDismissed, resetDrag, handlePointerDown, handlePointerMove,
  handlePointerUp, handlePointerCancel, handleHandleClick,
} = useSheetDrag(surface, () => props.isBusy, handleClose)

function focusTitle(): void {
  titleElement.value?.focus({ preventScroll: true })
}

function updateViewport(): void {
  const element = surface.value?.closest<HTMLElement>('.ui-sheet')
  if (!element || !visualViewport) return
  // Do not move the sheet during pinch zoom. Follow the keyboard's visible viewport.
  if (visualViewport.scale !== 1) return
  const viewportHeight = visualViewport.height
  isKeyboardOpen.value = window.innerHeight - viewportHeight > 140
  viewportAnimation?.cancel()
  viewportAnimation = element.animate({
    top: [visualViewport.offsetTop + 'px', visualViewport.offsetTop + 'px'],
    height: [viewportHeight + 'px', viewportHeight + 'px'],
  }, { duration: 1, fill: 'both' })
}

function stopViewportTracking(): void {
  visualViewport?.removeEventListener('resize', updateViewport)
  visualViewport?.removeEventListener('scroll', updateViewport)
  visualViewport = null
  viewportAnimation?.cancel()
  viewportAnimation = null
}

function restoreBackground(): void {
  if (appRoot) appRoot.inert = wasInert
  appRoot = null
}

watch(isOpen, async (opened) => {
  if (opened) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    resetDrag()
    await nextTick()
    if (!isOpen.value) return
    appRoot = document.getElementById('app')
    if (appRoot && !appRoot.contains(surface.value)) {
      wasInert = appRoot.inert
      appRoot.inert = true
    } else {
      appRoot = null
    }
    visualViewport = window.visualViewport
    visualViewport?.addEventListener('resize', updateViewport, { passive: true })
    visualViewport?.addEventListener('scroll', updateViewport, { passive: true })
    updateViewport()
  } else {
    stopViewportTracking()
    restoreBackground()
  }
})

function handleAfterLeave(): void {
  resetDrag()
  isKeyboardOpen.value = false
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
  previousFocus = null
}

onBeforeUnmount(() => {
  stopViewportTracking()
  restoreBackground()
})

defineExpose({ focusTitle })
</script>

<template>
  <v-bottom-sheet
    v-model="isOpen"
    class="ui-sheet"
    :class="{ 'is-keyboard-open': isKeyboardOpen }"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descriptionId : undefined"
    :persistent="isBusy"
    :no-click-animation="true"
    :transition="isDragDismissed ? false : 'ui-sheet-transition'"
    @after-enter="focusTitle"
    @after-leave="handleAfterLeave"
  >
    <section ref="surface" class="ui-sheet__surface" :class="{ 'is-dragging': isDragging }" :aria-busy="isBusy">
      <div
        class="ui-sheet__drag-area"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerCancel"
        @lostpointercapture="handlePointerCancel"
      >
        <button
          class="ui-sheet__handle"
          type="button"
          aria-label="Close composer"
          title="Drag down or tap to close"
          :disabled="isBusy"
          @click="handleHandleClick"
        >
          <span class="ui-sheet__grip" aria-hidden="true" />
        </button>
        <header class="ui-sheet__header">
          <div class="ui-sheet__heading">
            <h2 :id="titleId" ref="titleElement" class="ui-sheet__title" tabindex="-1">{{ title }}</h2>
            <p v-if="description" :id="descriptionId" class="ui-sheet__description">{{ description }}</p>
          </div>
          <v-btn
            class="ui-sheet__close"
            data-sheet-close
            aria-label="Close composer"
            icon="mdi-close"
            variant="text"
            rounded="circle"
            :disabled="isBusy"
            @click="handleClose"
          />
        </header>
      </div>
      <div class="ui-sheet__body"><slot /></div>
      <footer v-if="$slots.footer" class="ui-sheet__footer"><slot name="footer" /></footer>
    </section>
  </v-bottom-sheet>
</template>
