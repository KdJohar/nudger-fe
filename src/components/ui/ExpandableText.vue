<script setup lang="ts">
import { computed, useId } from 'vue'
const props = defineProps<{ text: string; isExpanded: boolean }>()
const emit = defineEmits<{ 'update:isExpanded': [value: boolean] }>()
const textId = useId()
const characters = computed(() => Array.from(props.text))
const hasMore = computed(() => characters.value.length > 160)
const visibleText = computed(() => hasMore.value && !props.isExpanded ? `${characters.value.slice(0, 160).join('')}…` : props.text)
</script>

<template>
  <div class="ui-expandable-text">
    <p :id="textId" class="ui-expandable-text__copy">{{ visibleText }}</p>
    <button v-if="hasMore" type="button" class="ui-text-action" :aria-expanded="isExpanded" :aria-controls="textId" @click="emit('update:isExpanded', !isExpanded)">
      {{ isExpanded ? 'Show less' : 'Read full message' }}
    </button>
  </div>
</template>
