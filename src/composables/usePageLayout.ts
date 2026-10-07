import { computed, inject, onScopeDispose, shallowRef, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import type { PagePresentation } from '../types/pageLayout'

interface PageRegistration {
  owner: symbol
  pageKey: string
  presentation: ComputedRef<PagePresentation>
}

export function createPageLayoutState(pageKey: Readonly<Ref<string>>) {
  const registration = shallowRef<PageRegistration | null>(null)
  const presentation = computed<PagePresentation>(() =>
    registration.value?.pageKey === pageKey.value ? registration.value.presentation.value : {})

  function register(source: ComputedRef<PagePresentation>): () => void {
    const owner = Symbol('page-presentation')
    registration.value = { owner, pageKey: pageKey.value, presentation: source }
    // A departing route must never clear the next route's header registration.
    return () => { if (registration.value?.owner === owner) registration.value = null }
  }

  function selectFilter(value: string): void {
    const filter = presentation.value.filter
    if (!filter || value === filter.modelValue) return
    if (filter.items.some(item => item.value === value && !item.disabled)) filter.onSelect(value)
  }

  return { presentation, register, selectFilter }
}

export const pageLayoutKey: InjectionKey<ReturnType<typeof createPageLayoutState>> = Symbol('page-layout')

/** Route content supplies reactive header data; it never owns the header markup. */
export function usePagePresentation(source: () => PagePresentation): void {
  const layout = inject(pageLayoutKey)
  if (!layout) throw new Error('Workspace page content must render inside PageLayout.')
  const unregister = layout.register(computed(source))
  onScopeDispose(unregister)
}
