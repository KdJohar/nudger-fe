# Plug & Nudge app context

Read [shared project context](project-context.md) and
[Nudger repository context](repository-context.md) for current ownership:
this is the sole merchant/landing website deployed to `plugandnudge.com`.

Current product decisions, 7 October 2026. Read this with [design language](design-language.md),
[Vue architecture](vue-architecture.md), and [API client conventions](api-client.md).
Update the owning document when an approved behavior changes; do not copy competing
rules into individual pages.
For component choices and cross-application consistency, use the
[shared Vuetify component context](vuetify-component-context.md).

## Product and repository

Plug & Nudge is intentional, opt-in notification delivery. This repository,
`/Users/kd/projects/nudger-fe`, is the current Vue 3 + TypeScript + Vuetify 3 frontend.
It contains the public receiver-facing landing page and authenticated **Nudger**
workspace. It is not the Nudgee receiving app. The former `vuetify-ui` prototype
was migrated here; do not implement changes there or in `material-ui`.
There is no Tailwind or separate official Material Web component layer.

## Accounts and access

- Creator: a creator/influencer who broadcasts to subscribed audiences.
- Platform: an organisation, SaaS product, or app; supports broadcasts and
  transactional notifications to one subscribed recipient.
- Signed out: Google sign-in. Signed in without a submitted profile: onboarding.
- Submitted but pending: review screen. Approved/active: authenticated workspace.
- Platform-only API access is guarded in routing and navigation; hiding a menu
  item is not a replacement for backend authorization.

## Journeys

- `/`: lightweight receiver-facing landing page. App Store and Google Play remain
  **coming soon**, not invented store URLs. Its mobile action dock adapts to session
  and onboarding state; pending profiles reach the review screen.
- `/login`, `/auth/callback`: Google sign-in handoff; use the existing auth flow.
- `/onboarding`, `/pending`: shared profile setup/image handling and functional logout.
- `/audience`: audience trend, reach and subscriber metrics; 7/30/90-day filtering.
- `/nudges`: single-column history cards, default Broadcast; platforms additionally
  get Transactional filtering. Preserve loaded cards and scroll during refresh.
- `/compose`: broadcast editor, live client-time lock-screen preview, confirmation,
  and queued result. The Nudges FAB opens this route on desktop and a sheet on mobile.
- `/profile`: read-only display name/handle/type; editable About, website/social links,
  image, and local appearance preferences. Mobile logout follows Settings.
- `/token`: platform-only masked token, shared reveal/copy state, rotation confirmation,
  API documentation and playground. Examples follow the current token for cURL,
  Node.js, Python, Go and Java. Never expose a masked token in hidden DOM attributes.
- `/dashboard` is a redirect to `/audience`; do not restore the removed Overview page.

Broadcast previews use the merchant image/name and typed message. A queued response
means accepted for processing, not delivered. A transactional recipient supplies
their own six-digit Nudge ID and must be subscribed to the platform. Keep API
validation and permission decisions consistent with the existing backend contract.

## Runtime and boundaries

API base URLs come from the selected environment file, never a hardcoded localhost
fallback. Endpoint paths may live in typed frontend adapters. Authentication, error
parsing, timeouts and pagination normalization use the shared client described in
[API client conventions](api-client.md). Do not automatically retry sends.

Local Docker serves the SPA on `0.0.0.0:5174`; `README.md` documents env selection and
the optional same-origin proxy. Never commit local env values, session credentials,
merchant tokens or request payloads. No backend, database, worker or deployment
changes are implied by frontend design work. Browser tests use fixtures, never real
sends, token rotations, profile edits or image uploads.

Public privacy copy is product messaging, not evidence of server-side guarantees.
Do not invent analytics, delivery promises, app availability, or compliance claims.
