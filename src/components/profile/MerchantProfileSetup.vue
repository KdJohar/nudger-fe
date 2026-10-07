<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import AvatarPicker from '../ui/AvatarPicker.vue'
import ChoiceCards from '../ui/ChoiceCards.vue'
import { PROFILE_LINK_FIELDS, PROFILE_TYPE_OPTIONS } from '../../data/merchantProfile'
import { getNudgerConfig } from '../../config'
import type { MerchantProfileForm, MerchantProfileType } from '../../types/merchantProfile'

const props = defineProps<{ isBusy: boolean; uploadProgress: number }>()
const emit = defineEmits<{ submit: [form: MerchantProfileForm, imageFile: File] }>()
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const nameFieldRef = ref<{ focus: () => void } | null>(null)
const pickerRef = ref<{ focus: () => void } | null>(null)
const profileType = ref<MerchantProfileType>('creator')
const displayName = ref('')
const imageFile = ref<File | null>(null)
const imageError = ref<string | null>(null)
const links = reactive({ website_url: '', instagram_url: '', youtube_url: '', facebook_url: '', linkedin_url: '', x_url: '' })
const imageMaxBytes = getNudgerConfig().profileImageSourceMaxBytes
const initials = computed(() => displayName.value.trim().slice(0, 1).toUpperCase())
const displayNameRules = [(value: string) => Boolean(value?.trim()) || 'Display name is required.']
const publicLinkFields = PROFILE_LINK_FIELDS

function handleImageSelection(file: File | null): void {
  imageFile.value = file
  imageError.value = null
}

async function handleSubmit(): Promise<void> {
  if (props.isBusy) return
  const validation = await formRef.value?.validate()
  imageError.value = imageFile.value ? null : 'Add a profile image to continue.'
  if (!validation?.valid || !imageFile.value) {
    await nextTick()
    if (!validation?.valid) nameFieldRef.value?.focus()
    else pickerRef.value?.focus()
    return
  }
  emit('submit', {
    profile_type: profileType.value,
    display_name: displayName.value.trim(),
    ...Object.fromEntries(publicLinkFields.map(field => [field.key, links[field.key].trim() || undefined])),
  }, imageFile.value)
}
</script>

<template>
  <v-form ref="formRef" class="ui-form-panel" :disabled="isBusy" :aria-busy="isBusy" @submit.prevent="handleSubmit">
    <section class="ui-form-section">
      <ChoiceCards
        v-model="profileType"
        :items="PROFILE_TYPE_OPTIONS"
        label="How will you use Nudger?"
        hint="Choose your account type. This is set when you create your profile."
        :is-disabled="isBusy"
      />
    </section>

    <section class="ui-form-section">
      <h2 class="ui-form-section__title">Your public identity</h2>
      <p class="ui-form-section__description">The name and image people will see with your nudges.</p>
      <AvatarPicker
        ref="pickerRef"
        :model-value="imageFile"
        label="Profile image"
        selection-message="Image selected. It will be saved when you create your profile."
        :initials="initials"
        :max-bytes="imageMaxBytes"
        :is-busy="isBusy"
        :error-message="imageError"
        @update:model-value="handleImageSelection"
      />
      <v-text-field
        ref="nameFieldRef"
        v-model="displayName"
        :rules="displayNameRules"
        label="Display name"
        name="display_name"
        autocomplete="organization"
        placeholder="The name your audience knows"
        prepend-inner-icon="mdi-account-outline"
        color="secondary"
        required
      />
    </section>

    <section class="ui-form-section">
      <h2 class="ui-form-section__title">Public links <span class="ui-form-section__optional">Optional</span></h2>
      <p class="ui-form-section__description">Help people find you elsewhere. You can add these later.</p>
      <div class="ui-field-grid">
        <v-text-field
          v-for="field in publicLinkFields"
          :key="field.key"
          v-model="links[field.key]"
          :label="field.label"
          :name="field.key"
          :prepend-inner-icon="field.icon"
          inputmode="url"
          autocomplete="url"
          color="secondary"
        />
      </div>
    </section>

    <div class="ui-form-panel__footer">
      <p class="ui-form-panel__note"><v-icon icon="mdi-pencil-outline" size="18" aria-hidden="true" /> You can update your name, image, and links later.</p>
      <v-btn type="submit" color="secondary" rounded="pill" class="ui-form-panel__submit" :loading="isBusy">Create profile<v-icon end icon="mdi-arrow-right" /></v-btn>
      <p class="ui-form-panel__status" role="status">{{ isBusy ? (uploadProgress > 0 ? `Uploading image… ${uploadProgress}%` : 'Preparing your profile…') : '' }}</p>
    </div>
  </v-form>
</template>
