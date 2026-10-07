<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth'
import ActionDock, { type DockAction } from '../ui/ActionDock.vue'

const { state, isAuthenticated, initializeAuth } = useAuth()

// Restore the shared session without delaying the public page or fetching another profile.
onMounted(initializeAuth)

const actions = computed<DockAction[]>(() => {
  if (isAuthenticated.value && state.merchantProfile) {
    return [{
      id: 'workspace', label: 'Open dashboard', icon: 'mdi-arrow-right',
      to: '/nudges', isPrimary: true,
      description: state.merchantProfile.is_active ? undefined : 'Profile awaiting approval',
    }]
  }
  return [
    {
      id: 'receive', label: 'Get the app', description: 'Receive · Coming soon',
      accessibleLabel: 'Get the app to receive notifications — coming soon',
      icon: 'mdi-bell-outline', to: { path: '/', hash: '#get-app' },
    },
    {
      id: 'send', label: 'Start sending', description: 'Create your profile',
      accessibleLabel: 'Start sending notifications — create your profile',
      icon: 'mdi-send-outline', to: isAuthenticated.value ? '/onboarding' : '/login', isPrimary: true,
    },
  ]
})
</script>

<template>
  <ActionDock :actions="actions" :is-loading="!state.isInitialized" />
</template>
