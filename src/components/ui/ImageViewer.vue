<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useDisplay } from 'vuetify'
import Sheet from './Sheet.vue'
import DialogFrame from './DialogFrame.vue'
import MediaPreview from './MediaPreview.vue'

const props = defineProps<{ src?: string; alt?: string }>()
const emit = defineEmits<{ closed: [] }>()
const isOpen = defineModel<boolean>({ default: false })
const { smAndDown } = useDisplay()
const isSheet = ref(false)
const titleId = useId()
const titleElement = ref<HTMLElement | null>(null)
// Keep the active overlay mounted through rotation so focus and image state survive.
watch(isOpen, opened => { if (opened) isSheet.value = smAndDown.value }, { immediate: true })
const surface = computed(() => isSheet.value ? Sheet : 'v-dialog')
const surfaceProps = computed(() => isSheet.value
  ? { title: 'Notification image', closeLabel: 'Close image' }
  : { maxWidth: 760, 'aria-labelledby': titleId })
</script>

<template>
  <component
    :is="surface"
    v-model="isOpen"
    v-bind="surfaceProps"
    @after-enter="titleElement?.focus({ preventScroll: true })"
    @after-leave="emit('closed')"
  >
    <component :is="isSheet ? 'div' : DialogFrame" class="ui-image-viewer" body-label="Notification image preview">
      <template v-if="!isSheet" #header>
        <h2 :id="titleId" ref="titleElement" class="ui-image-viewer__title" tabindex="-1">Notification image</h2>
      </template>
      <MediaPreview v-if="isOpen" :key="props.src" :src="props.src" :alt="props.alt || 'Notification image'" />
      <p class="ui-image-viewer__note">Older images may no longer be available. Your message and delivery details remain in history.</p>
      <template v-if="!isSheet" #footer>
        <v-btn variant="tonal" @click="isOpen = false">Close image</v-btn>
      </template>
    </component>
  </component>
</template>
