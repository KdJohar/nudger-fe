<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import MerchantProfileEditor from './MerchantProfileEditor.vue'
import AvatarPicker from '../ui/AvatarPicker.vue'
import { PROFILE_LINK_FIELDS } from '../../data/merchantProfile'
import type { MerchantProfile, MerchantProfileUpdate } from '../../types/merchantProfile'

const props = defineProps<{
  profile: MerchantProfile
  imageFile: File | null
  maxImageBytes: number
  isBusy: boolean
  isDisabled: boolean
  uploadProgress: number
  saveDetails: (changes: MerchantProfileUpdate) => Promise<MerchantProfile | null>
}>()
const emit = defineEmits<{ 'image-selected': [file: File | null]; 'details-saved': [] }>()
const isEditingDetails = ref(false)
const editorRef = ref<InstanceType<typeof MerchantProfileEditor> | null>(null)
defineExpose({ prepareSignOut: () => !props.isBusy && !props.isDisabled && (editorRef.value?.prepareSignOut() ?? true) })
const editButton = ref<{ $el: HTMLElement } | null>(null)
async function finishEditing(saved = false): Promise<void> {
  isEditingDetails.value = false
  if (saved) emit('details-saved')
  await nextTick()
  editButton.value?.$el?.focus()
}
const publicLinks = computed(() => PROFILE_LINK_FIELDS.flatMap(field => {
  const value = props.profile[field.key]?.trim()
  if (!value) return []
  // Keep saved link text visible, but never turn non-web URLs into navigation.
  let href: string | null = null
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' || url.protocol === 'http:') href = url.href
  } catch { /* An invalid stored link remains readable as text. */ }
  return [{ ...field, value, href }]
}))
</script>

<template>
  <section class="ui-detail-card">
    <div class="ui-detail-card__toolbar">
      <div class="ui-detail-card__heading"><v-icon icon="mdi-account-outline" size="22" aria-hidden="true" /><h2 class="ui-detail-card__title">Public profile</h2></div>
      <v-btn v-if="!isEditingDetails" ref="editButton" class="ui-detail-card__action" variant="outlined" rounded="pill" prepend-icon="mdi-pencil-outline" :disabled="isBusy || isDisabled" @click="isEditingDetails = true">Edit details</v-btn>
    </div>
    <div class="ui-detail-card__body">
      <div class="ui-detail-card__identity">
        <AvatarPicker
          class="ui-identity-picker"
          :model-value="imageFile"
          :src="profile.profile_image_url"
          :initials="profile.display_name.slice(0, 1).toUpperCase()"
          :max-bytes="maxImageBytes"
          :is-busy="isBusy"
          :is-disabled="isDisabled"
          label="Profile image"
          @update:model-value="emit('image-selected', $event)"
        >
          <template #label>
            <h3 class="ui-detail-card__name">{{ profile.display_name }}</h3>
            <p class="ui-detail-card__handle">@{{ profile.nudger_id }}</p>
          </template>
        </AvatarPicker>
        <v-progress-linear v-if="isBusy" class="ui-detail-card__progress" :model-value="uploadProgress" color="secondary" aria-label="Profile image upload progress" />
        <p class="ui-detail-card__note"><v-icon icon="mdi-lock-outline" size="18" aria-hidden="true" /><span>Display name and handle are read-only.</span></p>
      </div>
      <div class="ui-detail-card__content">
        <MerchantProfileEditor v-if="isEditingDetails" ref="editorRef" :profile="profile" :save-details="saveDetails" :is-disabled="isDisabled || isBusy"
          @saved="finishEditing(true)" @cancel="finishEditing()" />
        <template v-else>
          <h3 class="ui-detail-card__subtitle">About</h3>
          <p v-if="profile.about" class="ui-detail-card__about">{{ profile.about }}</p>
          <p v-else class="ui-detail-card__description">Tell your audience what you’re about and what to expect from your nudges.</p>
          <div class="ui-detail-card__section">
            <h3 class="ui-detail-card__subtitle">Website & social links</h3>
            <ul v-if="publicLinks.length" class="ui-link-list">
              <li v-for="link in publicLinks" :key="link.key" class="ui-link-list__item">
                <component :is="link.href ? 'a' : 'div'" class="ui-link-list__row" :href="link.href || undefined" :target="link.href ? '_blank' : undefined" :rel="link.href ? 'noopener noreferrer' : undefined">
                  <v-icon :icon="link.icon" size="22" aria-hidden="true" />
                  <span class="ui-link-list__copy"><strong>{{ link.label }}</strong><span>{{ link.value }}</span></span>
                  <v-icon v-if="link.href" icon="mdi-open-in-new" size="18" aria-hidden="true" />
                  <span v-if="link.href" class="ui-visually-hidden">Opens in a new tab</span>
                </component>
              </li>
            </ul>
            <div v-else class="ui-empty-note"><v-icon icon="mdi-link-variant-off" size="24" aria-hidden="true" /><div><strong>No public links yet</strong><p>Links are optional. Your audience can still find you by your Nudger handle.</p></div></div>
          </div>
          <p class="ui-detail-card__note"><v-icon icon="mdi-eye-outline" size="18" aria-hidden="true" /><span>About and links are visible to Nudgees.</span></p>
        </template>
      </div>
    </div>
  </section>
</template>
