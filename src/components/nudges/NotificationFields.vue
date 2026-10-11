<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ChoiceCards from '../ui/ChoiceCards.vue'
import MediaPreview from '../ui/MediaPreview.vue'
import type { useNotificationDraft } from '../../composables/useNotificationDraft'
import type { ChoiceCardItem } from '../../types/choiceCards'
import type { CtaLabel, NotificationFormat } from '../../types/notification'
const props = defineProps<{ model: ReturnType<typeof useNotificationDraft>; isDisabled?: boolean }>()
const destinationInput = ref<{ focus: () => void } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const fieldId = useId()
const formats = computed<ChoiceCardItem<NotificationFormat>[]>(() => (props.model.capabilities.value?.allowed_formats || []).map(value => ({ value, title: value === 'basic' ? 'Basic' : 'Rich', icon: value === 'basic' ? 'mdi-message-text-outline' : 'mdi-image-outline' })))
const presets = computed<ChoiceCardItem<CtaLabel>[]>(() => (props.model.capabilities.value?.cta_presets || []).map(item => ({ value: item.value, title: item.value === 'watch_now' ? 'Watch now' : 'Learn more', icon: item.value === 'watch_now' ? 'mdi-play-outline' : 'mdi-open-in-new' })))
function handleFile(event: Event): void {
  const input = event.target as HTMLInputElement, file = input.files?.[0]
  input.value = ''
  if (file && !props.isDisabled) void props.model.selectImage(file)
}
defineExpose({ focusError: () => {
  if (props.model.errors.value.destinationUrl) destinationInput.value?.focus()
  else document.getElementById(fieldId)?.querySelector<HTMLElement>('button, input')?.focus()
} })
</script>
<template>
  <div :id="fieldId" class="ui-content-fields" :aria-busy="model.isLoading.value">
    <p v-if="model.isLoading.value" class="ui-editor-panel__hint" role="status">Loading notification options…</p>
    <div v-else-if="model.capabilityError.value" class="ui-content-fields__status">
      <p class="ui-editor-panel__hint">{{ model.capabilityError.value }}</p>
      <v-btn variant="text" rounded="pill" :disabled="isDisabled" @click="model.loadCapabilities">Load options</v-btn>
    </div>
    <ChoiceCards v-else v-model="model.draft.notificationFormat" :items="formats" label="Notification format" variant="inline" :is-disabled="isDisabled" />
    <p v-if="model.errors.value.notificationFormat" class="ui-content-fields__error" role="alert">{{ model.errors.value.notificationFormat }}</p>
    <template v-if="model.draft.notificationFormat === 'rich'">
      <v-text-field ref="destinationInput" v-model="model.draft.destinationUrl" label="Destination URL" name="destination_url" type="url" inputmode="url" autocomplete="off" placeholder="https://www.youtube.com/watch?v=…" color="secondary" :disabled="isDisabled" :error-messages="model.errors.value.destinationUrl" :aria-invalid="Boolean(model.errors.value.destinationUrl)" hint="Where Watch now or Learn more will take your subscriber." persistent-hint />
      <ChoiceCards v-model="model.draft.ctaLabel" :items="presets" label="Call to action" variant="inline" :is-disabled="isDisabled" />
      <p v-if="model.errors.value.ctaLabel" class="ui-content-fields__error" role="alert">{{ model.errors.value.ctaLabel }}</p>
      <div class="ui-content-fields__media">
        <span class="ui-choice-cards__legend">Image <span class="ui-editor-panel__hint">· optional</span></span>
        <MediaPreview :src="model.draft.mediaUrl" />
        <input ref="fileInput" class="ui-visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" tabindex="-1" aria-label="Select notification image" :disabled="isDisabled" @change="handleFile" />
        <div class="ui-content-fields__actions">
          <v-btn variant="outlined" rounded="pill" prepend-icon="mdi-image-outline" :disabled="isDisabled || !model.capabilities.value" @click="fileInput?.click()">{{ model.draft.mediaUrl ? 'Replace image' : 'Upload image' }}</v-btn>
          <v-btn v-if="model.canImportThumbnail.value" variant="text" rounded="pill" :disabled="isDisabled || model.isMediaBusy.value" @click="model.importThumbnail">Use YouTube thumbnail</v-btn>
          <v-btn v-if="model.draft.mediaUrl || model.isMediaBusy.value || model.mediaError.value" variant="text" rounded="pill" :disabled="isDisabled" @click="model.removeMedia">Remove image</v-btn>
        </div>
        <div v-if="model.isMediaBusy.value" class="ui-content-fields__status" role="status">
          <v-progress-linear :model-value="model.uploadProgress.value" :indeterminate="!model.uploadProgress.value || model.uploadProgress.value === 100" color="secondary" />{{ model.mediaStatus.value }}
        </div>
        <p v-else-if="model.mediaStatus.value" class="ui-editor-panel__hint" role="status">{{ model.mediaStatus.value }}</p>
        <div v-if="model.mediaError.value" class="ui-content-fields__status"><p class="ui-content-fields__error" role="alert">{{ model.mediaError.value }}</p><v-btn variant="text" rounded="pill" :disabled="isDisabled" @click="model.retryMedia">Retry image</v-btn><span class="ui-editor-panel__hint">You can also send without an image.</span></div>
        <p v-if="model.errors.value.mediaUrl" class="ui-content-fields__error" role="alert">{{ model.errors.value.mediaUrl }}</p>
        <p class="ui-editor-panel__hint">JPEG, PNG or WebP. Your image is resized and optimized; your avatar stays separate.</p>
      </div>
    </template>
  </div>
</template>
