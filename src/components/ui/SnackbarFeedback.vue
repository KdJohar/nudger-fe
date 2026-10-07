<script setup lang="ts">
import { onScopeDispose, watch } from 'vue'
import { useSnackbar } from '../../composables/useSnackbar'
import type { SnackbarTone } from '../../lib/snackbar'

const props = withDefaults(defineProps<{
  message?: string | null
  tone?: SnackbarTone
  actionText?: string
  actionTo?: string
  isActionDisabled?: boolean
}>(), { message: '', tone: 'error', isActionDisabled: false })
const emit = defineEmits<{ action: [] }>()
const snackbar = useSnackbar()
let noticeId: number | undefined

watch(() => [props.message, props.tone], () => {
  if (!props.message) {
    if (noticeId !== undefined) snackbar.dismiss(noticeId)
    noticeId = undefined
    return
  }
  noticeId = snackbar.show({
    message: props.message,
    tone: props.tone,
    actionText: props.actionText,
    actionTo: props.actionTo,
    isActionDisabled: () => props.isActionDisabled,
    onAction: props.actionText && !props.actionTo ? () => emit('action') : undefined,
  }, noticeId)
}, { immediate: true, flush: 'sync' })

onScopeDispose(() => {
  // Route-bound retry callbacks must not outlive their owner. Successes may survive redirects.
  if (noticeId !== undefined && (props.tone !== 'success' || (props.actionText && !props.actionTo))) {
    snackbar.dismiss(noticeId)
  }
})
</script>

<template />
