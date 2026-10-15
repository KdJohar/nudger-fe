# Nudger FE deployment context

Start with [shared project context](project-context.md) and
[Nudger repository context](repository-context.md) for current ownership,
dated live observations and release regression checks.

This document is the reusable deployment contract for the Plug & Nudge
frontend. The checked-in `Dockerfile`, `Makefile` and
`scripts/deploy_cloud_run_production.sh` are authoritative when this document
and an implementation disagree.

Read-only snapshot on 13 October 2026: `nudger-fe-00009-lcs` is Ready with 100%
traffic, internal-and-cloud-load-balancing ingress and service min 1 / max 5.
It includes the approved Rich composer/history changes. The merchant domain and
same-origin VPC API proxy remain owned by this checkout; Nudgee is never deployed.
This context/Git sync does not publish an image or update Cloud Run.

## Audience active-cohort release — 14 October 2026

[PR #11](https://github.com/KdJohar/nudger-fe/pull/11) merged at
`0af20f80e96396fa750deab08f9a15eb9989a878`; its feature branch was deleted and
local main synced before the test/build/publish/deploy pipeline.
Total audience's comparison was removed from the existing shared MetricCard;
only New subscribers compares the currently active selected/preceding cohorts.
No CSS, chart, navigation, Nudgee or native code changed.

| Check | Verified result |
| --- | --- |
| Frontend service | `nudger-fe-00010-rdw`, Ready and 100% traffic |
| Published latest/index digest | `sha256:503a50dbaa7cf5058b95fcd7e332468ee53950e099a2313b938df8d2370622a1` |
| Resolved linux/amd64 digest | `sha256:f627f355aac4269f0d7823234f8bc50abace92d4aff4eba4bb42904a7e73c333` |
| Build-source Git root | `/Users/kd/projects/nudger-fe`, remote `KdJohar/nudger-fe`, clean merged main |
| Local verification | 154 unit tests; existing Make/style/PWA/typecheck/build gates pass |
| Browser matrix | Chrome/WebKit, 320/375/768/1440px, light/dark: 16 source-build and 16 published-image cases pass |
| Browser assertions | Sole New comparison, active-total label, touch/keyboard filters, zero baseline, error/retry, frame persistence, Axe and no overflow |
| Public routes/runtime | `/`, `/audience`, `/nudges` HTTP 200; runtime-config no-store and same-origin API base |
| Internal API proxy | Google start HTTP 200 JSON with the correct `api.plugandnudge.com` callback; VPC all-traffic unchanged |
| Live merchant page | Total audience 3; New subscribers 3 for 7d/30d/90d; prior New cohort 0; comparison only under New |
| Certificate/ingress | Managed certificate ACTIVE; internal-and-cloud-load-balancing retained |
| Backend companion | API `nudge-api-00053-vm2`, worker `nudge-worker-00051-pbr`, healthy; migration head 0042 unchanged |

Browser fixture contexts block service workers to preserve intercepted API calls;
production PWA/service-worker behavior is unchanged. These are browser tests, not
physical-device acceptance. Production verification is read-only except the
normal authorized image/runtime rollout and ephemeral Google-start state.
No account reset, profile edit or real nudge send was used.

Existing dependency limitation: read-only `npm audit` reports two moderate entries
for `@newrelic/browser-agent` and its `fflate` dependency (one malformed ZIP64
decompression/infinite-loop advisory), including the production dependency view.
This task changed no dependency versions/lockfile and ran no forced audit fix.
Dependency remediation is separate; successful health does not clear that advisory.
Existing >500kB build-chunk warnings are also unchanged. Release-evidence-only
commits after publication do not alter the shipped application.

## Runtime shape

## Public-page prerender and SEO release — 15 October 2026

[PR #14](https://github.com/KdJohar/nudger-fe/pull/14) merged the approved SEO work
into main `ed605471022d63eebbfded4d593ffab3f363348b`. The feature branch was removed
locally/remotely before publishing from clean synced main. At that check no other
open Nudger PRs remained.

Image/index digest: `sha256:02acf3660e508626ae72b6479a0f96ffdafd5652d0d99bb7e9bd5e56b34aa479`.
Cloud Run `nudger-fe-00013-qqb` is Ready and serves 100% traffic; min 1/max 5,
1 CPU/512 MiB, internal-and-cloud-load-balancing ingress and VPC all-traffic
remain. The previous digest is retained under `rollback-before-seo-20261015`.
Only the frontend was deployed; API `nudge-api-00055-smz` and worker
`nudge-worker-00053-m9j` remained unchanged and Ready.

All 165 frontend source tests and the publish/build/prerender gates passed. Live
HTTP checks passed for full public HTML, private noindex shells, real 404s,
sitemap/robots, config/SW caching and the internal same-origin OAuth proxy.
Production browser reflow/menu checks passed at 320/375/768/1440px. Analytics
Realtime collection was verified; Search Console processed six sitemap URLs and
its live homepage/privacy fetches passed. Individual manual recrawl was blocked
by Google's reCAPTCHA connection failure, not a failed site fetch.

HTTP apex and www canonical redirects are not repaired by the application image.
The prepared www-only Cloudflare rule awaits exact-action approval after browser
safety review. Do not proxy the DNS-only apex or add a port-80 forwarding rule as
an unreviewed workaround. See [full SEO release evidence](public-pages-seo.md#production-verification--15-october-2026).

## Public deletion request resource — 15 October 2026

The owner approved publishing `/delete-account` with accurate current retention
disclosures and manual follow-up through `kd@plugandnudge.com`. Source commit
`1f5f048` is on `feature/play-account-deletion-page`, reviewed through open
[PR #13](https://github.com/KdJohar/nudger-fe/pull/13); not merged by this task.
The page reuses the existing legal layout, adds public routing/footer/sitemap/SEO
and one regression check. No account deletion backend/job or mobile app changed.

Published image/index: `sha256:20dba71cb70c164a07836e1959dc41c87578840fa8beac53eb0aebfbf5a14680`.
`nudger-fe-00011-k4f` is Ready with 100% traffic, min 1/max 5 and unchanged
internal-and-cloud-load-balancing ingress. The existing VPC API proxy remains.
The public page returns 200 and its rendered deletion/retention copy and email
link were verified in Chrome. The normal Make tests and production build passed;
PWA checks are 7/7, including the new disclosure guard. Browser checks at
320/375/768/1440px showed one h1 and no horizontal overflow; 375px dark mode also
passed. No real deletion email or account reset was sent for verification.
This page is a request resource, not a guarantee of Google Play approval.

## Repository ownership

| Repository | Role | Deployment rule |
| --- | --- | --- |
| `plugnudge-be` | Backend API and worker | Deploy backend services only; production API is `api.plugandnudge.com`. |
| `nudger-fe` | Production web frontend | This repository is the only frontend deployed to `plugandnudge.com`. |
| `nudgee-fe` | Reference frontend for mobile-app work | Never deploy this repository to the production web domain. |
| `nudge-ios` | Native iOS app | Uses the production API directly; it is not the web frontend deployment source. |
| `nudge-android` | Native Android receiver app | Uses the shared production API; not a website source. |

The frontend is a static Vue SPA served by Nginx in one Cloud Run service:

| Resource | Purpose | Default runtime contract |
| --- | --- | --- |
| `nudger-fe` | Production SPA and same-origin API proxy | 1 vCPU, 512 MiB, concurrency 80, min 1 / max 5, port 80 |
| `nudger-fe-app` | Artifact Registry Docker repository | `asia-south1`, image `nudger-fe:latest` |

The service uses `internal-and-cloud-load-balancing` ingress and Direct VPC
egress on the production `default` subnet. Users reach the frontend through
the global HTTPS load balancer at `https://plugandnudge.com`; the Cloud Run
`run.app` URL is not the public application URL.

## Browser/API boundary

Production browser configuration uses:

```text
Browser -> https://plugandnudge.com/v1/*
        -> Nginx in nudger-fe
        -> https://nudge-api-...a.run.app (same-project VPC path)
        -> nudge-api
```

`VITE_API_BASE_URL=/` is intentional. It keeps OAuth start requests,
and API calls on the frontend origin. The mobile application continues to use
`https://api.plugandnudge.com`; that public API host is not embedded in the
production frontend image.

`API_PROXY_UPSTREAM` is a runtime-only environment value. It must be an HTTPS
origin without a path and must point at the API Cloud Run service URL. The
frontend uses Direct VPC egress with all traffic routed through the VPC and
Private Google Access enabled on the subnet, so this proxy never traverses the
public API load balancer. The frontend container never receives database,
Redis, OAuth client-secret or other backend secrets.

## Image lifecycle

`make create-image` runs the frontend tests and production build before creating
the `linux/amd64` image. `make publish-image` then ensures the Artifact Registry
repository exists, reapplies the cleanup policy, configures Docker
authentication, and pushes `nudger-fe:latest`.

The repository cleanup policy deletes only untagged image digests older than 48
hours. The `latest` tag remains available. Cloud Run deployment resolves the
tag to an immutable digest before deploying.

```sh
cp .env.nudger.production.example .env.nudger.production
make publish-image
make deploy-production
```

The production environment file is local and ignored. Review
`API_PROXY_UPSTREAM` and the profile-image limits before deployment; do not
commit it.

## Global HTTPS load balancer

The deployment script reuses the existing API load balancer:

- API backend remains the default route and continues serving
  `api.plugandnudge.com`.
- `plugandnudge.com` is added as a host rule to the `nudger-fe` serverless
  NEG/backend.
- A managed certificate covers `plugandnudge.com`.
- Cloudflare DNS must keep the apex record pointed at the load balancer IP and
  must allow Google certificate validation to complete.

Do not create a second load balancer for the frontend.

## OAuth production contract

The browser origin for the production web OAuth client is:

```text
https://plugandnudge.com
```

The backend callback remains:

```text
https://api.plugandnudge.com/v1/app-identity/google/callback
```

The OAuth client ID and secret belong in the backend production environment,
not in this repository or in the frontend container. The backend should allow
the frontend return URL `https://plugandnudge.com/auth/callback`.

## Production observability

The frontend receives observability values at container startup through the
ignored `.env.nudger.production` file. These values are intentionally absent
from local development files, so local sessions do not send production
telemetry.

- Google Analytics 4 uses the `plugandnudge.com` web stream and records SPA
  page views after Vue Router navigation.
- Sentry uses the separate `nudger-fe` Vue project with the `production`
  environment and a 10% tracing sample rate. Default PII collection remains
  disabled.
- New Relic Browser uses the `nudger-fe-production` browser entity with the
  EU beacon. The backend continues to use its existing New Relic APM service.
- Runtime configuration is never cached by the service worker and is not
  included in the immutable frontend build.

## Verification checklist

- Verify Git root/remote, Docker build context and source provenance. The existing
  service/image/domain guard does not itself prove that the source is this repo.
- `make create-image` passes tests, type-check/build and creates the image.
- `make publish-image` pushes the latest image and reports its digest.
- Cloud Run service has min 1 / max 5 and internal-and-load-balancing ingress.
- Frontend Direct VPC egress is attached to the same VPC/subnet as the API,
  with Private Google Access enabled and all traffic routed through the VPC.
- `https://plugandnudge.com/`, `/audience`, `/nudges` and `/auth/callback`
  resolve through SPA fallback.
- Browser network calls use `https://plugandnudge.com/v1/...`, not
  `api.plugandnudge.com`.
- API OAuth start and callback return to the production frontend.
- Verify the OAuth start response is backend JSON with the correct Google URL,
  not just a 200 SPA fallback or an HTML response on an API path.
- `api.plugandnudge.com` still routes to `nudge-api` for mobile clients.
- GA4, Sentry and New Relic production integrations load only when their
  production runtime values are present.
- Managed certificate is `ACTIVE` after DNS validation.
