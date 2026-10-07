<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  limit: number
  error?: string
  isDisabled?: boolean
  placeholder?: string
}>(), { error: '', isDisabled: false, placeholder: 'What would you like to share?' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const inputId = useId()
const helperId = useId()
const errorId = useId()
const field = ref<HTMLTextAreaElement | null>(null)
const count = computed(() => props.modelValue.length)
function handleInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
function focus(): void { field.value?.focus() }
defineExpose({ focus })
</script>

<template>
  <div class="ui-message-field">
    <div class="ui-message-field__label-row">
      <label class="ui-message-field__label" :for="inputId">Your message</label>
      <span class="ui-message-field__count" :class="{ 'is-invalid': count > limit }" :aria-label="count + ' of ' + limit + ' characters'">{{ count.toLocaleString() }} / {{ limit.toLocaleString() }}</span>
    </div>
    <textarea
      :id="inputId"
      ref="field"
      class="ui-message-field__input"
      :value="modelValue"
      :class="{ 'is-invalid': error }"
      :disabled="isDisabled"
      :aria-invalid="Boolean(error)"
      :aria-describedby="helperId + (error ? ' ' + errorId : '')"
      :maxlength="limit"
      :placeholder="placeholder"
      name="message"
      autocomplete="off"
      rows="3"
      @input="handleInput"
    />
    <p v-if="error" :id="errorId" class="ui-message-field__error">{{ error }}</p>
    <p :id="helperId" class="ui-message-field__hint">Keep it short. Longer messages may be shortened on the lock screen.</p>
  </div>
</template>
