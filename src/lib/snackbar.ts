import { computed, shallowRef } from 'vue'

export type SnackbarTone = 'success' | 'error' | 'warning' | 'info'
export interface SnackbarNotice {
  id: number
  message: string
  tone: SnackbarTone
  actionText?: string
  actionTo?: string
  isActionDisabled?: () => boolean
  onAction?: () => void
}

/** One queue per App instance. Messages and callbacks are never persisted. */
export function createSnackbarQueue() {
  const notices = shallowRef<SnackbarNotice[]>([])
  let nextId = 0
  const current = computed(() => notices.value[0] ?? null)
  function show(notice: Omit<SnackbarNotice, 'id'>, id?: number): number {
    const entry = { ...notice, id: id ?? ++nextId }
    const index = notices.value.findIndex(item => item.id === entry.id)
    if (index < 0) notices.value = [...notices.value, entry]
    else notices.value = notices.value.map(item => item.id === entry.id ? entry : item)
    return entry.id
  }
  function dismiss(id: number): void { notices.value = notices.value.filter(item => item.id !== id) }
  function clear(): void { notices.value = [] }
  return { current, count: computed(() => notices.value.length), show, dismiss, clear }
}
