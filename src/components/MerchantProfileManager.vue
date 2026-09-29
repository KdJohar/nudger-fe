<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { useMerchantProfile } from '../composables/useMerchantProfile'
import { getNudgerConfig } from '../config'
import { formatBytes } from '../lib/profileImages'
import type { MerchantProfileForm, MerchantProfileType } from '../types/merchantProfile'
import IconGlyph from './IconGlyph.vue'

const config = getNudgerConfig()
const { state, loadProfile, createProfile, changeProfileImage } = useMerchantProfile()
const profileImageInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const formError = ref<string | null>(null)

const form = reactive<MerchantProfileForm>({
  profile_type: 'creator',
  display_name: '',
  website_url: '',
  instagram_url: '',
  youtube_url: '',
  facebook_url: '',
  linkedin_url: '',
  x_url: '',
})

const profileTypeCopy: Record<MerchantProfileType, { label: string; copy: string }> = {
  creator: { label: 'Creator', copy: 'Streams, sessions and community moments.' },
  platform: { label: 'Platform', copy: 'Orders, service and transactional updates.' },
}

const linkFields: Array<{ key: Exclude<keyof MerchantProfileForm, 'profile_type' | 'display_name'>; label: string; placeholder: string }> = [
  { key: 'website_url', label: 'Website', placeholder: 'https://yourwebsite.com' },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/yourname' },
  { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@yourname' },
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/yourname' },
  { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
  { key: 'x_url', label: 'X', placeholder: 'https://x.com/yourname' },
]

const profileLinks = computed(() => {
  if (!state.profile) {
    return []
  }
  return [
    { label: 'Website', value: state.profile.website_url },
    { label: 'Instagram', value: state.profile.instagram_url },
    { label: 'YouTube', value: state.profile.youtube_url },
    { label: 'Facebook', value: state.profile.facebook_url },
    { label: 'LinkedIn', value: state.profile.linkedin_url },
    { label: 'X', value: state.profile.x_url },
  ].filter((link): link is { label: string; value: string } => Boolean(link.value))
})

function revokePreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function selectFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  formError.value = null
  selectedFile.value = file
  revokePreview()
  previewUrl.value = URL.createObjectURL(file)
}

function openFilePicker(): void {
  profileImageInput.value?.click()
}

async function handleCreate(): Promise<void> {
  formError.value = null
  if (!selectedFile.value) {
    formError.value = 'Choose a profile picture before creating your profile.'
    return
  }
  if (!form.display_name.trim()) {
    formError.value = 'Add a display name before creating your profile.'
    return
  }

  await createProfile(form, selectedFile.value)
}

async function handleChangeProfileImage(): Promise<void> {
  formError.value = null
  if (!selectedFile.value) {
    formError.value = 'Choose a new profile picture first.'
    return
  }
  await changeProfileImage(selectedFile.value)
}

function resetSelectedFile(): void {
  selectedFile.value = null
  revokePreview()
  if (profileImageInput.value) {
    profileImageInput.value.value = ''
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <section class="merchant-profile" aria-labelledby="merchant-profile-heading">
    <div class="merchant-profile__heading">
      <div>
        <p class="panel-label">Your merchant profile</p>
        <h2 id="merchant-profile-heading">Set up the identity people will recognise.</h2>
        <p class="merchant-profile__intro">Your profile gives every update a clear sender. Create it once, then use Nudger to reach the people who chose to hear from you.</p>
      </div>
      <div class="merchant-profile__badge"><IconGlyph name="sparkles" /> One profile per account</div>
    </div>

    <div v-if="state.isLoading" class="merchant-profile__loading" aria-live="polite">
      <span class="auth-loading__spinner" aria-hidden="true"></span>
      <span>Checking your merchant profile…</span>
    </div>

    <div v-else-if="!state.profile" class="merchant-profile__setup">
      <form class="profile-form" @submit.prevent="handleCreate">
        <fieldset class="profile-form__fieldset">
          <legend>What are you sending as?</legend>
          <div class="profile-type-grid">
            <label v-for="(copy, type) in profileTypeCopy" :key="type" class="profile-type" :class="{ 'profile-type--selected': form.profile_type === type }">
              <input v-model="form.profile_type" type="radio" name="profile_type" :value="type" />
              <span class="profile-type__icon"><IconGlyph :name="type === 'creator' ? 'play' : 'layers'" /></span>
              <span>
                <strong>{{ copy.label }}</strong>
                <small>{{ copy.copy }}</small>
              </span>
            </label>
          </div>
        </fieldset>

        <label class="profile-field">
          <span>Display name <b aria-hidden="true">*</b></span>
          <input v-model="form.display_name" type="text" maxlength="200" autocomplete="organization" placeholder="The name your audience knows" />
          <small>This becomes your searchable Nudger ID automatically.</small>
        </label>

        <div class="profile-image-picker">
          <div>
            <span class="profile-field__label">Profile picture <b aria-hidden="true">*</b></span>
            <small>JPG, PNG or another image up to {{ formatBytes(config.profileImageSourceMaxBytes) }}. It will be resized to {{ config.profileImageMaxDimension }}px and saved as WebP.</small>
          </div>
          <button class="profile-upload" type="button" :disabled="state.isBusy" @click="openFilePicker">
            <span class="profile-upload__preview" :class="{ 'profile-upload__preview--empty': !previewUrl }">
              <img v-if="previewUrl" :src="previewUrl" alt="Selected profile picture preview" />
              <IconGlyph v-else name="send" />
            </span>
            <span>
              <strong>{{ selectedFile ? 'Choose a different picture' : 'Choose a picture' }}</strong>
              <small>{{ selectedFile?.name || 'Your audience sees this beside your updates.' }}</small>
            </span>
          </button>
          <input ref="profileImageInput" class="sr-only" type="file" accept="image/*" @change="selectFile" />
        </div>

        <div class="profile-links-grid">
          <label v-for="field in linkFields" :key="field.key" class="profile-field">
            <span>{{ field.label }} <em>optional</em></span>
            <input v-model="form[field.key]" type="url" :placeholder="field.placeholder" />
          </label>
        </div>

        <div v-if="state.isBusy" class="profile-progress" aria-live="polite">
          <div class="profile-progress__top"><span>Uploading profile picture</span><strong>{{ state.uploadProgress }}%</strong></div>
          <div class="profile-progress__track"><span :style="{ width: `${state.uploadProgress}%` }"></span></div>
          <small>Securely preparing your profile image…</small>
        </div>

        <p v-if="formError || state.errorMessage" class="profile-form__error" role="alert">{{ formError || state.errorMessage }}</p>
        <button class="button button--primary profile-form__submit" type="submit" :disabled="state.isBusy">
          <IconGlyph name="arrow-up-right" />
          {{ state.isBusy ? 'Creating your profile…' : 'Create merchant profile' }}
        </button>
      </form>

      <aside class="profile-preview-card" aria-label="Profile preview">
        <p class="panel-label">What people will see</p>
        <div class="profile-preview-card__avatar" :class="{ 'profile-preview-card__avatar--empty': !previewUrl }">
          <img v-if="previewUrl" :src="previewUrl" alt="" />
          <IconGlyph v-else name="users" />
        </div>
        <strong>{{ form.display_name || 'Your display name' }}</strong>
        <span>@{{ form.display_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'your-nudger-id' }}</span>
        <p>Your profile picture and Nudger ID help Nudgee subscribers know exactly who sent the update.</p>
      </aside>
    </div>

    <div v-else class="merchant-profile__ready">
      <div v-if="!state.profile.is_active" class="profile-status-notice" role="status" aria-live="polite">
        <span class="profile-status-notice__icon"><IconGlyph name="bell" /></span>
        <div>
          <strong>Your profile is inactive</strong>
          <p>Please wait while your merchant profile is reviewed and approved. You will be able to send nudges once it is active.</p>
        </div>
      </div>

      <div class="profile-card">
        <img class="profile-card__image" :src="state.profile.profile_image_url" :alt="`${state.profile.display_name} profile picture`" />
        <div class="profile-card__body">
          <div class="profile-card__meta"><span>{{ state.profile.profile_type }}</span><span :class="{ 'profile-card__status--inactive': !state.profile.is_active }">{{ state.profile.is_active ? 'Active' : 'Pending activation' }}</span></div>
          <h3>{{ state.profile.display_name }}</h3>
          <p class="profile-card__nudger-id">@{{ state.profile.nudger_id }}</p>
          <p v-if="state.profile.is_active">Your merchant profile is ready. This is the identity attached to every nudge you send.</p>
          <p v-else>Your profile has been saved and is waiting for approval.</p>
        </div>
      </div>

      <div class="profile-card__actions">
        <button class="button button--outline" type="button" :disabled="state.isBusy" @click="openFilePicker"><IconGlyph name="device" /> Change profile picture</button>
        <input ref="profileImageInput" class="sr-only" type="file" accept="image/*" @change="selectFile" />
        <button v-if="selectedFile" class="button button--primary" type="button" :disabled="state.isBusy" @click="handleChangeProfileImage">Upload new picture</button>
      </div>
      <div v-if="state.isBusy" class="profile-progress" aria-live="polite">
        <div class="profile-progress__top"><span>Uploading new profile picture</span><strong>{{ state.uploadProgress }}%</strong></div>
        <div class="profile-progress__track"><span :style="{ width: `${state.uploadProgress}%` }"></span></div>
      </div>
      <p v-if="formError || state.errorMessage" class="profile-form__error" role="alert">{{ formError || state.errorMessage }}</p>

      <div class="profile-links" v-if="profileLinks.length">
        <p class="panel-label">Public links</p>
        <a v-for="link in profileLinks" :key="link.label" :href="link.value" target="_blank" rel="noreferrer">{{ link.label }} <IconGlyph name="arrow-up-right" /></a>
      </div>

      <div v-if="selectedFile && !state.isBusy" class="profile-image-change-preview">
        <img :src="previewUrl || ''" alt="New profile picture preview" />
        <button type="button" class="text-link" @click="resetSelectedFile">Remove selected picture</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.merchant-profile {
  width: min(100%, 1120px);
  padding: clamp(26px, 4vw, 46px);
  border: 1px solid var(--color-border);
  border-radius: 32px;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
}

.merchant-profile__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
}

.merchant-profile h2 {
  max-width: 690px;
  margin: 10px 0 0;
  color: var(--color-text);
  font-size: clamp(2rem, 4vw, 3.8rem);
  font-weight: 850;
  letter-spacing: -0.065em;
  line-height: 1;
}

.merchant-profile__intro {
  max-width: 660px;
  margin: 18px 0 0;
  color: var(--color-text-muted);
  font-size: 15px;
  line-height: 1.6;
}

.merchant-profile__badge,
.profile-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: none;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  background: var(--color-surface-strong);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.merchant-profile__badge .icon-glyph {
  width: 14px;
  height: 14px;
  color: var(--color-coral);
}

.merchant-profile__setup {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(240px, 0.65fr);
  gap: 36px;
  margin-top: 42px;
}

.profile-form {
  display: grid;
  gap: 24px;
}

.profile-form__fieldset {
  min-width: 0;
  padding: 0;
  border: 0;
}

.profile-form__fieldset legend,
.profile-field__label {
  display: block;
  margin-bottom: 10px;
  color: var(--color-text);
  font-size: 12px;
  font-weight: 850;
}

.profile-form b {
  color: var(--color-coral);
}

.profile-type-grid,
.profile-links-grid {
  display: grid;
  gap: 10px;
}

.profile-type-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.profile-type {
  display: flex;
  min-height: 88px;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.025);
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
}

.profile-type:hover,
.profile-type--selected {
  border-color: rgba(255, 107, 74, 0.65);
  background: rgba(255, 107, 74, 0.1);
  transform: translateY(-2px);
}

.profile-type input {
  position: absolute;
  opacity: 0;
}

.profile-type__icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: none;
  place-items: center;
  border-radius: 12px;
  color: #ffad9b;
  background: rgba(255, 107, 74, 0.16);
}

.profile-type__icon .icon-glyph {
  width: 18px;
  height: 18px;
}

.profile-type > span:last-child,
.profile-upload > span:last-child {
  display: grid;
  gap: 4px;
}

.profile-type strong,
.profile-upload strong {
  color: var(--color-text);
  font-size: 13px;
}

.profile-type small,
.profile-upload small,
.profile-field small,
.profile-image-picker > div > small {
  color: var(--color-text-muted);
  font-size: 11px;
  line-height: 1.45;
}

.profile-field {
  display: grid;
  gap: 8px;
}

.profile-field > span {
  color: var(--color-text);
  font-size: 12px;
  font-weight: 850;
}

.profile-field em {
  margin-left: 5px;
  color: var(--color-text-muted);
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
}

.profile-field input {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  color: var(--color-text);
  outline: 0;
  background: var(--color-surface-strong);
  font-size: 13px;
}

.profile-field input:focus {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgba(168, 199, 250, 0.14);
}

.profile-links-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.profile-image-picker {
  display: grid;
  gap: 14px;
}

.profile-image-picker > div {
  display: grid;
  gap: 4px;
}

.profile-upload {
  display: flex;
  min-height: 78px;
  align-items: center;
  gap: 14px;
  padding: 10px;
  border: 1px dashed rgba(255, 107, 74, 0.55);
  border-radius: 18px;
  color: var(--color-text);
  background: rgba(255, 107, 74, 0.06);
  cursor: pointer;
  text-align: left;
}

.profile-upload:disabled {
  cursor: wait;
  opacity: 0.65;
}

.profile-upload__preview {
  display: grid;
  width: 56px;
  height: 56px;
  flex: none;
  place-items: center;
  overflow: hidden;
  border-radius: 16px;
  color: #ffad9b;
  background: rgba(255, 107, 74, 0.16);
}

.profile-upload__preview img,
.profile-image-change-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-upload__preview .icon-glyph {
  width: 22px;
  height: 22px;
}

.profile-progress {
  display: grid;
  gap: 9px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(79, 70, 229, 0.14);
}

.profile-progress__top {
  display: flex;
  justify-content: space-between;
  color: var(--color-text);
  font-size: 12px;
  font-weight: 800;
}

.profile-progress__track {
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.profile-progress__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-coral), #ffc1b3);
  transition: width 150ms ease;
}

.profile-progress small {
  color: var(--color-text-muted);
  font-size: 11px;
}

.profile-form__error {
  margin: 0;
  color: #ffb4a3;
  font-size: 12px;
  line-height: 1.5;
}

.profile-form__submit {
  justify-self: start;
}

.profile-preview-card {
  align-self: start;
  padding: 22px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface-strong);
  text-align: center;
}

.profile-preview-card .panel-label {
  margin: 0;
  text-align: left;
}

.profile-preview-card__avatar {
  display: grid;
  width: 132px;
  height: 132px;
  margin: 30px auto 18px;
  place-items: center;
  overflow: hidden;
  border: 4px solid rgba(255, 107, 74, 0.26);
  border-radius: 38px;
  color: #ffad9b;
  background: rgba(255, 107, 74, 0.12);
}

.profile-preview-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-preview-card__avatar .icon-glyph {
  width: 36px;
  height: 36px;
}

.profile-preview-card > strong,
.profile-preview-card > span {
  display: block;
}

.profile-preview-card > strong {
  color: var(--color-text);
  font-size: 20px;
}

.profile-preview-card > span {
  margin-top: 6px;
  color: #ffad9b;
  font-size: 12px;
  font-weight: 800;
}

.profile-preview-card > p:last-child {
  margin: 22px 0 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.55;
}

.merchant-profile__ready {
  display: grid;
  gap: 24px;
  margin-top: 42px;
}

.profile-status-notice {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  border: 1px solid rgba(243, 207, 140, 0.35);
  border-radius: 20px;
  background: rgba(243, 207, 140, 0.1);
}

.profile-status-notice__icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  color: #f3cf8c;
  background: rgba(243, 207, 140, 0.16);
}

.profile-status-notice__icon .icon-glyph {
  width: 19px;
  height: 19px;
}

.profile-status-notice strong {
  display: block;
  color: var(--color-text);
  font-size: 14px;
}

.profile-status-notice p {
  max-width: 680px;
  margin: 5px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.55;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface-strong);
}

.profile-card__image {
  width: 124px;
  height: 124px;
  flex: none;
  border-radius: 30px;
  object-fit: cover;
}

.profile-card__body {
  min-width: 0;
}

.profile-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-card__meta span:first-child {
  color: #ffb4a3;
  text-transform: capitalize;
}

.profile-card__meta span:nth-child(2) {
  color: #9de4bf;
}

.profile-card__meta .profile-card__status--inactive {
  color: #f3cf8c;
}

.profile-card h3 {
  margin: 18px 0 0;
  color: var(--color-text);
  font-size: clamp(1.8rem, 4vw, 3rem);
  letter-spacing: -0.06em;
}

.profile-card__nudger-id {
  margin: 5px 0 0;
  color: #ffad9b;
  font-size: 13px;
  font-weight: 800;
}

.profile-card__body > p:last-child {
  max-width: 620px;
  margin: 14px 0 0;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.55;
}

.profile-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.profile-card__actions .icon-glyph {
  width: 17px;
  height: 17px;
}

.profile-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.profile-links .panel-label {
  width: 100%;
  margin: 0 0 2px;
}

.profile-links a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 11px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 800;
}

.profile-links a:hover {
  color: var(--color-text);
  border-color: var(--color-focus);
}

.profile-links .icon-glyph {
  width: 13px;
  height: 13px;
}

.profile-image-change-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.profile-image-change-preview img {
  width: 56px;
  height: 56px;
  border-radius: 15px;
}

.merchant-profile__loading {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.merchant-profile__loading .auth-loading__spinner {
  width: 24px;
  height: 24px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 760px) {
  .merchant-profile__heading,
  .profile-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .merchant-profile__setup {
    grid-template-columns: 1fr;
  }

  .merchant-profile__badge {
    display: none;
  }
}

@media (max-width: 500px) {
  .merchant-profile {
    padding: 22px 18px;
    border-radius: 24px;
  }

  .profile-type-grid,
  .profile-links-grid {
    grid-template-columns: 1fr;
  }

  .profile-card__image {
    width: 96px;
    height: 96px;
  }
}
</style>
