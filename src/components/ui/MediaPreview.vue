<script setup lang="ts">
import { ref, watch } from 'vue'
import { safeNotificationUrl } from '../../lib/notificationContent'
const props = withDefaults(defineProps<{ src?: string | null; alt?: string; compact?: boolean }>(), { alt: 'Notification image', compact: false })
const hasError = ref(false)
watch(() => props.src, () => { hasError.value = false })
</script>
<template>
  <div v-if="safeNotificationUrl(src)" class="ui-media" :class="{ 'ui-media--compact': compact }">
    <img v-if="!hasError" :key="src || ''" :src="src!" :alt="alt" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="hasError = true" />
    <span v-else class="ui-media__fallback"><v-icon icon="mdi-image-off-outline" aria-hidden="true" />{{ compact ? 'Image' : 'Image unavailable. The message and link are still available.' }}</span>
  </div>
</template>
