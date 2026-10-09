# Nudger frontend repository context

Updated 2026-10-09. Read [shared project context](project-context.md) first.
This is the merchant/creator workspace plus public landing/legal pages.
Remote: `KdJohar/nudger-fe`. It alone deploys to `https://plugandnudge.com`.

## Owning guides

Read [app context](app-context.md), [design language](design-language.md),
[Vue architecture](vue-architecture.md), [Vuetify components](vuetify-component-context.md),
[API client](api-client.md), [mobile design](mobile-design-context.md) and
[deployment runbook](deployment-context.md) for the corresponding work.

Vue 3/TypeScript/Vuetify; no return to the old Tailwind/Material prototype.
Keep one persistent AppShell/PageLayout/PageHeader/VWindow. Route bodies and
composables do not duplicate shells. Authenticated routes: audience, nudges,
compose, profile and platform-only token. `/dashboard` redirects to `/audience`.
Google auth → missing profile onboarding → inactive profile pending → active workspace.
Creator permissions and platform-only tokens remain backend-enforced.

Accepted desktop/mobile design is final. Maintain semantic structure and shared
state. Use existing coral `#FF6B4A`, indigo `#4338CA`, white/dark `#171B25`,
System theme, transparent avatars and `src/styles/main.css` styling ownership.
Mobile uses compact controls/pills, intended internal scrolling, dynamic safe areas,
keyboard-aware sheets and bottom-edge navigation. No page-level rubber-band/overflow
or duplicate mobile headings; keep accessible naming and 48px hit areas.
Test iOS standalone and Android browser/PWA geometry, not only desktop emulation.

## PWA, SEO and public pages

Manifest app name is `Plug & Nudge`, short/install name `Nudger`, standalone
display, `/` start/scope, coral theme; Android/maskable and Apple touch icons.
Do not change it back to the receiver name `Nudge`.
Apple standalone metadata, SPA fallback, safe-area layout and static-asset-only
service worker remain part of the contract. Never cache `runtime-config.js`,
authenticated APIs or session credentials. No browser push delivery is requested.

Public routes: `/`, `/for-nudgers`, `/privacy`, `/security`, `/terms`.
Public footer excludes the Developer API Docs link. SPA SEO manages canonical,
description, Open Graph/Twitter/JSON-LD; robots/sitemap accompany it.
Auth and private workspace routes are noindex. Public PII/privacy wording must
not imply no data is processed by configured telemetry providers or invent audits,
compliance or guarantees. Store links remain coming-soon until releases exist.

## Publishing and networking

`.env.nudger.production` is ignored and supplies runtime public configuration:
`VITE_API_BASE_URL=/`, backend `API_PROXY_UPSTREAM`, image limits and production
GA4/Sentry/New Relic Browser values. No DB/Redis/backend OAuth/private key secrets
belong here. Local env selection does not inherit production telemetry.

Commands from **this Git root**:
`make test`; `make create-image`; `make publish-image`;
`make deploy-production`. Publish tests/builds the linux/amd64 image, ensures
`nudger-fe-app` exists, applies 48-hour untagged cleanup, then pushes latest.
Deploy pins its digest and updates only the Nudger frontend/approved host rule.

The deployment script constrains service, repository, image and apex-domain names.
Also inspect Git remote/build context and verify it is not Nudgee source: the guard
does not itself prove Git provenance. Do not run this pipeline from the receiver repo.

The browser calls same-origin `/v1/*`; Nginx calls the API Cloud Run HTTPS origin
via Direct VPC all-traffic + Private Google Access. No public API-LB hop and no
browser worker/DB connection. The earlier 404 was caused by proxying to restricted
`run.app` without the required VPC routing; not proof of a Nudgee deployment.
Current live frontend revision is `nudger-fe-00006-gns` (dated snapshot).

One shared global HTTPS load balancer serves apex/frontend and API/mobile.
Certificate `nudger-fe-managed-cert` is ACTIVE and attached. Direct external
frontend `run.app` access is intentionally blocked, not an availability test.

## Verification and future release gate

Before release, verify actual repository/image/service/domain provenance, tests,
typecheck/build, public legal/SEO routes, refreshed/deep-link SPA routes, runtime
config and its SW exclusions. Verify `/v1/app-identity/google/start` returns the
backend JSON contract and the correct Google authorization/callback URL—not only
that `/` returns 200 or that a nested API path returns SPA HTML.
Check callback return `https://plugandnudge.com/auth/callback`, onboarding,
pending/active permissions, VPC routing and external ingress restrictions.
Preserve desktop design while testing 320/375/414/768/1440, themes, keyboard,
bottom navigation and safe areas on real iOS/Android where applicable.

Production integrations: GA4 SPA page views, Sentry Vue production/PII-off default
and New Relic Browser EU. Search Console ownership/index coverage needs a live
check, not an assumption from an earlier setup request.
UI tests use fixtures; don't send real nudges, rotate tokens or edit profiles
merely to test rendering. Publishing/deploying/merging is separate authorization
from a context-only task. At this update, checkout was clean main before docs.
