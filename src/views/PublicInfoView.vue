<script setup lang="ts">
import { computed } from 'vue'

type LegalTopic = 'privacy' | 'terms' | 'security' | 'delete-account' | 'support'

const props = defineProps<{ topic: LegalTopic }>()

type LegalSection = {
  heading: string
  paragraphs?: readonly string[]
  bullets?: readonly string[]
  links?: readonly { label: string; to: string }[]
}

type LegalPage = {
  eyebrow: string
  title: string
  description: string
  icon: string
  promise: string
  effectiveDate?: string
  contactUrl?: string
  contactLabel?: string
  promiseTitle?: string
  sections: readonly LegalSection[]
}

const pageCopy: Record<LegalTopic, LegalPage> = {
  support: {
    eyebrow: 'A little help, when you need it',
    title: 'Nudge support.',
    description: 'Get help with Nudge on iPhone and Android, including sign-in, subscriptions, personal hooks, and notifications.',
    icon: 'mdi-lifebuoy',
    promiseTitle: 'Contact support',
    promise: 'Email kd@plugandnudge.com. Tell us what happened and which device and app version you are using so we can help.',
    effectiveDate: 'October 19, 2026',
    contactUrl: 'mailto:kd@plugandnudge.com?subject=Nudge%20support',
    contactLabel: 'Email support',
    sections: [
      { heading: 'Signing in', paragraphs: ['On iPhone, use Sign in with Apple or Google. On Android, use Sign in with Google. Use the same sign-in provider and account you used before to return to your subscriptions and inbox. Apple and Google sign-ins can create separate Nudge accounts.'] },
      { heading: 'Notifications and subscriptions', bullets: ['If an update appears in your inbox but no alert appears, check Nudge notification permissions in your device Settings, along with silent mode, Focus or Do Not Disturb.', 'Review the subscription’s mute and notification preferences in Nudge. Push delivery also requires an internet connection.', 'If the issue continues, email support with the approximate time of the problem. Do not send private notification content unless it is necessary and you are comfortable sharing it.'] },
      { heading: 'Report a problem', paragraphs: ['Email us about unexpected behavior, content concerns, or an issue with your personal hooks. Include the steps that led to the problem and any error message. Screenshots are optional; remove personal or confidential information first.'], bullets: ['Never send passwords, sign-in codes, session tokens, API credentials, or private hook URLs.', 'Sending a support email does not automatically change your account, subscriptions, or notification preferences.'] },
      { heading: 'Privacy and account deletion', paragraphs: ['Read how Nudge handles your information, or follow the account-deletion instructions to make a request.'], links: [{ label: 'Read the Privacy Policy', to: '/privacy' }, { label: 'Request account deletion', to: '/delete-account' }] },
    ],
  },
  'delete-account': {
    eyebrow: 'Your account, your choice',
    title: 'Request Nudge account deletion.',
    description: 'You can request deletion of your Nudge account and associated personal data without installing the app or signing in to this website.',
    icon: 'mdi-account-remove-outline',
    promise: 'Email kd@plugandnudge.com from your account email address. Requests are reviewed manually; sending an email does not immediately delete data.',
    effectiveDate: 'October 15, 2026',
    contactUrl: 'mailto:kd@plugandnudge.com?subject=Nudge%20account%20deletion%20request',
    sections: [
      { heading: 'How to request deletion', bullets: ['Email kd@plugandnudge.com with the subject “Nudge account deletion request”.', 'Tell us the email address and sign-in provider associated with your Nudge account. If you cannot email from that address, let us know so we can verify ownership.', 'Do not send passwords, sign-in codes, API tokens, or personal hook URLs. We will reply to confirm the request and explain any verification needed.'] },
      { heading: 'What the in-app option does', paragraphs: ['In Nudge, open You → Delete your profile and confirm. This permanently removes your personal hooks, push installations, sessions, and related receiver data, stops push notifications to those installations, and signs you out on all devices. Subscriptions are deactivated, and inbox receipts are deleted from your inbox.', 'Your subscription details and inbox activity are never shared with merchants. Merchants can see only aggregate numbers, such as subscription totals and CTR. They cannot see who subscribed, unsubscribed, or clicked, and they cannot identify individual subscribers. Merchant profiles are retained. Historical delivery and click analytics may be retained for reporting until they are automatically removed under the retention policy.'] },
      { heading: 'Manual requests and retained records', paragraphs: ['We review requests manually and verify ownership before deleting or de-identifying remaining account-associated personal data. We will confirm completion or explain the specific records that must be retained and why.', 'Retained identity and history do not currently have an automatic deletion deadline; they remain until a manual request is completed. The app’s seven-day inbox visibility window is not a promise that these records are erased after seven days. No automatic identity-cleanup job is currently in operation.'] },
      { heading: 'If you also have a merchant workspace', paragraphs: ['Nudge and the Nudger merchant workspace can share a Google sign-in identity. The in-app profile deletion does not delete merchant profiles, sent nudges, or merchant records. In your email, tell us whether you also want to close your merchant workspace. We will clarify the scope and any necessary business-record retention before processing the shared identity.'] },
      { heading: 'What happens next', paragraphs: ['If you want only specific personal data deleted without closing the account, describe that data in your email. Account deletion cannot be undone once completed. You can create a fresh account later, but deleted subscriptions, hooks, and inbox data cannot be restored. Google or Apple accounts are separate services; deleting Nudge data does not delete your account with your sign-in provider.'] },
    ],
  },
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
      { heading: 'What we never share', paragraphs: ['A channel creator sees aggregate numbers needed to operate their channel, not the identities behind those numbers. Merchants may see totals such as subscriptions, unsubscribes, delivery outcomes, clicks, and CTR, but they cannot see which users subscribed, unsubscribed, or clicked, or identify individual subscribers. We never share your name, email address, phone number, Google identity, or other PII with merchants, other subscribers, or advertisers.'], bullets: ['We do not sell PII.', 'We do not provide PII to advertisers or data brokers.', 'We do not expose subscriber contact details through audience totals, delivery analytics, or CTR.'] },
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
      <div class="site-legal__meta"><span>Effective {{ copy.effectiveDate || 'October 9, 2026' }}</span></div>
      <div class="site-legal__promise" role="note">
        <div><strong>{{ copy.promiseTitle || 'Our standing promise' }}</strong><p>{{ copy.promise }}</p></div>
      </div>
      <article class="site-legal__content">
        <section v-for="section in copy.sections" :key="section.heading" class="site-legal__section">
          <h2>{{ section.heading }}</h2>
          <p v-for="paragraph in section.paragraphs || []" :key="paragraph">{{ paragraph }}</p>
          <ul v-if="section.bullets?.length">
            <li v-for="bullet in section.bullets" :key="bullet">{{ bullet }}</li>
          </ul>
          <ul v-if="section.links?.length">
            <li v-for="link in section.links" :key="link.to"><a class="site-button site-button--text" :href="link.to">{{ link.label }}</a></li>
          </ul>
        </section>
      </article>
      <div class="site-legal__actions">
        <a v-if="copy.contactUrl" class="site-button site-button--primary" :href="copy.contactUrl">{{ copy.contactLabel || 'Email a deletion request' }} </a>
        <a class="site-button site-button--primary" href="/">Back to home </a>
        <a class="site-button site-button--text" href="/merchant">For creators &amp; platforms </a>
      </div>
    </div>
  </section>
</template>
