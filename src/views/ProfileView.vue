<script setup lang="ts">
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import MerchantProfileManager from '../components/profile/MerchantProfileManager.vue'
import AppearanceSettings from '../components/settings/AppearanceSettings.vue'
import { PROFILE_TYPE_OPTIONS } from '../data/merchantProfile'
import { useAuth } from '../composables/useAuth'
import { usePagePresentation } from '../composables/usePageLayout'

const { state } = useAuth()
const { smAndDown } = useDisplay()
const managerRef = ref<InstanceType<typeof MerchantProfileManager> | null>(null)
usePagePresentation(() => {
  const profile = state.merchantProfile
  const accountType = PROFILE_TYPE_OPTIONS.find(option => option.value === profile?.profile_type)
  return {
    badges: profile && accountType ? [
      { label: accountType.title, icon: accountType.icon },
      { label: 'Broadcast', icon: 'mdi-bullhorn-outline' },
      ...(profile.profile_type === 'platform'
        ? [{ label: 'Transactional', icon: 'mdi-account-arrow-right-outline' }] : []),
    ] : [],
    badge: profile ? {
      label: profile.is_active ? 'Active' : 'Pending review',
      tone: profile.is_active ? 'success' : 'warning',
      icon: profile.is_active ? 'mdi-check-circle-outline' : 'mdi-clock-outline',
    } : undefined,
  }
})
</script>

<template>
  <div class="ui-content-stack">
    <MerchantProfileManager ref="managerRef" mode="profile" />
    <AppearanceSettings />
    <div v-if="smAndDown" class="ui-session-actions">
      <v-btn class="ui-detail-card__action" type="button" variant="outlined" rounded="pill" block
        prepend-icon="mdi-logout-variant" :loading="managerRef?.isSigningOut" :aria-busy="Boolean(managerRef?.isSigningOut)"
        :disabled="!managerRef || managerRef.isLoading || managerRef.isBusy || managerRef.isSigningOut"
        @click="managerRef?.signOut()">Log out</v-btn>
      <span class="ui-visually-hidden" role="status">{{ managerRef?.isSigningOut ? 'Signing out…' : '' }}</span>
    </div>
  </div>
</template>
