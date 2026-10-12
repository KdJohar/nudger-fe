<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import MessageField from '../ui/MessageField.vue'
import SnackbarFeedback from '../ui/SnackbarFeedback.vue'
import NotificationPreview from '../ui/NotificationPreview.vue'
import NotificationFields from './NotificationFields.vue'
import ContentSummary from '../ui/ContentSummary.vue'
import DialogFrame from '../ui/DialogFrame.vue'
import MessageSummary from '../ui/MessageSummary.vue'
import { useAuth } from '../../composables/useAuth'
import { useBroadcastComposer } from '../../composables/useBroadcastComposer'

const { state, authenticatedRequest } = useAuth()
const profile = computed(() => state.merchantProfile)
const {
  message, fieldError, sendError, confirmedMessage, isReviewing, isSending, isQueued,
  title, isProfileReady, handleReview, handleEdit, handleSend, handleReset,
  notification, confirmedPayload, messageLimit,
} = useBroadcastComposer(profile, authenticatedRequest)
const messageField = ref<InstanceType<typeof MessageField> | null>(null)
const notificationFields = ref<InstanceType<typeof NotificationFields> | null>(null)
const reviewButton = ref<{ $el: HTMLElement } | null>(null)
const confirmationTitle = ref<HTMLElement | null>(null)
const successTitle = ref<HTMLElement | null>(null)
const dialogTitleId = useId()
const dialogDescriptionId = useId()
const hasImageError = ref(false)
watch(() => profile.value?.profile_image_url, () => { hasImageError.value = false })

async function handleSubmit(): Promise<void> {
  if (!handleReview()) {
    await nextTick()
    if (fieldError.value) messageField.value?.focus()
    else notificationFields.value?.focusError()
  }
}
async function handleWriteAnother(): Promise<void> {
  handleReset()
  await nextTick()
  messageField.value?.focus()
}
function handleDialogClosed(): void {
  if (isQueued.value) successTitle.value?.focus({ preventScroll: true })
  else reviewButton.value?.$el.focus({ preventScroll: true })
}
</script>

<template>
  <div class="ui-editor-workspace">
    <SnackbarFeedback :message="!isProfileReady ? 'Your profile needs to be active, with a name of 120 characters or fewer, before you can send.' : ''" tone="warning" action-text="Review profile" action-to="/profile" />
    <SnackbarFeedback :message="sendError" action-text="Check history" action-to="/nudges" />
    <SnackbarFeedback :message="isQueued ? 'Your nudge is queued. Check history for delivery progress.' : ''" tone="success" />

    <section v-if="isQueued" class="ui-panel ui-editor-result" aria-label="Broadcast queued">
      <span class="ui-editor-result__icon"><v-icon icon="mdi-check" size="28" aria-hidden="true" /></span>
      <h2 ref="successTitle" class="ui-panel__title" tabindex="-1">Your nudge is queued.</h2>
      <p class="ui-editor-panel__hint">Delivery runs in the background. Follow its progress in your history.</p>
      <blockquote class="ui-editor-result__message">{{ confirmedMessage }}</blockquote>
      <ContentSummary v-if="confirmedPayload" :content="confirmedPayload" />
      <div class="ui-editor-result__actions">
        <v-btn variant="text" rounded="pill" @click="handleWriteAnother">Write another</v-btn>
        <v-btn color="secondary" variant="flat" rounded="pill" to="/nudges" append-icon="mdi-arrow-right">View history</v-btn>
      </div>
    </section>

    <section v-else class="ui-panel ui-editor-panel" aria-label="Compose a broadcast">
      <div class="ui-editor-panel__identity">
        <v-avatar size="40" class="ui-editor-panel__avatar">
          <img v-if="profile?.profile_image_url && !hasImageError" :src="profile.profile_image_url" alt="" @error="hasImageError = true" />
          <v-icon v-else icon="mdi-account-circle-outline" size="32" aria-hidden="true" />
        </v-avatar>
        <div class="ui-editor-panel__sender">
          <strong>{{ title || 'Your profile' }}</strong>
          <span><v-icon icon="mdi-account-group-outline" size="16" aria-hidden="true" /> To your subscribers</span>
        </div>
        <span class="ui-editor-panel__badge"><v-icon icon="mdi-bullhorn-outline" size="16" aria-hidden="true" /> Broadcast</span>
      </div>

      <div class="ui-editor-panel__body">
        <aside class="ui-editor-panel__preview" aria-label="Live notification preview">
          <NotificationPreview :title="title" :message="message" :image-url="profile?.profile_image_url" :content="{ notification_format: notification.draft.notificationFormat, media_url: notification.draft.mediaUrl, destination_url: notification.draft.destinationUrl, cta_label: notification.draft.ctaLabel }" />
        </aside>

        <form class="ui-editor-panel__form" novalidate @submit.prevent="handleSubmit">
          <NotificationFields ref="notificationFields" :model="notification" :is-disabled="isSending || isReviewing">
            <template #message>
              <MessageField ref="messageField" v-model="message" :limit="messageLimit" :error="fieldError" :is-disabled="isSending || isReviewing" placeholder="I'm going live in 15 minutes. Come join me!" />
            </template>
          </NotificationFields>
          <div class="ui-editor-panel__delivery"><v-icon icon="mdi-bell-outline" size="20" aria-hidden="true" /><p>One update. Your whole audience.<span>Delivered according to each subscriber’s notification preferences.</span></p></div>
          <div class="ui-editor-panel__actions">
            <p class="ui-editor-panel__hint"><v-icon icon="mdi-check-circle-outline" size="16" aria-hidden="true" /> You’ll confirm before sending.</p>
            <v-btn ref="reviewButton" type="submit" color="secondary" variant="flat" rounded="pill" append-icon="mdi-arrow-right" :disabled="!isProfileReady || isSending" aria-haspopup="dialog">Review &amp; send</v-btn>
          </div>
        </form>
      </div>
    </section>
    <p class="ui-visually-hidden" role="status">{{ isSending ? 'Queuing your nudge…' : '' }}</p>

    <v-dialog v-model="isReviewing" :persistent="isSending" max-width="480" :aria-labelledby="dialogTitleId" :aria-describedby="dialogDescriptionId" @after-enter="confirmationTitle?.focus({ preventScroll: true })" @after-leave="handleDialogClosed">
      <DialogFrame body-label="Broadcast review details" :is-busy="isSending">
        <template #header>
          <h2 :id="dialogTitleId" ref="confirmationTitle" class="ui-panel__title" tabindex="-1">Send to your subscribers?</h2>
          <p :id="dialogDescriptionId" class="ui-editor-panel__hint">This queues a broadcast now. Check your message before sending.</p>
        </template>
        <NotificationPreview :title="title" :message="confirmedMessage" :image-url="profile?.profile_image_url" :content="confirmedPayload || undefined" :is-live="false" />
        <MessageSummary :message="confirmedMessage" />
        <ContentSummary v-if="confirmedPayload" :content="confirmedPayload" :is-media-visible="false" />
        <template #footer>
          <v-btn variant="text" rounded="pill" :disabled="isSending" @click="handleEdit">Keep editing</v-btn>
          <v-btn color="secondary" variant="flat" rounded="pill" prepend-icon="mdi-send-outline" :loading="isSending" :disabled="!isProfileReady || isSending" @click="handleSend">Send nudge</v-btn>
        </template>
      </DialogFrame>
    </v-dialog>
  </div>
</template>
