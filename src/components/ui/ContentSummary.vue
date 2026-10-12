<script setup lang="ts">
import { computed } from 'vue'
import MediaPreview from './MediaPreview.vue'
import { ctaText, hasRichAction } from '../../lib/notificationContent'
import type { NotificationContent } from '../../types/notification'
const props = withDefaults(defineProps<{ content: NotificationContent; isMediaVisible?: boolean }>(), { isMediaVisible: true })
const hasAction = computed(() => hasRichAction(props.content))
</script>
<template>
  <div v-if="content.notification_format === 'rich'" class="ui-content-summary">
    <span class="ui-status-tag">Rich</span>
    <MediaPreview v-if="isMediaVisible" :src="content.media_url" />
    <div v-if="hasAction" class="ui-content-summary__destination"><strong>{{ ctaText(content.cta_label) }}</strong><span>{{ content.destination_url }}</span></div>
  </div>
</template>
