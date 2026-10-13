# Plug & Nudge — shared project context

Updated 2026-10-13. This contract is mirrored in all five project directories.
Read it before choosing a repository, build source, production target or API URL.
Read [repository context](repository-context.md) next for this directory's responsibilities.

## Authority and repository ownership

The user's latest approved decisions take precedence over older chats and notes.
Source code describes implemented behavior; read-only cloud checks describe deployed
state. A historical successful build is not proof of today's installed app or
configuration. Report discrepancies rather than silently changing scope.

| Repository | Local directory | Responsibility | Production rule |
| --- | --- | --- | --- |
| `nudgee-fe` | `/Users/kd/projects/nudgee-fe` | Receiver reference/design prototype and currently shared Vue screens | Never deploy as a production website or to `plugandnudge.com`. |
| `nudge-ios` | `/Users/kd/projects/nudge-ios` | Installed iOS receiver; Capacitor host plus native integrations | Build/sign/install independently; calls the public production API. |
| `nudge-android` | `/Users/kd/projects/nudge-android` | Installed Android receiver; Capacitor host with Material 3 native integrations | Debug OAuth/Firebase configured; build/install independently. Play release and real-device acceptance are separate. |
| `plugnudge-be` | `/Users/kd/projects/plugnudge-be` | Shared FastAPI backend, workers, migrations and notification contracts | Deploy `nudge-api`, `nudge-worker` and `nudge-migrate` from here only. |
| `nudger-fe` | `/Users/kd/projects/nudger-fe` | Merchant/creator workspace and public landing/legal pages | The only website source for `https://plugandnudge.com`. |

“Nudge BE” means `plugnudge-be`. “Nudger FE” means `nudger-fe`, not
`nudgee-fe`. The Nudgee local directory's GitHub remote is
`KdJohar/nudge-app`; the different remote name does not change its role.
The iOS remote is `git@github.com:KdJohar/nudge-ios.git`; Android's remote is
`git@github.com:KdJohar/nudge-android.git`. All five repositories use canonical
`main` through the approved PR workflow. Check local/remote heads rather than
trusting historical hashes. A Git push is not an App Store or Play release; Play distribution remains
separate and is not implied by the repository state.

The iOS app is currently a **Capacitor application**, not a completed pure SwiftUI
rewrite: its build consumes the sibling Nudgee Vue source and packages local assets
with native OAuth, secure storage, notifications and navigation. Reference-only
means **no standalone production web deployment**; it does not mean that this
existing shared-screen build dependency has been removed. Replacing it with fully
native screens would require a separately approved migration.

## Future feature workflow

1. Agree behavior and validate mobile screens in `nudgee-fe`.
2. Update the receiver's design/behavior acceptance rules.
3. Implement/package the iOS integration in `nudge-ios`.
4. Implement/package Android integration independently in `nudge-android`.
5. Change shared API, sessions, registrations or payloads in `plugnudge-be` only.
6. Change merchant workflows/landing pages in `nudger-fe` only.
7. Test and release each production target independently.

Keep approved desktop and mobile designs; density/native-interaction improvements
are not permission to redesign the product. Share behavior/contracts, not accidental
platform-specific UI or duplicated route/business logic.

## Production request paths

| Caller | Approved path |
| --- | --- |
| Merchant browser | `https://plugandnudge.com/v1/*` → frontend Nginx → backend Cloud Run through VPC |
| Installed mobile app | `https://api.plugandnudge.com/v1/*` → shared backend |
| Backend API | Pub/Sub → authenticated internal `nudge-worker` |
| API/worker/migration | Private VPC → PostgreSQL and Redis VMs |

Production browser `VITE_API_BASE_URL=/` is intentional. The frontend runtime
`API_PROXY_UPSTREAM` is the backend's HTTPS Cloud Run origin, currently
`https://nudge-api-uvoscw2dga-el.a.run.app`. Preserve `/v1/*` when proxying;
do not invent a `/v1` → `/api` rewrite or call the worker from the browser.

Frontend Direct VPC egress uses `all-traffic`; Private Google Access is enabled
on the `default` subnet. API/worker/migration dependency egress uses
`private-ranges-only`. Cloud Run origins are service names, not stable per-service
private IPs. This approved service-to-service path stays on Google's network and
avoids the public API load-balancer hop. A literal private-IP Cloud Run endpoint
would require additional infrastructure; it has not been set up.
See [Google's private networking contract](https://docs.cloud.google.com/run/docs/securing/private-networking).

The API and frontend keep `internal-and-cloud-load-balancing` ingress. The worker
keeps `internal` ingress plus authenticated Pub/Sub invocation. A worker
`run.app` URL existing does not mean public access is enabled. Do not restore
`ingress=all` to fix a proxy 404. Mobile still needs the public API domain.

## Current implementation and deployment

Rich notifications are implemented in the backend, merchant workspace, shared
receiver screens and both Capacitor hosts. iOS also includes the accepted
bottom-pill placement fix and System appearance default/following behavior.
Android Rich work was committed as `7b9cf9e`; existing Material 3 screens,
navigation, insets and styles remain unchanged. Installation is separate from
merging source; Android Rich phone acceptance remains outstanding.

Read-only Google Cloud observations on 13 October 2026:

| Resource | Observed state |
| --- | --- |
| API | `nudge-api-00039-7m2`, Ready, 100% traffic, internal-and-cloud-load-balancing, service min 1 / max 5 |
| Worker | `nudge-worker-00038-kxn`, Ready, 100% traffic, internal, service max 5; min 0 remains the deployment contract |
| Merchant website | `nudger-fe-00009-lcs`, Ready, 100% traffic, internal-and-cloud-load-balancing, service min 1 / max 5 |
| Last migration execution | `nudge-migrate-6k8fc`, succeeded on 12 October at 15:46 UTC; Alembic logs show 0030 through 0037 |
| Nightly engagement | `nudge-nightly-engagement`, ENABLED, `0 0 * * *`, Asia/Kolkata, publishes to nudge-engagement-dispatch |

Ready is Cloud Run readiness, not a fresh end-to-end login/delivery/capacity test.
Topic-scoped runtime publisher access for clicks and engagement was repaired after
authenticated clicks returned 503. Backend setup now repairs grants on all eight
topics and stops before secrets/migration/rollout on a denied grant. Pub/Sub push
OIDC/invocation and private ingress remain separate requirements. See the backend
`docs/PUBSUB_PRODUCTION.md`; IAM-only repair needs no mobile reinstall.

Selected ignored API/worker production inputs use `nudge-production`, public
`https://assets.plugandnudge.com`, private `nudge-production-notification-staging`
and `NOTIFICATION_DAY_LIMIT=7`. Input values are not a new verification of bucket
CORS/lifecycle. Public thumbnails use
`merchant-profiles/{merchant_profile_uuid}/thumbnails/{filename}.webp`.
Media cleanup derives retention plus one day (8 by default), protects queued/live
uses and has a bounded backend command. No separate media-cleanup Cloud Scheduler
job appeared in this inventory; nightly CTR is not public-media cleanup.

## Historical cloud baseline verified 2026-10-09

These are dated observations, not permanent identifiers or a fresh deployment.

| Resource | Observed state |
| --- | --- |
| GCP project / region | `plugnudge-509408` / `asia-south1`; project number `625404814148` |
| Backend API | `nudge-api-00019-dfk`; service min 1 / max 5 |
| Backend worker | `nudge-worker-00018-l2s`; service max 5, deployment contract min 0 |
| Web frontend | `nudger-fe-00006-gns`; 100% traffic, service min 1 / max 5 |
| Active Cloud Run service inventory | `nudge-api`, `nudge-worker`, `nudger-fe`; no Nudgee service |
| VPC / regional subnet | `default` / `default`, `10.160.0.0/20`, Private Google Access enabled |
| PostgreSQL VM | `nudge-postgres-instance`, `asia-south1-c`, `e2-micro`, `10.160.0.4`, no external access configuration |
| Redis VM | `nudge-redis-instance`, `asia-south1-c`, `e2-micro`, `10.160.0.5`, no external access configuration |
| URL map / HTTPS proxy | `nudge-api-url-map` / `nudge-api-https-proxy` |
| Attached TLS certificates | `nudge-api-managed-cert`, `nudger-fe-managed-cert`; both ACTIVE |
| Backend Artifact Registry | `asia-south1-docker.pkg.dev/plugnudge-509408/nudge-be-app/nudge-be:latest` |
| Frontend Artifact Registry | `asia-south1-docker.pkg.dev/plugnudge-509408/nudger-fe-app/nudger-fe:latest` |

The URL map sends the apex host to the Nudger frontend; the API backend remains
the default. Cloudflare manages DNS. Reuse the existing global HTTPS load balancer;
do not provision a second one by default. Older `nudger-fe-managed-cert-v2` and
`-v3` certificates still exist and were ACTIVE at this check, but are not attached
to the verified HTTPS proxy. Do not delete resources during context maintenance.

Service-level scaling limits differ from some revision-level annotations.
Inspect both when diagnosing capacity; do not mistake a revision's 10/20 annotation
for the configured service-level maximum of 5.

API and worker currently share `nudge-runtime@plugnudge-509408.iam.gserviceaccount.com`.
Migration and Pub/Sub push have dedicated identities. The frontend currently uses
the project's default Compute service account. A dedicated frontend identity or
proxy-issued Cloud Run ID token is **not** a completed implementation.

## Identity, registration and mobile push

One canonical identity can be a receiver and own one merchant profile. Google
sign-in is the implemented identity flow; do not invent email/password registration.
Browser start/callback/handoff remains separate from native Google SDK authentication.

Native endpoints are `POST /v1/app-identity/google/native/start` and
`POST /v1/app-identity/google/native`. They use a single-use nonce bound to a random
installation UUID, verified Google claims and an allowlisted native client.
Refresh and push registration retain device/session binding. Logout detaches only
the relevant session/account registration.

Current iOS identity: bundle `nudge.com`, Apple team `N5R5Q327H7`, Firebase project
`nudge-cd06e`. The Google native client is documented in the backend native guide.
APNs credentials were uploaded for development and production, supported by the
user's Firebase screenshot; private key contents never belong in these documents.

**Mobile push only.** Browser/web push was initial testing and has been removed
from the current receiver integration. Browser `registerPush` is unsupported.
The checked-in native SDK uses Firebase registration/FID APIs, and backend
`MulticastMessage(fids=...)` targets these registered FIDs. Do not “fix” this by
assuming historical FID/token advice still describes the installed SDK. APNs
device tokens, random installation UUIDs and registered Firebase FIDs are different.

Notification contract: stable sender type/UUID/name/conversation identity, optional
HTTPS merchant avatar, APNs default sound and mutable-content. iOS uses
`INSendMessageIntent` communication presentation: large sender avatar/symbol with
small Nudge app badge, **not** a duplicated rich-media thumbnail. The checked-in
hook API has no uploaded avatar URL field; hooks use the bundled webhook symbol.
A prior Cloudinary upload request is not evidence that such an API/storage change
was implemented. The user subsequently accepted the working presentation without
extra avatar work. Preserve that accepted result.

Foreground ownership is a release gate: `ios.handleApplicationNotifications=false`,
validate generated and signed bundle configuration, restore `PushCoordinator`
after bridge loading/activation/registration, and return banner/sound/badge options.
Never add a competing notification plugin without reviewing ownership regression
tests. Focus, silent mode, permission and iOS layout remain system-controlled;
haptic delivery is not guaranteed by setting sound.

Android package is also `nudge.com`, Firebase project `nudge-cd06e`. The Android
host reuses accepted shared screens, with Material 3 native bottom navigation,
Credential Manager sign-in, Keystore storage and SDK 26 registered Firebase FIDs.
Google/Firebase have this Mac's debug signing fingerprints. Play App Signing needs
its own certificate/OAuth client and backend allowlist before a store release.
Android's single FirebaseMessagingService receives high-priority data messages
with title/body and existing sender identity. APNs keeps explicit alert title/body,
sound and mutable-content. No global FCM notification field may bypass Android's
custom background presentation. Android MessagingStyle/Person displays the sender
avatar and a small Nudge badge; final layout/permissions/DND are platform-controlled.
See the Android repository's docs/android-runtime.md and backend
docs/native-android-auth-push.md. No browser push or competing Capacitor notification
plugin is allowed. Synthetic emulator tests are not real-device/cloud push proof.

The user confirmed working iPhone notifications and accepted sender styling.
Fresh builds still need real-device regression tests: registration after installation,
foreground, background/locked delivery and tap-to-inbox. Backend acceptance or
an inbox receipt alone does not prove visible push. Never log full FIDs, session
tokens, notification bodies or private webhook URLs for this verification.

## Inbox, Rich content, push and engagement

- Nudge format is non-null Basic/Rich; legacy nudges were migrated to Basic.
  Basic stores null media/destination/CTA and rejects those request keys even if
  null. Rich requires public HTTPS destination and `watch_now`/`learn_more`;
  owned finalized R2 `media_url` is optional. Title/avatar are merchant identity,
  not an editable notification title. Hooks remain Basic/message-only.
- Every active addressed subscription gets a user-level `NudgeReceipt`; hooks
  get one for their owner. `received_at` is creation time, `clicked_at` starts
  null, `is_muted` snapshots mute/disabled push-type preferences. Missing native
  installations never hide inbox messages. Unsubscribed/nonexistent/foreign
  transactional targets do not become recipients.
- Actual mobile devices create `NudgeRecipient` attempts tied to the original
  immutable receipt. Bounded subscription/device/Firebase groups and parallel
  Pub/Sub stages remain. Replay, account changes, late results and zero/one/many
  devices must not duplicate receipts, transfer ownership or inflate counters.
- Inbox audience, silenced pushes and clicks count users; delivered/failed pushes
  and devices count device attempts. Provider acceptance is not phone-display
  proof. History reads saved Nudge stats without live request-time aggregation.
- Explicit in-app CTA or Rich native body/action activation submits authenticated,
  bodyless `POST /v1/app-nudgee/{nudge_uuid}/click`. API owns user/time and publishes;
  worker uses one SQL statement to preserve the first click and mark engagement
  dirty. Receiving, expanding, dismissing or viewing media is not a click. The
  subscriber's six-digit Nudge ID is not the notification UUID.
- Nightly durable dispatch/calculation saves unique `total_clicks`, numeric
  one-decimal percent `ctr` and `engagement_as_of`. CTR denominator is inbox
  audience, not successful devices. Basic and uncalculated Rich stay null;
  measured zero is zero; zero audience has null CTR. Defaults: 100 nudges/batch,
  two batches/dispatch, ordered locks, fixed cutoffs and recoverable work.
- `NOTIFICATION_DAY_LIMIT` supplies inbox/live-analytics policy (7 by default).
  Cumulative snapshots survive expiry; delayed clicks remain discoverable.
  Migration 0037 removed `clicked_recorded_at`. Do not restore obsolete pending/
  success-only inbox or successful-push CTR rules from historical phase reports.
- Sender avatar and optional content media are separate images. iOS preserves
  communication styling with standard expanded attachment/actions. Android keeps
  MessagingStyle/Person with native actions; separate image/text parts retain the
  caption and sender badge. Both restore auth, reject wrong-account handoffs,
  deduplicate and open destinations independently of bounded tracking retries.
- Future Basic/Pro pricing remains an approved direction only. Capabilities
  prepare format permissions; no billing, paid-plan schema or pricing enforcement.

Redis is rebuildable; active contracts are v1. Subscription values contain merchant
UUID/preferences only, with a 24-hour TTL. Mutable merchant details live only in
DB 2 `nudger:merchant-profile:user:{merchant_owner_user_uuid}:v1`. Bulk/pipelined
hydration, version fences and invalidation keep views consistent. Receipts,
outcomes and analytics stay in PostgreSQL. Admin hard deletion validates the chosen
merchant UUID and clears dependent data/caches; execute only for an authorized
target, never as a context or rendering check.

## Builds, migrations, telemetry and safety

Backend: `make publish-image` tests → builds → pushes `nudge-be:latest`.
`make deploy-production` additionally uploads runtime secrets, runs the single-task
`nudge-migrate` job, then rolls out API/worker and reconciles Pub/Sub.
Migrations run once per deployment job, never once per API instance. Current source
head is `20261012_0037`; the last production migration execution succeeded as
recorded above. Verify the job/Alembic revision before later migration or rollback.

Frontend: run the Nudger checkout's `make publish-image` / `make deploy-production`.
Check Git root/remote, Docker build context, registry repository, image and service
before publishing. Existing deploy guards constrain service/image/domain names;
they are not proof of the actual source repository if the script is copied.

Use `latest` for publication but immutable digests for rollout/rollback.
Untagged-image cleanup is after 48 hours. Preserve deployed/rollback digests and
multi-architecture child manifests; cleanup is not authorization to erase all images.

Production secrets stay in ignored env files/Secret Manager; native client public
configuration is distinct from backend private keys. New Relic/Sentry are production
only; Nudger also has production GA4/SEO. Search Console was requested earlier,
but ownership/coverage is not freshly verified here. Infrastructure alerts,
notification workflows and slow-query dashboards require live checks before
claiming coverage. No metrics, alert thresholds or successful notification receivers
are invented by this context update.

Local mock/load tests, including the 500-merchant scenarios, are not production
capacity proofs. Retool uses the production API for manual merchant approval;
verify its authenticated resource/environment before trusting an empty table.
Do not conclude zero production records from a frontend empty state alone.

Do not commit secrets or synced ChatGPT `sources/` material. Check and preserve
existing changes; commit/push/PR/merge/deploy only when authorized for the current
task. App changes require rebuilding/reinstalling iOS; backend-only changes do not
automatically require a new native build. Android has local APK builds/tests;
Play release/distribution is not yet configured.

## Evidence and historical conflicts

Reviewed project chats: “Configure PostgreSQL and Redis”, “Explain Vuetify”,
“nudger app”, “Document Nidge Identity API”, “Install Redis on GCP VM”,
“Plan Vue web push notifications”, and “Install Retool CLI”. Recent relevant
turns were reconciled with current source, migrations, build scripts, Git status
and read-only GCP service/network/certificate inventory on 2026-10-09.
This is a consolidated operational context, not a verbatim archive of every turn.

Superseded information includes `loadless-507504`, `plugnudge-be-api`,
the typo `api.plugandmudge.com`, old VM IPs `10.160.0.2/.3`, expired tunnel
URLs, Tailwind/Material prototype styling, hash-only merchant-token recovery,
“mobile not implemented”, unfinished APNs setup and browser push testing.
Use current repo-specific documents; do not resurrect historical configuration.

Maintain the identical shared contract across repositories when ownership or
cross-app behavior changes. Put implementation detail in the owning repository,
and cross-link it rather than maintaining competing copies.

## Context and Git handoff

Read AGENTS.md, this shared contract and local repository context first, then the
owning feature/deployment guide. Phase reports preserve dated test evidence, not
today's release state. When a merge is authorized, raise/merge a PR to main, delete
only verified merged task branches and fast-forward local main. Audit all local/
remote branch tips and exact local/remote main equality; never force-reset work.
Context/Git synchronization does not deploy services, rotate credentials, send
notifications, install apps or publish a store release.
