<script setup lang="ts">
import { computed } from 'vue'
import Avatar from './Avatar.vue'
import BrandLogo from './BrandLogo.vue'
import MediaPreview from './MediaPreview.vue'
import { safeNotificationUrl } from '../../lib/notificationContent'
import type { NotificationContent } from '../../types/notification'

const props = withDefaults(defineProps<{
  title: string
  message: string
  imageUrl?: string | null
  isLive?: boolean
  isExpanded?: boolean
  content?: NotificationContent
}>(), { isLive: true, isExpanded: false })

const previewTitle = computed(() => props.title.trim() || 'Your profile name')
const previewMessage = computed(() => props.message.trim() || 'Your message will appear here as you write it.')
const mediaUrl = computed(() => props.content?.notification_format === 'rich'
  ? safeNotificationUrl(props.content.media_url) : null)
</script>

<template>
  <figure class="ui-notification-preview" :class="{ 'is-expanded': isExpanded }" aria-label="Notification preview">
    <figcaption class="ui-notification-preview__caption">
      <span>Notification preview</span>
      <span v-if="isLive" class="ui-notification-preview__live"><span aria-hidden="true" /> Live</span>
    </figcaption>
    <div class="ui-notification-preview__card">
      <span class="ui-notification-preview__sender" aria-hidden="true">
        <Avatar :src="imageUrl" />
        <span class="ui-notification-preview__badge"><BrandLogo size="small" alt="" /></span>
      </span>
      <div class="ui-notification-preview__content">
        <div class="ui-notification-preview__heading">
          <strong class="ui-notification-preview__title" :title="previewTitle">{{ previewTitle }}</strong>
          <span class="ui-notification-preview__time">now</span>
        </div>
        <div class="ui-notification-preview__body">
          <p class="ui-notification-preview__message">{{ previewMessage }}</p>
          <MediaPreview v-if="mediaUrl" :src="mediaUrl" compact />
        </div>
      </div>
    </div>
    <p class="ui-notification-preview__note">Appearance varies by device. Review the full message before sending.</p>
  </figure>
</template>
