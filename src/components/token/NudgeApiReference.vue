<script setup lang="ts">
const fields = [
  { name: 'message', type: 'string · required', description: '1–4,096 characters. Whitespace-only messages are rejected; leading and trailing whitespace is trimmed.' },
  { name: 'nudge_type', type: 'string · required', description: 'Use broadcast for your subscriber audience, or transactional for one subscriber.' },
  { name: 'nudge_user_id', type: 'integer · transactional only', description: 'Ask the recipient to share their own six-digit Nudge ID (100000–999999) with your platform. Use the ID they provide for transactional sends; omit this field for broadcasts. The recipient must also be subscribed to your platform.' },
]
const responses = [
  { status: '202', title: 'Accepted', description: 'Queued for processing. Follow delivery progress in Nudges.' },
  { status: '401 / 403', title: 'Access denied', description: 'Check your API token and active platform profile. Use the new key if you rotated it.' },
  { status: '422', title: 'Invalid request', description: 'Check the message, nudge type and recipient ID. Correct the fields before sending again.' },
  { status: '503', title: 'Service unavailable', description: 'Read the error response and retryable flag. Check history before retrying an uncertain request to avoid duplicate nudges.' },
]
</script>

<template>
  <section class="ui-panel ui-guide" aria-labelledby="reference-heading">
    <div class="ui-guide__heading"><div><h2 id="reference-heading" class="ui-panel__title">The essentials</h2><p class="ui-guide__description">Everything your integration needs, in one place.</p></div><v-icon icon="mdi-book-open-page-variant-outline" aria-hidden="true" /></div>
    <div class="ui-split-layout ui-split-layout--reference">
      <div>
        <h3 class="ui-guide__subtitle">Authentication</h3>
        <code class="ui-inline-code">Authorization: Bearer YOUR_API_TOKEN</code>
        <p class="ui-guide__description">Send JSON with <code>Content-Type: application/json</code>. Use your merchant API token from this page in server-side code. Your account sign-in token is a different credential.</p>
        <h3 class="ui-guide__subtitle ui-guide__subtitle--spaced">Request body</h3>
        <dl class="ui-reference-list"><div v-for="field in fields" :key="field.name"><dt><code>{{ field.name }}</code><span>{{ field.type }}</span></dt><dd>{{ field.description }}</dd></div></dl>
      </div>
      <div>
        <h3 class="ui-guide__subtitle">What happens next</h3>
        <p class="ui-guide__description">Your profile name becomes the notification title and your profile image is used as its icon. Your token identifies the sender automatically.</p>
        <p class="ui-guide__description">Subscription and device checks happen after queueing. A transactional nudge can fail if the recipient is not subscribed. Check <router-link to="/nudges">Nudges</router-link> for the final outcome.</p>
        <dl class="ui-response-list"><div v-for="response in responses" :key="response.status"><dt><code>{{ response.status }}</code><strong>{{ response.title }}</strong></dt><dd>{{ response.description }}</dd></div></dl>
      </div>
    </div>
  </section>
</template>
