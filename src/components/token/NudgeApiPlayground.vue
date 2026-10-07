<script setup lang="ts">
import { ref, toRef, useId, watch } from 'vue'
import ChoiceCards from '../ui/ChoiceCards.vue'
import CodeBlock from '../ui/CodeBlock.vue'
import SnackbarFeedback from '../ui/SnackbarFeedback.vue'
import { useNudgeApiPlayground } from '../../composables/useNudgeApiPlayground'
import { NUDGE_EXAMPLE_LANGUAGES } from '../../lib/nudgeApi'
import type { ChoiceCardItem } from '../../types/choiceCards'
import type { ApiNudgeType } from '../../types/nudgeApi'

const props = defineProps<{ token: string | null; isCredentialBusy: boolean; isRevealed: boolean }>()
const emit = defineEmits<{ busy: [value: boolean]; reveal: [] }>()
const { draft, language, errors, isSending, isConfirmationOpen, confirmedPayload, result, requestError, statusMessage, characterCount, requestExample, requestCopyExample, responseExample, resultText, handleReview, handleSend, endpoint, messageLimit } = useNudgeApiPlayground(toRef(props, 'token'), toRef(props, 'isCredentialBusy'), toRef(props, 'isRevealed'))
const messageInput = ref<{ focus: () => void } | null>(null)
const recipientInput = ref<{ focus: () => void } | null>(null)
const sendButton = ref<{ $el: HTMLElement } | null>(null)
const fieldId = useId()
const nudgeTypes: ChoiceCardItem<ApiNudgeType>[] = [
  { value: 'broadcast', title: 'Broadcast', icon: 'mdi-bullhorn-outline', description: 'An update for your audience.', detail: 'All eligible subscribers' },
  { value: 'transactional', title: 'Transactional', icon: 'mdi-account-arrow-right-outline', description: 'An update for one person.', detail: 'Requires their Nudge ID' },
]
watch(isSending, value => emit('busy', value), { flush: 'sync' })
function handleSubmit(): void {
  if (!handleReview()) {
    if (errors.value.message) messageInput.value?.focus()
    else if (errors.value.recipientId) recipientInput.value?.focus()
  }
}
</script>

<template>
  <section class="ui-panel ui-guide" aria-labelledby="playground-heading">
    <SnackbarFeedback :message="requestError" action-text="View history" action-to="/nudges" />
    <SnackbarFeedback :message="!isSending && result ? statusMessage : ''" :tone="result?.status === 202 ? 'success' : 'error'" />
    <div class="ui-guide__heading">
      <div><h2 id="playground-heading" class="ui-panel__title">Try a nudge</h2><p class="ui-guide__description">Build a request. See the code. Send when you’re ready.</p></div>
      <span class="ui-guide__eyebrow"><v-icon icon="mdi-code-braces" size="18" aria-hidden="true" /> API playground</span>
    </div>
    <div class="ui-endpoint"><span class="ui-endpoint__method">POST</span><code class="ui-endpoint__path">/v1/app-nudger/nudge/send</code></div>
    <div class="ui-split-layout">
      <form class="ui-request-form" novalidate :aria-busy="isSending" @submit.prevent="handleSubmit">
        <ChoiceCards v-model="draft.nudgeType" class="ui-choice-cards--compact" :items="nudgeTypes" label="Nudge type" :is-disabled="isSending" />
        <div>
          <v-textarea
            :id="`${fieldId}-message`"
            ref="messageInput"
            v-model="draft.message"
            label="Message"
            name="message"
            autocomplete="off"
            placeholder="What would you like your audience to know?"
            variant="outlined"
            color="secondary"
            rounded="lg"
            rows="4"
            :disabled="isSending"
            :error-messages="errors.message"
            :aria-invalid="Boolean(errors.message)"
            :aria-describedby="`${fieldId}-message-messages message-length-hint`"
          />
          <p id="message-length-hint" class="ui-request-form__counter" :class="{ 'is-invalid': characterCount > messageLimit }"><span>Short messages work best on a lock screen.</span><span>{{ characterCount.toLocaleString() }} / 4,096</span></p>
        </div>
        <v-text-field
          v-if="draft.nudgeType === 'transactional'"
          ref="recipientInput"
          v-model="draft.recipientId"
          label="Recipient Nudge ID"
          name="nudge_user_id"
          autocomplete="off"
          inputmode="numeric"
          placeholder="482193"
          :disabled="isSending"
          :error-messages="errors.recipientId"
          :aria-invalid="Boolean(errors.recipientId)"
          hint="Ask the recipient to share their own six-digit Nudge ID with you. They must also be subscribed to your platform."
          persistent-hint
          color="secondary"
        />
        <div class="ui-request-form__footer">
          <p class="ui-guide__hint"><v-icon icon="mdi-information-outline" size="18" aria-hidden="true" /><span>This calls your connected API and can deliver a notification.</span></p>
          <v-btn ref="sendButton" type="submit" color="secondary" rounded="pill" size="large" prepend-icon="mdi-send-outline" aria-haspopup="dialog" :loading="isSending" :disabled="isCredentialBusy">Send test nudge</v-btn>
        </div>
        <p v-if="!token" class="ui-guide__description">Create or load your API token above to copy an example or send a nudge.</p>
      </form>
      <div class="ui-guide__examples">
        <CodeBlock :code="requestExample" :copy-code="requestCopyExample" :is-copy-disabled="!token || isCredentialBusy" label="Request example">
          <template #controls>
            <v-btn
              :aria-label="isRevealed ? 'Hide token in request example' : 'Reveal token in request example'"
              :aria-pressed="isRevealed"
              :icon="isRevealed ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              :disabled="!token || isCredentialBusy"
              variant="text"
              @click="emit('reveal')"
            />
          </template>
          <template #actions>
            <div class="ui-code-switch" role="group" aria-label="Example language">
              <button v-for="option in NUDGE_EXAMPLE_LANGUAGES" :key="option.value" type="button" :aria-pressed="language === option.value" @click="language = option.value">{{ option.label }}</button>
            </div>
          </template>
        </CodeBlock>
        <p v-if="token" class="ui-guide__description">Both eye buttons reveal or hide the same token. Copying an example includes your current token, even while masked. Run the code on your server.</p>
        <p v-if="token && (!draft.message || (draft.nudgeType === 'transactional' && !/^[1-9]\d{5}$/.test(draft.recipientId.trim())))" class="ui-guide__description">The example uses a sample message or recipient where a field is empty or invalid. Replace these before running it.</p>
        <details class="ui-disclosure">
          <summary>Expected response <span>202 Accepted</span></summary>
          <CodeBlock :code="responseExample" label="Example response" :can-copy="false" />
          <p class="ui-guide__description">Queued means accepted for processing. It does not confirm delivery.</p>
        </details>
      </div>
    </div>
    <div class="ui-response" :class="{ 'is-visible': result || statusMessage }">
      <p class="ui-visually-hidden" role="status">{{ isSending ? 'Sending your request…' : '' }}</p>
      <template v-if="result">
        <div class="ui-guide__heading"><h3 class="ui-guide__subtitle">Last response</h3><span class="ui-status-tag" :class="{ 'is-error': result.status !== 202 }">HTTP {{ result.status }}</span></div>
        <CodeBlock :code="resultText" label="API response" />
        <v-btn to="/nudges" variant="text" append-icon="mdi-arrow-right">View nudge history</v-btn>
      </template>
    </div>
    <v-dialog v-model="isConfirmationOpen" max-width="480" :persistent="isSending" aria-labelledby="send-confirmation-heading" @after-leave="sendButton?.$el.focus({ preventScroll: true })">
      <v-card class="ui-confirmation">
        <h2 id="send-confirmation-heading" class="ui-panel__title">{{ confirmedPayload?.nudge_type === 'broadcast' ? 'Send to your audience?' : 'Send to this subscriber?' }}</h2>
        <p class="ui-guide__description">{{ confirmedPayload?.nudge_type === 'transactional' ? `Recipient Nudge ID: ${confirmedPayload.nudge_user_id}` : 'This broadcast will be queued for all eligible subscribers.' }} This is a live API request.</p>
        <blockquote class="ui-confirmation__message">{{ confirmedPayload?.message }}</blockquote>
        <p class="ui-guide__hint">{{ endpoint }}</p>
        <div class="ui-confirmation__actions"><v-btn variant="text" :disabled="isSending" @click="isConfirmationOpen = false">Cancel</v-btn><v-btn color="secondary" :loading="isSending" @click="handleSend">Confirm &amp; send</v-btn></div>
      </v-card>
    </v-dialog>
  </section>
</template>
