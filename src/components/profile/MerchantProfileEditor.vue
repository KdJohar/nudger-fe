<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import SnackbarFeedback from '../ui/SnackbarFeedback.vue'
import { PROFILE_LINK_FIELDS } from '../../data/merchantProfile'
import { ABOUT_MAX_LENGTH, profileDetailsDraft, profileDetailsPatch, validateProfileDetails } from '../../lib/profileDetails'
import type { MerchantProfile, MerchantProfileUpdate } from '../../types/merchantProfile'

const props = defineProps<{
  profile: MerchantProfile
  saveDetails: (changes: MerchantProfileUpdate) => Promise<MerchantProfile | null>
  isDisabled: boolean
}>()
const emit = defineEmits<{ saved: []; cancel: [] }>()
const savedDraft = profileDetailsDraft(props.profile)
const draft = reactive(profileDetailsDraft(props.profile))
const formElement = ref<HTMLFormElement | null>(null)
const fieldErrors = ref<Record<string, string>>({})
const errorMessage = ref('')
const isSaving = ref(false)
const isFinished = ref(false)
const patch = computed(() => profileDetailsPatch(draft, savedDraft))
const isDirty = computed(() => !isFinished.value && Object.keys(patch.value).length > 0)
const aboutLength = computed(() => Array.from(draft.about).length)

/** Guard both SPA navigation and browser close without persisting a public-profile draft. */
function handleBeforeUnload(event: BeforeUnloadEvent): void {
  if (isDirty.value || isSaving.value) { event.preventDefault(); event.returnValue = '' }
}
function confirmLeave(): boolean {
  return !isSaving.value && (!isDirty.value || window.confirm('Discard your unsaved profile changes?'))
}
onBeforeRouteLeave(confirmLeave)

function prepareSignOut(): boolean {
  if (!confirmLeave()) return false
  // Confirm before clearing the session, then let the login redirect pass without a second prompt.
  isFinished.value = true
  return true
}
defineExpose({ prepareSignOut })
onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  await nextTick()
  formElement.value?.querySelector<HTMLElement>('textarea')?.focus()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

async function focusInvalidField(): Promise<void> {
  await nextTick()
  formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

async function handleSave(): Promise<void> {
  if (isSaving.value || props.isDisabled) return
  fieldErrors.value = validateProfileDetails(draft)
  errorMessage.value = ''
  if (Object.keys(fieldErrors.value).length) { await focusInvalidField(); return }
  if (!isDirty.value) { isFinished.value = true; emit('cancel'); return }
  isSaving.value = true
  try {
    const saved = await props.saveDetails({ ...patch.value })
    if (saved) { isFinished.value = true; emit('saved') }
    else errorMessage.value = 'Unable to save right now. Please try again.'
  } catch (error) {
    const failure = error as { message?: string; fieldErrors?: Record<string, string> }
    errorMessage.value = failure.message || 'Unable to save. Check your connection and try again.'
    fieldErrors.value = failure.fieldErrors || {}
    await focusInvalidField()
  } finally { isSaving.value = false }
}

function handleCancel(): void {
  if (props.isDisabled) return
  if (confirmLeave()) {
    isFinished.value = true
    emit('cancel')
  }
}
</script>

<template>
  <form ref="formElement" class="ui-details-editor" aria-label="Edit public profile" :aria-busy="isSaving" novalidate @submit.prevent="handleSave">
    <p class="ui-detail-card__description">Help people understand who you are and where to find you. These details are public.</p>
    <v-textarea
      v-model="draft.about" class="ui-details-editor__about" name="about" label="About"
      placeholder="What do you share, and what can subscribers expect?" rows="3" auto-grow
      variant="outlined" density="comfortable" rounded="lg"
      :counter="ABOUT_MAX_LENGTH" :counter-value="() => aboutLength" :disabled="isSaving || isDisabled"
      :error-messages="fieldErrors.about" :aria-invalid="Boolean(fieldErrors.about)" hint="Optional · Visible to Nudgees on your public profile." persistent-hint
    />
    <div class="ui-details-editor__intro"><h3 class="ui-detail-card__title">Website & social links</h3><p class="ui-detail-card__description">Use full links, or leave a field empty to remove it.</p></div>
    <div class="ui-details-editor__fields">
      <v-text-field v-for="field in PROFILE_LINK_FIELDS" :key="field.key" v-model="draft[field.key]"
        :name="field.key" :label="field.label" :prepend-inner-icon="field.icon" type="url" inputmode="url"
        autocomplete="off" autocapitalize="none" :spellcheck="false" placeholder="https://"
        :disabled="isSaving || isDisabled" :error-messages="fieldErrors[field.key]" :aria-invalid="Boolean(fieldErrors[field.key])"
      />
    </div>
    <SnackbarFeedback :message="errorMessage" />
    <div class="ui-details-editor__actions">
      <span class="ui-details-editor__status" role="status">{{ isSaving ? 'Saving your profile…' : isDirty ? 'Unsaved changes' : 'No changes yet' }}</span>
      <v-btn class="ui-detail-card__action" type="button" variant="outlined" rounded="pill" :disabled="isSaving || isDisabled" @click="handleCancel">Discard changes</v-btn>
      <v-btn type="submit" color="secondary" rounded="pill" :loading="isSaving" :disabled="isSaving || isDisabled">Save changes</v-btn>
    </div>
  </form>
</template>
