<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  mode?: 'notifications' | 'controls'
}>(), { mode: 'notifications' })

const notifications = [
  { id: 'affirmation', icon: 'mdi-white-balance-sunny', sender: 'Sarah', category: 'Morning Affirmation', message: "You don't need to figure everything out today...", tone: 'peach' },
  { id: 'video', icon: 'mdi-play-circle-outline', sender: 'MKBHD', category: 'New Upload', message: 'iPhone Review is live!', tone: 'violet' },
  { id: 'script', icon: 'mdi-code-braces', sender: 'Python Script', category: 'Dev Alert', message: 'Model training finished after 3h 42m', tone: 'mint' },
] as const

const activeNotification = ref<string>('affirmation')
const isAffirmationEnabled = ref(true)
const isLiveStreamEnabled = ref(false)
const isInboxOnly = ref(true)
const selectedNotification = computed(() => notifications.find((item) => item.id === activeNotification.value) ?? notifications[0])

function handleNotificationSelect(id: string): void {
  activeNotification.value = id
}
</script>

<template>
  <div class="phone-preview" :class="`phone-preview--${props.mode}`">
    <div class="phone-preview__shell">
      <div class="phone-preview__island" aria-hidden="true" />
      <div class="phone-preview__status" aria-hidden="true"><span>9:41</span><span><v-icon icon="mdi-signal-cellular-3" size="14" /><v-icon icon="mdi-wifi" size="14" /><v-icon icon="mdi-battery" size="15" /></span></div>

      <template v-if="props.mode === 'notifications'">
        <div class="phone-preview__lock"><v-icon icon="mdi-lock-outline" size="18" /><strong>9:41</strong><span>Tuesday, a quieter morning</span></div>
        <div class="phone-preview__notification-list" aria-label="Sample notifications">
          <button v-for="item in notifications" :key="item.id" class="phone-preview__notification" :class="[`phone-preview__notification--${item.tone}`, { 'phone-preview__notification--selected': activeNotification === item.id }]" type="button" :aria-pressed="activeNotification === item.id" @click="handleNotificationSelect(item.id)">
            <span class="phone-preview__notification-icon"><v-icon :icon="item.icon" size="21" /></span>
            <span class="phone-preview__notification-copy"><span><strong>{{ item.sender }}</strong><small>now</small></span><b>{{ item.category }}</b><span>{{ item.message }}</span></span>
          </button>
        </div>
        <div class="phone-preview__insight" aria-live="polite"><v-icon icon="mdi-check-circle-outline" size="16" /> Selected: {{ selectedNotification.sender }} · {{ selectedNotification.category }}</div>
      </template>

      <template v-else>
        <div class="phone-preview__app-head"><div><span>YOUR SPACE</span><h3>Sarah's channel</h3></div><span class="phone-preview__app-avatar">S</span></div>
        <div class="phone-preview__channel-card"><span class="phone-preview__channel-icon"><v-icon icon="mdi-white-balance-sunny" size="24" /></span><div><strong>Morning with Sarah</strong><span>Mindful words, on your terms.</span></div></div>
        <div class="phone-preview__settings-title">What reaches you</div>
        <label class="phone-preview__setting"><span><v-icon icon="mdi-weather-sunny" size="20" /><span><strong>Daily affirmation</strong><small>Morning notes</small></span></span><input v-model="isAffirmationEnabled" type="checkbox" aria-label="Daily affirmation notifications" /><span class="phone-preview__switch" aria-hidden="true" /></label>
        <label class="phone-preview__setting"><span><v-icon icon="mdi-video-outline" size="20" /><span><strong>Live stream</strong><small>{{ isLiveStreamEnabled ? 'Notifications on' : 'Muted for now' }}</small></span></span><input v-model="isLiveStreamEnabled" type="checkbox" aria-label="Live stream notifications" /><span class="phone-preview__switch" aria-hidden="true" /></label>
        <label class="phone-preview__setting phone-preview__setting--inbox"><span><v-icon icon="mdi-inbox-outline" size="20" /><span><strong>Send to inbox only</strong><small>Read when you're ready</small></span></span><input v-model="isInboxOnly" type="checkbox" aria-label="Send to inbox only" /><span class="phone-preview__switch" aria-hidden="true" /></label>
        <div class="phone-preview__quiet-note"><v-icon icon="mdi-shield-check-outline" size="17" /> Every change is yours to make.</div>
      </template>
      <div class="phone-preview__home-indicator" aria-hidden="true" />
    </div>
  </div>
</template>
