<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  message: string
  imageUrl?: string | null
  isActive?: boolean
  variant?: 'default' | 'adaptive'
}>(), { isActive: true })

const hasImageError = ref(false)
const previewTitle = computed(() => props.title.trim() || 'Your profile name')
const previewMessage = computed(() => props.message.trim() || 'Your message will appear here as you write it.')
const currentTime = ref(new Date())
const previewTime = computed(() => new Intl.DateTimeFormat('en', {
  hour: 'numeric', minute: '2-digit', hour12: true,
}).formatToParts(currentTime.value).filter(part => part.type !== 'dayPeriod').map(part => part.value).join('').trim())
const previewDate = computed(() => new Intl.DateTimeFormat('en', {
  weekday: 'long', month: 'long', day: 'numeric',
}).format(currentTime.value))
let clockTimer: number | undefined

function stopClock(): void {
  window.clearTimeout(clockTimer)
  clockTimer = undefined
}

function refreshClock(): void {
  stopClock()
  if (!props.isActive || document.visibilityState === 'hidden') return
  currentTime.value = new Date()
  // Align to the next minute, including midnight, without running a per-second timer.
  clockTimer = window.setTimeout(refreshClock, 60_000 - currentTime.value.getTime() % 60_000)
}

watch(() => props.imageUrl, () => { hasImageError.value = false })
watch(() => props.isActive, refreshClock)

onMounted(() => {
  refreshClock()
  document.addEventListener('visibilitychange', refreshClock)
  window.addEventListener('focus', refreshClock)
  window.addEventListener('pageshow', refreshClock)
})

onBeforeUnmount(() => {
  stopClock()
  document.removeEventListener('visibilitychange', refreshClock)
  window.removeEventListener('focus', refreshClock)
  window.removeEventListener('pageshow', refreshClock)
})
</script>

<template>
  <div class="device-preview" :class="{ 'device-preview--adaptive': variant === 'adaptive' }" aria-label="Mobile lock screen notification preview">
    <div class="device-preview__frame">
      <div class="device-preview__top" aria-hidden="true">
        <span>{{ previewTime }}</span>
        <span class="device-preview__island" />
        <span class="device-preview__signals">
          <v-icon icon="mdi-signal" size="14" />
          <v-icon icon="mdi-wifi" size="14" />
          <v-icon icon="mdi-battery" size="17" />
        </span>
      </div>
      <div class="device-preview__lock" aria-hidden="true">
        <v-icon icon="mdi-lock-outline" size="17" />
        <strong>{{ previewTime }}</strong>
        <span>{{ previewDate }}</span>
      </div>
      <div class="device-preview__card">
        <span class="device-preview__avatar" aria-hidden="true">
          <img v-if="imageUrl && !hasImageError" :src="imageUrl" alt="" @error="hasImageError = true" />
          <v-icon v-else icon="mdi-account-circle" size="30" />
        </span>
        <div class="device-preview__notification">
          <div class="device-preview__notification-head">
            <strong class="device-preview__title" :title="previewTitle">{{ previewTitle }}</strong>
            <span class="device-preview__time">now</span>
          </div>
          <p class="device-preview__message">{{ previewMessage }}</p>
        </div>
      </div>
      <div class="device-preview__bottom" aria-hidden="true">
        <v-icon icon="mdi-flashlight" size="20" />
        <span />
        <v-icon icon="mdi-camera-outline" size="20" />
      </div>
      <div class="device-preview__home-indicator" aria-hidden="true" />
    </div>
  </div>
</template>
