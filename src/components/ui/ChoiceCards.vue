<script setup lang="ts" generic="Value extends string">
import { useId } from 'vue'
import type { ChoiceCardItem } from '../../types/choiceCards'

const props = withDefaults(defineProps<{
  modelValue: Value
  items: ChoiceCardItem<Value>[]
  label: string
  hint?: string
  isDisabled?: boolean
  variant?: 'default' | 'inline'
}>(), { hint: '', isDisabled: false, variant: 'default' })
const emit = defineEmits<{ 'update:modelValue': [value: Value] }>()
const groupId = useId()

function handleSelection(value: Value): void {
  if (!props.isDisabled && value !== props.modelValue) emit('update:modelValue', value)
}

function descriptionIds(item: ChoiceCardItem<Value>): string | undefined {
  return [item.description && `${groupId}-${item.value}-description`, item.detail && `${groupId}-${item.value}-detail`]
    .filter(Boolean).join(' ') || undefined
}
</script>

<template>
  <fieldset class="ui-choice-cards" :class="{ 'ui-choice-cards--inline': variant === 'inline' }" :disabled="isDisabled" :aria-describedby="hint ? `${groupId}-hint` : undefined">
    <legend class="ui-choice-cards__legend">{{ label }}</legend>
    <p v-if="hint" :id="`${groupId}-hint`" class="ui-choice-cards__hint">{{ hint }}</p>
    <div class="ui-choice-cards__grid">
      <label v-for="item in items" :key="item.value" class="ui-choice-cards__option" :class="{ 'is-selected': modelValue === item.value }">
        <input
          class="ui-choice-cards__input"
          type="radio"
          :name="groupId"
          :value="item.value"
          :checked="modelValue === item.value"
          :disabled="isDisabled"
          :aria-labelledby="`${groupId}-${item.value}-title`"
          :aria-describedby="descriptionIds(item)"
          @change="handleSelection(item.value)"
        />
        <span class="ui-choice-cards__top">
          <span class="ui-choice-cards__icon"><v-icon :icon="item.icon" size="24" aria-hidden="true" /></span>
          <strong :id="`${groupId}-${item.value}-title`" class="ui-choice-cards__title">{{ item.title }}</strong>
          <v-icon class="ui-choice-cards__indicator" :icon="modelValue === item.value ? 'mdi-check-circle' : 'mdi-circle-outline'" :size="variant === 'inline' ? 16 : 20" aria-hidden="true" />
        </span>
        <span v-if="item.description" :id="`${groupId}-${item.value}-description`" class="ui-choice-cards__description">{{ item.description }}</span>
        <span v-if="item.detail" :id="`${groupId}-${item.value}-detail`" class="ui-choice-cards__detail">{{ item.detail }}</span>
      </label>
    </div>
  </fieldset>
</template>
