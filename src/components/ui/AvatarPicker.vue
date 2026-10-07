<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: File | null
  label: string
  maxBytes: number
  src?: string | null
  initials?: string
  isDisabled?: boolean
  isBusy?: boolean
  errorMessage?: string | null
  selectionMessage?: string
}>(), { src: null, initials: '', isDisabled: false, isBusy: false, errorMessage: null, selectionMessage: 'Image selected.' })
const emit = defineEmits<{ 'update:modelValue': [file: File | null] }>()
const inputRef = ref<HTMLInputElement | null>(null)
const buttonRef = ref<HTMLButtonElement | null>(null)
const previewUrl = ref<string | null>(null)
const selectionError = ref<string | null>(null)
const hasImageError = ref(false)
const controlId = useId()
const imageUrl = computed(() => previewUrl.value || props.src)
const error = computed(() => selectionError.value || props.errorMessage)
const actionLabel = computed(() => `${imageUrl.value ? 'Change' : 'Upload'} ${props.label.toLowerCase()}`)
const isUnavailable = computed(() => props.isDisabled || props.isBusy)
const statusMessage = computed(() => props.isBusy ? 'Preparing and uploading your image…' : props.modelValue && !error.value ? props.selectionMessage : '')

function releasePreview(): void {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

watch(() => props.modelValue, file => {
  releasePreview()
  hasImageError.value = false
  if (file) {
    selectionError.value = null
    previewUrl.value = URL.createObjectURL(file)
  }
}, { immediate: true })
watch(() => props.src, () => { hasImageError.value = false })
onBeforeUnmount(releasePreview)

function handleOpen(): void {
  if (!isUnavailable.value) inputRef.value?.click()
}

function handleSelection(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Reset the native value so choosing the same file again still fires change.
  input.value = ''
  if (!file || isUnavailable.value) return
  if (!file.type.startsWith('image/')) {
    emit('update:modelValue', null)
    selectionError.value = 'Choose an image such as a JPG, PNG, or WebP.'
    return
  }
  if (file.size > props.maxBytes) {
    emit('update:modelValue', null)
    selectionError.value = `Choose an image smaller than ${Math.round(props.maxBytes / (1024 * 1024))} MB.`
    return
  }
  selectionError.value = null
  hasImageError.value = false
  emit('update:modelValue', file)
}

function handleImageError(): void {
  hasImageError.value = true
  if (props.modelValue) {
    emit('update:modelValue', null)
    selectionError.value = 'That image could not be read. Choose another image.'
  }
}

defineExpose({ focus: () => buttonRef.value?.focus() })
</script>

<template>
  <div class="ui-avatar-picker" :aria-busy="isBusy">
    <input ref="inputRef" type="file" accept="image/*" hidden :disabled="isUnavailable" :aria-label="label" @change="handleSelection" />
    <button
      ref="buttonRef"
      type="button"
      class="ui-avatar-picker__button"
      :disabled="isUnavailable"
      :aria-label="actionLabel"
      :aria-invalid="Boolean(error)"
      :aria-describedby="`${controlId}-help ${controlId}-error`"
      @click="handleOpen"
    >
      <span class="ui-avatar-picker__avatar">
        <img v-if="imageUrl && !hasImageError" :src="imageUrl" :alt="`${label} preview`" @error="handleImageError" />
        <span v-else-if="initials" class="ui-avatar-picker__initials" aria-hidden="true">{{ initials }}</span>
        <v-icon v-else icon="mdi-image-outline" size="32" aria-hidden="true" />
      </span>
      <span class="ui-avatar-picker__camera" aria-hidden="true">
        <v-progress-circular v-if="isBusy" indeterminate size="20" width="2" />
        <v-icon v-else icon="mdi-camera-outline" size="22" />
      </span>
    </button>
    <div class="ui-avatar-picker__copy">
      <slot name="label"><strong class="ui-avatar-picker__label">{{ label }}</strong></slot>
      <p :id="`${controlId}-help`" class="ui-avatar-picker__hint">{{ imageUrl ? 'Tap the camera to change your photo or logo.' : 'Add a photo or logo your audience will recognise.' }}</p>
      <p class="ui-avatar-picker__hint">Images are optimised automatically.</p>
      <p class="ui-avatar-picker__status" role="status">{{ statusMessage }}</p>
      <p :id="`${controlId}-error`" class="ui-avatar-picker__error" aria-live="polite">{{ error }}</p>
    </div>
  </div>
</template>
