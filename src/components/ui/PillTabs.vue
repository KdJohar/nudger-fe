<script setup lang="ts" generic="Value extends string">
import type { PillTabItem } from '../../types/pageLayout'

const props = defineProps<{
  modelValue: Value
  items: PillTabItem<Value>[]
  label: string
  tabsId: string
  panelId: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: Value] }>()

function handleSelection(value: unknown): void {
  const selectedItem = props.items.find(item => item.value === value && !item.disabled)
  if (selectedItem && selectedItem.value !== props.modelValue) emit('update:modelValue', selectedItem.value)
}
</script>

<template>
  <!-- VTabs' items prop also creates a window. Use its default slot for a control-only component. -->
  <v-tabs
    :model-value="modelValue"
    :aria-label="label"
    class="ui-pill-tabs"
    grow
    inset
    inset-padding="4"
    inset-radius="999"
    slider-transition="grow"
    @update:model-value="handleSelection"
  >
    <v-tab
      v-for="item in items"
      :id="`${tabsId}-${item.value}-tab`"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled"
      :aria-controls="panelId"
      rounded="pill"
    >
      <v-icon v-if="item.icon" start :icon="item.icon" size="18" />
      <span>{{ item.title }}</span>
    </v-tab>
  </v-tabs>
</template>
