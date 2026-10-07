import { onBeforeUnmount, ref, type Ref } from 'vue'

/** Tracks only the handle/header so composing and scrolling never start a drag. */
export function useSheetDrag(
  surface: Ref<HTMLElement | null>,
  isBlocked: () => boolean,
  dismiss: () => void,
) {
  const isDragging = ref(false)
  const isDragDismissed = ref(false)
  let pointerId: number | null = null
  let captureTarget: HTMLElement | null = null
  let startY = 0
  let distance = 0
  let lastY = 0
  let lastTime = 0
  let velocity = 0
  let height = 1
  let hasMoved = false
  let animation: Animation | null = null

  function clearAnimation(): void {
    if (animation) animation.onfinish = null
    animation?.cancel()
    animation = null
  }

  function releasePointer(): void {
    const releasedPointerId = pointerId
    pointerId = null
    if (releasedPointerId !== null && captureTarget?.hasPointerCapture(releasedPointerId)) {
      captureTarget.releasePointerCapture(releasedPointerId)
    }
    captureTarget = null
    isDragging.value = false
  }

  function resetDrag(): void {
    releasePointer()
    clearAnimation()
    distance = 0
    hasMoved = false
    isDragDismissed.value = false
  }

  function settleDrag(shouldDismiss: boolean): void {
    const element = surface.value
    if (!element) return resetDrag()
    clearAnimation()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    animation = element.animate([
      { transform: 'translateY(' + distance + 'px)' },
      { transform: 'translateY(' + (shouldDismiss ? height : 0) + 'px)' },
    ], {
      duration: reducedMotion ? 1 : shouldDismiss ? 160 : 220,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      fill: 'both',
    })
    animation.onfinish = () => {
      if (shouldDismiss) {
        isDragDismissed.value = true
        dismiss()
      } else {
        clearAnimation()
      }
    }
  }

  function handlePointerDown(event: PointerEvent): void {
    if (isBlocked() || pointerId !== null || !event.isPrimary || event.button !== 0) return
    if ((event.target as HTMLElement).closest('[data-sheet-close]')) return
    const element = surface.value
    if (!element) return
    clearAnimation()
    pointerId = event.pointerId
    startY = lastY = event.clientY
    lastTime = event.timeStamp
    velocity = distance = 0
    hasMoved = false
    height = element.getBoundingClientRect().height + 32
    captureTarget = (event.target as HTMLElement).closest<HTMLButtonElement>('button') ?? event.currentTarget as HTMLElement
    captureTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent): void {
    if (event.pointerId !== pointerId || !surface.value) return
    distance = Math.max(0, Math.min(event.clientY - startY, height))
    if (distance > 6) hasMoved = true
    if (!hasMoved) return
    event.preventDefault()
    const elapsed = event.timeStamp - lastTime
    if (elapsed > 0) velocity = (event.clientY - lastY) / elapsed
    lastY = event.clientY
    lastTime = event.timeStamp
    isDragging.value = true
    if (!animation) {
      // Web Animations changes geometry without inline styles; appearance lives in main.css.
      animation = surface.value.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(' + height + 'px)' },
      ], { duration: 1000, fill: 'both' })
      animation.pause()
    }
    animation.currentTime = distance / height * 1000
  }

  function handlePointerUp(event: PointerEvent): void {
    if (event.pointerId !== pointerId) return
    releasePointer()
    if (!hasMoved) return
    const isFlick = event.timeStamp - lastTime < 100 && velocity > 0.6 && distance > 28
    const threshold = Math.max(72, Math.min(140, height * 0.2))
    settleDrag(!isBlocked() && (distance >= threshold || isFlick))
  }

  function handlePointerCancel(event: PointerEvent): void {
    if (event.pointerId !== pointerId) return
    releasePointer()
    if (hasMoved) settleDrag(false)
  }

  function handleHandleClick(event: MouseEvent): void {
    // A pointer drag produces a click on release; only a real tap should close.
    if (hasMoved && event.detail > 0) {
      hasMoved = false
      return
    }
    if (!isBlocked()) dismiss()
  }

  onBeforeUnmount(resetDrag)
  return { isDragging, isDragDismissed, resetDrag, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, handleHandleClick }
}
