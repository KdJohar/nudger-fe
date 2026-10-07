import { inject, onScopeDispose, provide } from 'vue'
import { createSnackbarQueue } from '../lib/snackbar'

export const SNACKBAR_KEY = 'nudger.snackbar'
export function provideSnackbar(): void {
  const queue = createSnackbarQueue()
  provide(SNACKBAR_KEY, queue)
  onScopeDispose(queue.clear)
}
export function useSnackbar(): ReturnType<typeof createSnackbarQueue> {
  const queue = inject<ReturnType<typeof createSnackbarQueue>>(SNACKBAR_KEY)
  if (!queue) throw new Error('Snackbar feedback must render inside the app provider.')
  return queue
}
