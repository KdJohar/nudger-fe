<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import Sheet from '../ui/Sheet.vue'
import MessageField from '../ui/MessageField.vue'
import NotificationPreview from '../ui/NotificationPreview.vue'
import { useAuth } from '../../composables/useAuth'
import { useBroadcastComposer } from '../../composables/useBroadcastComposer'
import { BROADCAST_MESSAGE_LIMIT } from '../../lib/broadcastNudge'

const isOpen = defineModel<boolean>({ default: false })
const emit = defineEmits<{ queued: [] }>()
const { state, authenticatedRequest } = useAuth()
const sheet = ref<InstanceType<typeof Sheet> | null>(null)
const messageField = ref<InstanceType<typeof MessageField> | null>(null)
const formId = useId()
const profile = computed(() => state.merchantProfile)
const {
  message, fieldError, sendError, confirmedMessage, isReviewing, isSending, isQueued, title, isProfileReady,
  handleReview: review, handleEdit: edit, handleSend: send, handleReset,
} = useBroadcastComposer(profile, authenticatedRequest)
const sheetTitle = computed(() => isQueued.value ? 'Nudge queued' : isReviewing.value ? 'Ready to send?' : 'Send a nudge')
const sheetDescription = computed(() => isQueued.value
  ? 'Follow its progress in your nudge history.'
  : isReviewing.value ? 'One last look before it reaches your subscribers.' : 'Your message. Straight to their lock screen.')

async function handleReview(): Promise<void> {
  if (!review()) {
    await nextTick()
    if (fieldError.value) messageField.value?.focus()
    return
  }
  await nextTick()
  sheet.value?.focusTitle()
}

async function handleEdit(): Promise<void> {
  edit()
  await nextTick()
  messageField.value?.focus()
}

async function handleSend(): Promise<void> {
  if (!await send()) return
  emit('queued')
  await nextTick()
  sheet.value?.focusTitle()
}

async function handleWriteAnother(): Promise<void> {
  handleReset()
  await nextTick()
  messageField.value?.focus()
}

watch(isOpen, (opened) => {
  if (!opened) edit()
  else if (isQueued.value) handleReset()
})
</script>

<template>
  <Sheet ref="sheet" v-model="isOpen" :title="sheetTitle" :description="sheetDescription" :is-busy="isSending">
    <v-alert v-if="!isProfileReady" class="ui-composer__alert" type="warning" variant="tonal">
      Your profile needs to be active, with a name of 120 characters or fewer, before you can send.
      <router-link to="/profile">Review profile</router-link>
    </v-alert>

    <div v-if="isQueued" class="ui-composer__success">
      <span class="ui-composer__success-icon"><v-icon icon="mdi-check" size="32" /></span>
      <h3 class="ui-composer__success-title">Your update is on its way.</h3>
      <p class="ui-composer__copy">Delivery is running in the background. You can check its progress in your history.</p>
    </div>
    <div v-else class="ui-composer">
      <aside class="ui-composer__preview" aria-label="Live notification preview">
        <div class="ui-composer__preview-label">
          <span><v-icon icon="mdi-cellphone" size="16" /> Lock screen</span>
          <span class="ui-composer__live"><span aria-hidden="true" /> Live preview</span>
        </div>
        <NotificationPreview
          :is-active="isOpen"
          :image-url="profile?.profile_image_url"
          :message="isReviewing ? confirmedMessage : message"
          :title="title"
        />
      </aside>

      <div v-if="isReviewing" class="ui-composer__review">
        <span class="ui-composer__audience"><v-icon icon="mdi-account-group-outline" size="18" /> Broadcast to your subscribers</span>
        <div class="ui-composer__review-message"><strong>{{ title }}</strong><p>{{ confirmedMessage }}</p></div>
        <p class="ui-composer__copy">Subscribers receive this based on their notification preferences.</p>
        <v-alert v-if="sendError" type="error" variant="tonal" role="alert">{{ sendError }}</v-alert>
      </div>

      <form v-else :id="formId" class="ui-composer__editor" novalidate @submit.prevent="handleReview">
        <MessageField ref="messageField" v-model="message" :limit="BROADCAST_MESSAGE_LIMIT" :error="fieldError" />
        <span class="ui-composer__audience"><v-icon icon="mdi-account-group-outline" size="18" /> Broadcast to your subscribers</span>
      </form>
    </div>
    <span class="ui-sheet__sr-only" role="status">{{ isQueued ? 'Your nudge is queued.' : isSending ? 'Sending your nudge.' : '' }}</span>

    <template #footer>
      <div class="ui-composer__actions">
        <template v-if="isQueued">
          <v-btn variant="text" rounded="pill" @click="handleWriteAnother">Write another</v-btn>
          <v-btn color="secondary" variant="flat" rounded="pill" @click="isOpen = false">Done</v-btn>
        </template>
        <template v-else-if="isReviewing">
          <v-btn variant="text" rounded="pill" prepend-icon="mdi-arrow-left" :disabled="isSending" @click="handleEdit">Edit message</v-btn>
          <v-btn color="secondary" variant="flat" rounded="pill" prepend-icon="mdi-send-outline" :loading="isSending" :disabled="!isProfileReady" @click="handleSend">Send nudge</v-btn>
        </template>
        <template v-else>
          <span class="ui-composer__footer-note"><v-icon icon="mdi-check-circle-outline" size="16" /> Review before sending</span>
          <v-btn :form="formId" type="submit" color="secondary" variant="flat" rounded="pill" append-icon="mdi-arrow-right" :disabled="!isProfileReady">Review &amp; send</v-btn>
        </template>
      </div>
    </template>
  </Sheet>
</template>
