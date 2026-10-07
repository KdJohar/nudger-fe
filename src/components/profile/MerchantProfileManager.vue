<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getNudgerConfig } from '../../config'
import { useAuth } from '../../composables/useAuth'
import { useMerchantProfile } from '../../composables/useMerchantProfile'
import AvatarPicker from '../ui/AvatarPicker.vue'
import MerchantProfileSetup from './MerchantProfileSetup.vue'
import MerchantProfileDetails from './MerchantProfileDetails.vue'
import type { MerchantProfileForm, MerchantProfileType } from '../../types/merchantProfile'

const props = withDefaults(defineProps<{ mode?: 'onboarding' | 'pending' | 'profile' }>(), { mode: 'profile' })
const emit = defineEmits<{ saved: [] }>()
const router = useRouter()
const { logout } = useAuth()
const isSigningOut = ref(false)
const detailsRef = ref<InstanceType<typeof MerchantProfileDetails> | null>(null)
const { profile, isLoading, isBusy, isUpdatingDetails, uploadProgress, errorMessage, loadProfile, saveProfile, updateProfileImage, updateProfileDetails } = useMerchantProfile()
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const profileType = ref<MerchantProfileType>('creator')
const displayName = ref('')
const websiteUrl = ref('')
const instagramUrl = ref('')
const youtubeUrl = ref('')
const facebookUrl = ref('')
const linkedinUrl = ref('')
const xUrl = ref('')
const imageFile = ref<File | null>(null)
const replacementImageFile = ref<File | null>(null)
const maxImageBytes = getNudgerConfig().profileImageSourceMaxBytes
const isEditing = ref(props.mode === 'onboarding')
const successMessage = ref<string | null>(null)

const isOnboarding = computed(() => props.mode === 'onboarding')
const isPending = computed(() => props.mode === 'pending')
const title = computed(() => isOnboarding.value ? 'Create your Nudger profile' : isPending.value ? 'Your profile is under review' : 'Your Nudger profile')
const description = computed(() => isOnboarding.value ? 'Tell your audience who is behind the messages. This profile becomes your identity in the Nudger network.' : isPending.value ? 'Your profile is saved and waiting for approval. You can still keep the public details up to date.' : 'This is the identity connected to your Nudger workspace.')
const displayNameRules = [(value: string) => Boolean(value?.trim()) || 'Display name is required.']
const imageRules = [(value: File | File[] | null) => Boolean(value) || 'Choose a profile image to continue.']

onMounted(async () => {
  const current = await loadProfile()
  if (current) {
    profileType.value = current.profile_type
    displayName.value = current.display_name
    websiteUrl.value = current.website_url || ''
    instagramUrl.value = current.instagram_url || ''
    youtubeUrl.value = current.youtube_url || ''
    facebookUrl.value = current.facebook_url || ''
    linkedinUrl.value = current.linkedin_url || ''
    xUrl.value = current.x_url || ''
  }
})

function handleFileUpdate(value: File | File[] | null): void { imageFile.value = Array.isArray(value) ? value[0] || null : value }

async function handleSignOut(): Promise<void> {
  if (isSigningOut.value || isBusy.value || isLoading.value) return
  if (detailsRef.value && !detailsRef.value.prepareSignOut()) return
  isSigningOut.value = true
  try {
    await logout()
  } catch {
    // logout always clears the local session, even if server revocation fails.
  }
  try {
    await router.replace('/login')
  } finally {
    isSigningOut.value = false
  }
}

defineExpose({ signOut: handleSignOut, isBusy, isLoading, isSigningOut })

async function submit(): Promise<void> {
  if (isSigningOut.value) return
  const validation = await formRef.value?.validate()
  if (!validation?.valid) return
  const form: MerchantProfileForm = {
    profile_type: profileType.value,
    display_name: displayName.value.trim(),
    website_url: websiteUrl.value.trim() || undefined,
    instagram_url: instagramUrl.value.trim() || undefined,
    youtube_url: youtubeUrl.value.trim() || undefined,
    facebook_url: facebookUrl.value.trim() || undefined,
    linkedin_url: linkedinUrl.value.trim() || undefined,
    x_url: xUrl.value.trim() || undefined,
  }
  const saved = await saveProfile(form, imageFile.value)
  if (!saved) return
  successMessage.value = isOnboarding.value ? 'Profile created. Welcome to Nudger.' : 'Profile updated.'
  isEditing.value = false
  imageFile.value = null
  emit('saved')
  if (isOnboarding.value) await router.push(saved.is_active ? '/audience' : '/pending')
}

async function handleImageReplacement(file: File | null): Promise<void> {
  if (!file) {
    replacementImageFile.value = null
    return
  }
  if (isBusy.value || isSigningOut.value) return
  replacementImageFile.value = file
  successMessage.value = null
  try {
    const saved = await updateProfileImage(file)
    if (saved) successMessage.value = 'Profile image updated.'
  } finally {
    // Release the local preview and show the last successfully saved image.
    replacementImageFile.value = null
  }
}

async function handleCreateProfile(form: MerchantProfileForm, file: File): Promise<void> {
  if (isBusy.value || isSigningOut.value) return
  const saved = await saveProfile(form, file)
  if (!saved) return
  emit('saved')
  await router.push(saved.is_active ? '/audience' : '/pending')
}
</script>

<template>
  <section class="profile-manager" :class="{ 'page-view': mode !== 'profile' }">
    <div v-if="mode !== 'profile'" class="section-header profile-manager__header ui-intro-header">
      <div>
        <div class="section-header__eyebrow">Nudger identity</div>
        <h1 class="section-header__title ui-intro-header__title">{{ title }}</h1>
        <p class="section-header__description">{{ description }}</p>
      </div>
      <v-chip v-if="profile && !isOnboarding" :color="profile.is_active ? 'success' : 'warning'" size="small" variant="tonal"><v-icon start :icon="profile.is_active ? 'mdi-check-circle-outline' : 'mdi-clock-outline'" />{{ profile.is_active ? 'Active' : 'Pending review' }}</v-chip>
      <v-btn
        class="ui-intro-header__action"
        aria-label="Log out"
        :title="isBusy ? 'Wait for your profile to finish saving' : 'Log out'"
        :aria-busy="isSigningOut"
        :disabled="isBusy || isSigningOut"
        :loading="isSigningOut"
        icon="mdi-logout-variant"
        rounded="circle"
        size="48"
        type="button"
        variant="tonal"
        @click="handleSignOut"
      />
      <span class="ui-visually-hidden" role="status">{{ isSigningOut ? 'Signing out…' : '' }}</span>
    </div>
    <v-alert v-if="errorMessage" class="mb-5" closable type="error" variant="tonal">{{ errorMessage }}</v-alert>
    <v-alert v-if="successMessage" class="mb-5" closable type="success" variant="tonal">{{ successMessage }}</v-alert>
    <div v-if="isLoading" class="app-loading profile-manager__loading"><v-progress-circular color="primary" indeterminate /><span>Loading profile…</span></div>
    <template v-else>
      <MerchantProfileDetails
        v-if="mode === 'profile' && profile && !isEditing"
        ref="detailsRef"
        :profile="profile"
        :image-file="replacementImageFile"
        :max-image-bytes="maxImageBytes"
        :is-busy="isBusy && !isUpdatingDetails"
        :is-disabled="isSigningOut || isUpdatingDetails"
        :upload-progress="uploadProgress"
        :save-details="updateProfileDetails"
        @details-saved="successMessage = 'Public profile updated.'"
        @image-selected="handleImageReplacement"
      />
      <v-card v-else-if="profile && !isEditing" class="surface-card profile-card" rounded="xl">
        <div class="profile-card__hero"><v-avatar class="profile-card__avatar ui-avatar" size="88"><v-img v-if="profile.profile_image_url" :src="profile.profile_image_url" alt="Profile image" /><span v-else>{{ profile.display_name.slice(0, 1).toUpperCase() }}</span></v-avatar><div><div class="profile-card__eyebrow">{{ profile.profile_type === 'platform' ? 'Platform profile' : 'Creator profile' }}</div><h2 class="profile-card__name">{{ profile.display_name }}</h2><div class="profile-card__id">@{{ profile.nudger_id }}</div></div></div>
        <v-divider />
        <div class="profile-card__details"><div v-for="link in [{ label: 'Website', value: profile.website_url, icon: 'mdi-web' }, { label: 'Instagram', value: profile.instagram_url, icon: 'mdi-instagram' }, { label: 'YouTube', value: profile.youtube_url, icon: 'mdi-youtube' }, { label: 'Facebook', value: profile.facebook_url, icon: 'mdi-facebook' }, { label: 'LinkedIn', value: profile.linkedin_url, icon: 'mdi-linkedin' }, { label: 'X', value: profile.x_url, icon: 'mdi-twitter' }].filter((item) => item.value)" :key="link.label" class="profile-card__link"><v-icon :icon="link.icon" size="18" /><span>{{ link.label }}</span><a :href="link.value || ''" rel="noreferrer" target="_blank">{{ link.value }}</a></div><div v-if="!profile.website_url && !profile.instagram_url && !profile.youtube_url && !profile.facebook_url && !profile.linkedin_url && !profile.x_url" class="profile-card__empty">Add a public link to make your profile easier to discover.</div></div>
        <v-divider />
        <div class="profile-card__image-row">
          <AvatarPicker
            class="ma-0"
            :model-value="replacementImageFile"
            :src="profile.profile_image_url"
            :initials="profile.display_name.slice(0, 1).toUpperCase()"
            :max-bytes="maxImageBytes"
            :is-busy="isBusy"
            :is-disabled="isSigningOut"
            label="Profile image"
            @update:model-value="handleImageReplacement"
          />
        </div>
        <v-progress-linear v-if="isBusy" class="profile-card__progress" color="primary" :model-value="uploadProgress" />
      </v-card>
      <MerchantProfileSetup v-else-if="isOnboarding" :is-busy="isBusy" :upload-progress="uploadProgress" @submit="handleCreateProfile" />
      <v-form v-else ref="formRef" class="profile-form" @submit.prevent="submit">
        <v-row><v-col cols="12" lg="8"><v-card class="surface-card profile-form__card" rounded="xl"><div class="profile-form__card-head"><div><div class="profile-card__eyebrow">Public details</div><h2 class="profile-form__title">Make the workspace yours</h2></div><v-icon color="primary" icon="mdi-account-edit-outline" size="28" /></div><v-radio-group v-model="profileType" class="profile-form__type" color="secondary" inline :disabled="Boolean(profile)"><template #label><span class="profile-form__label">I am a</span></template><v-radio label="Creator" value="creator" /><v-radio label="Platform" value="platform" /></v-radio-group><v-text-field v-model="displayName" :rules="displayNameRules" label="Display name" placeholder="The name your audience knows" prepend-inner-icon="mdi-account-outline" /><v-file-input v-if="isOnboarding" v-model="imageFile" :rules="imageRules" accept="image/*" label="Profile image" prepend-inner-icon="mdi-image-outline" prepend-icon="" show-size hint="A clear square image works best." persistent-hint @update:model-value="handleFileUpdate" /><div class="profile-form__links-title">Public links <span>optional</span></div><v-row dense><v-col cols="12" sm="6"><v-text-field v-model="websiteUrl" label="Website" prepend-inner-icon="mdi-web" /></v-col><v-col cols="12" sm="6"><v-text-field v-model="instagramUrl" label="Instagram" prepend-inner-icon="mdi-instagram" /></v-col><v-col cols="12" sm="6"><v-text-field v-model="youtubeUrl" label="YouTube" prepend-inner-icon="mdi-youtube" /></v-col><v-col cols="12" sm="6"><v-text-field v-model="facebookUrl" label="Facebook" prepend-inner-icon="mdi-facebook" /></v-col><v-col cols="12" sm="6"><v-text-field v-model="linkedinUrl" label="LinkedIn" prepend-inner-icon="mdi-linkedin" /></v-col><v-col cols="12" sm="6"><v-text-field v-model="xUrl" label="X" prepend-inner-icon="mdi-twitter" /></v-col></v-row><v-progress-linear v-if="isBusy && uploadProgress > 0" class="profile-form__progress" color="primary" :model-value="uploadProgress" /><div class="profile-form__actions"><v-btn v-if="!isOnboarding" variant="text" @click="isEditing = false">Cancel</v-btn><v-btn color="primary" :loading="isBusy" type="submit">{{ isOnboarding ? 'Create profile' : 'Save changes' }}<v-icon end icon="mdi-arrow-right" /></v-btn></div></v-card></v-col><v-col cols="12" lg="4"><v-card class="profile-form__aside" rounded="xl"><v-icon color="primary" icon="mdi-lightbulb-on-outline" size="26" /><h3>One profile, every nudge</h3><p>Your display name and image help subscribers recognise messages from you across the Nudger network.</p><div class="profile-form__aside-note"><v-icon icon="mdi-lock-outline" size="16" /> You can update these details later.</div></v-card></v-col></v-row>
      </v-form>
    </template>
  </section>
</template>
