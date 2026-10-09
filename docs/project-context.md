# Plug & Nudge — shared project context

Updated 2026-10-09. This contract is mirrored in all five project directories.
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
| `nudge-android` | `/Users/kd/projects/nudge-android` | Planned installed Android receiver | Documentation only as of this update; app, OAuth client and release setup are not implemented. |
| `plugnudge-be` | `/Users/kd/projects/plugnudge-be` | Shared FastAPI backend, workers, migrations and notification contracts | Deploy `nudge-api`, `nudge-worker` and `nudge-migrate` from here only. |
| `nudger-fe` | `/Users/kd/projects/nudger-fe` | Merchant/creator workspace and public landing/legal pages | The only website source for `https://plugandnudge.com`. |

“Nudge BE” means `plugnudge-be`. “Nudger FE” means `nudger-fe`, not
`nudgee-fe`. The Nudgee local directory's GitHub remote is
`KdJohar/nudge-app`; the different remote name does not change its role.
The iOS checkout currently has no Git remote. Do not claim its commits were pushed,
merged into remote main, or released to the App Store.

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
4. Implement the Android equivalent in `nudge-android` when Android work begins.
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

## Cloud snapshot: verified 2026-10-09

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

The user confirmed working iPhone notifications and accepted sender styling.
Fresh builds still need real-device regression tests: registration after installation,
foreground, background/locked delivery and tap-to-inbox. Backend acceptance or
an inbox receipt alone does not prove visible push. Never log full FIDs, session
tokens, notification bodies or private webhook URLs for this verification.

## Builds, migrations, telemetry and safety

Backend: `make publish-image` tests → builds → pushes `nudge-be:latest`.
`make deploy-production` additionally uploads runtime secrets, runs the single-task
`nudge-migrate` job, then rolls out API/worker and reconciles Pub/Sub.
Migrations run once per deployment job, never once per API instance. Native schema
revision in source is `20261009_0029`.

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
automatically require a new native build. Android has no release pipeline yet.

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
