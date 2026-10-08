<script setup lang="ts">
import { computed } from 'vue'

type LegalTopic = 'privacy' | 'terms' | 'security'

const props = defineProps<{ topic: LegalTopic }>()

type LegalSection = {
  heading: string
  paragraphs?: readonly string[]
  bullets?: readonly string[]
}

type LegalPage = {
  eyebrow: string
  title: string
  description: string
  icon: string
  promise: string
  sections: readonly LegalSection[]
}

const pageCopy: Record<LegalTopic, LegalPage> = {
  privacy: {
    eyebrow: 'Privacy, by default',
    title: 'Your identity stays yours.',
    description: 'Plug & Nudge helps people receive useful updates without turning a subscription into a contact list. This policy explains what we collect, why we use it, and the boundaries we keep around it.',
    icon: 'mdi-shield-check-outline',
    promise: 'PII is never shared with channel creators, other subscribers, or advertisers. We do not sell personal information.',
    sections: [
      { heading: 'What this policy covers', paragraphs: ['This Privacy Policy applies to the Plug & Nudge receiver experience, the Nudger workspace, and the plugandnudge.com website. It describes the information handled when you browse the site, create an account, subscribe to a channel, or send a nudge.'] },
      { heading: 'Information we collect', paragraphs: ['We collect only the information needed to provide, secure, and improve the service. Depending on how you use Plug & Nudge, this can include:'], bullets: ['Account information supplied by your sign-in provider, such as your name, email address, and provider identifier.', 'Workspace information supplied by creators and developers, such as channel details, message content, delivery settings, and API configuration.', 'Subscription and delivery information, such as the channels you chose, notification preferences, delivery status, and timestamps.', 'Technical information needed for security and reliability, such as browser, device, approximate location, IP address, and diagnostic logs.'] },
      { heading: 'How we use information', paragraphs: ['We use information to authenticate accounts, maintain subscriptions, deliver requested nudges, provide workspace features, protect the service from abuse, troubleshoot failures, measure reliability, and respond to support requests. We do not use your personal information to build an advertising profile.'] },
      { heading: 'What we never share', paragraphs: ['A channel creator sees the audience and delivery information needed to operate their channel, not a list of the people behind it. We never share your name, email address, phone number, Google identity, or other PII with channel creators, other subscribers, or advertisers.'], bullets: ['We do not sell PII.', 'We do not provide PII to advertisers or data brokers.', 'We do not expose subscriber contact details through audience totals or delivery analytics.'] },
      { heading: 'Service providers and required disclosures', paragraphs: ['We may use carefully selected providers for hosting, authentication, monitoring, error reporting, analytics, notification delivery, and security. They receive only the information needed to perform those services and are expected to protect it. We may also disclose information when required by law, to protect people or the service, or as part of a legitimate business transfer with appropriate safeguards.'] },
      { heading: 'Your choices', bullets: ['Leave a channel or change notification preferences at any time.', 'Request access to, correction of, or deletion of your account information through the support channel available in your account.', 'Use browser and device controls to limit optional analytics or notifications.', 'Ask questions about this policy or how your information is handled.'] },
      { heading: 'Retention and deletion', paragraphs: ['We retain information for as long as needed to provide the service, meet legal and security obligations, resolve disputes, and keep reliable records. When you request deletion, we remove or de-identify information that is no longer needed, subject to limited backups, fraud-prevention records, or other lawful retention requirements.'] },
    ],
  },
  terms: {
    eyebrow: 'A clear agreement',
    title: 'Useful updates, responsibly sent.',
    description: 'These Terms of Service describe the simple rules for using Plug & Nudge as a receiver, creator, or developer. By using the service, you agree to follow them.',
    icon: 'mdi-file-document-check-outline',
    promise: 'Plug & Nudge is built for permission-based communication. Send updates to people who chose to receive them, and respect their control.',
    sections: [
      { heading: 'Using the service', paragraphs: ['You may use Plug & Nudge only if you can form a binding agreement and only in compliance with applicable law. You are responsible for the accuracy of information you provide, keeping your credentials secure, and using the service for legitimate communication.'] },
      { heading: 'Permission-based notifications', paragraphs: ['Creators and developers must have a valid reason and appropriate permission to send a nudge. Do not use Plug & Nudge for spam, harassment, deception, unlawful content, or messages that people did not reasonably expect. Receivers can leave a channel or change preferences at any time.'] },
      { heading: 'Your content and responsibilities', paragraphs: ['You retain ownership of content you submit. You give Plug & Nudge the limited permission needed to host, process, and deliver that content as part of the service. You are responsible for having the rights, permissions, and lawful basis required for the content and recipients you use.'] },
      { heading: 'Privacy and personal information', paragraphs: ['Plug & Nudge is designed to keep receiver identity separate from channel subscriber counts. PII is never shared with channel creators, other subscribers, or advertisers, and is not sold. Our Privacy Policy explains the information we handle and the limited circumstances in which service providers or authorities may receive it.'] },
      { heading: 'Accounts, credentials, and API access', paragraphs: ['Keep account credentials, API tokens, and integration secrets confidential. You are responsible for activity performed through your workspace. Tell us promptly if you suspect unauthorized access, and revoke or rotate credentials when they are no longer needed.'] },
      { heading: 'Availability and third-party services', paragraphs: ['We work to keep Plug & Nudge reliable, but the service may occasionally be unavailable for maintenance, incidents, or changes outside our control. Integrations and third-party services may have their own terms, privacy policies, limits, or outages.'] },
      { heading: 'Suspension and termination', paragraphs: ['We may restrict or suspend access when reasonably necessary to protect the service, its users, or the public; to investigate abuse; or to comply with law. You may stop using the service at any time. Where appropriate, we will provide notice and an opportunity to address a problem.'] },
      { heading: 'Changes to these terms', paragraphs: ['We may update these terms as the service evolves. We will publish the current version here and update the effective date. Continuing to use Plug & Nudge after an update means you accept the revised terms.'] },
    ],
  },
  security: {
    eyebrow: 'Security, without the theatre',
    title: 'Private by design. Protected in practice.',
    description: 'Security is part of how Plug & Nudge is shaped: minimize the data we need, separate access by purpose, and make the important boundaries easy to understand.',
    icon: 'mdi-lock-check-outline',
    promise: 'PII is never shared with channel creators, other subscribers, or advertisers. Our receiver model exposes a count, not a contact list.',
    sections: [
      { heading: 'Data minimization', paragraphs: ['The receiver experience is designed around the smallest useful audience signal. Channel owners can work with subscriber totals and delivery outcomes without receiving the personal identity behind each subscription.'] },
      { heading: 'Access boundaries', paragraphs: ['Authentication, workspace permissions, API credentials, and operational systems are separated by role and purpose. Production services are restricted to the paths and identities they need, and sensitive credentials are kept out of source code and client-visible pages.'] },
      { heading: 'Encryption and secure transport', paragraphs: ['Public web and API traffic is served over HTTPS. Service-to-service and data-store connections use private networking or authenticated transport where configured. Credentials and tokens are handled as secrets and should be rotated if exposure is suspected.'] },
      { heading: 'Monitoring and response', paragraphs: ['We use operational monitoring, error reporting, and audit-friendly logs to detect failures, investigate suspicious activity, and improve reliability. Logs are designed to support diagnosis without turning personal information into a product.'] },
      { heading: 'Third-party providers', paragraphs: ['Hosting, authentication, analytics, error reporting, and delivery partners may process limited data to provide their services. We select providers appropriate to the job, configure them for production use, and avoid sharing PII for advertising or unrelated profiling.'] },
      { heading: 'Your part in security', paragraphs: ['Use a strong account, protect your Google account and API tokens, review integrations, and report suspicious activity through the support channel available in your account. Do not place passwords, private keys, or unnecessary PII in nudge content.'] },
      { heading: 'A practical limitation', paragraphs: ['No online service can promise absolute security. We continuously review controls, respond to incidents, and improve the product as we learn. If you believe you have found a security issue, report it privately through the support channel available in your account and include enough detail for us to reproduce it safely.'] },
    ],
  },
}

const copy = computed(() => pageCopy[props.topic])
</script>

<template>
  <section class="site-section site-section--intro site-legal" aria-labelledby="info-heading">
    <div class="site-wrap site-info">
      <span class="site-eyebrow">{{ copy.eyebrow }}</span>
      <h1 id="info-heading" class="site-heading">{{ copy.title }}</h1>
      <p class="site-intro">{{ copy.description }}</p>
      <div class="site-legal__meta"><v-icon :icon="copy.icon" size="18" /><span>Effective October 9, 2026</span></div>
      <div class="site-legal__promise" role="note">
        <div class="site-legal__promise-icon"><v-icon :icon="copy.icon" size="25" /></div>
        <div><strong>Our standing promise</strong><p>{{ copy.promise }}</p></div>
      </div>
      <article class="site-legal__content">
        <section v-for="section in copy.sections" :key="section.heading" class="site-legal__section">
          <h2>{{ section.heading }}</h2>
          <p v-for="paragraph in section.paragraphs || []" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.bullets?.length">
            <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
        </section>
      </article>
      <div class="site-legal__actions">
        <RouterLink class="site-button site-button--primary" to="/">Back to home <v-icon icon="mdi-arrow-right" size="18" /></RouterLink>
        <RouterLink class="site-button site-button--text" to="/for-nudgers">For creators &amp; developers <v-icon icon="mdi-arrow-up-right" size="18" /></RouterLink>
      </div>
    </div>
  </section>
</template>
