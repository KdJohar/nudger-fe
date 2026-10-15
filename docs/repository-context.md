# Nudger frontend repository context

Audience summary amendment, 14 October 2026: Total audience is live all-time
active subscribers, labelled “Currently active subscribers”, with no change or
previous-period comparison. Only New subscribers compares the selected and
preceding equal 7/30/90-day active cohorts. Shared MetricCard/CSS, existing charts,
Reachable/Muted percentages, desktop/mobile layout and navigation stay unchanged.
`test:audience` includes real component regressions; `test:browser:audience`
verifies responsive/theme/filter/error/zero-baseline behavior with mocked APIs.
Verification: all 154 frontend unit checks and production typecheck/build passed.
Chrome and WebKit passed 320/375/768/1440px in both themes (16 browser cases),
including touch/keyboard filters, no overflow, persistent header/window, API
failure/retry, zero baselines and Axe on the changed cards. These are browser
checks, not physical-device acceptance. Fixture browser contexts block service
workers so Playwright interception cannot escape to the real backend; the
production service worker and its API/runtime-config exclusions are unchanged.
The feature is merged through PR #11 and deployed as `nudger-fe-00010-rdw`,
Ready/100%. Published-image browser checks also passed all 16 width/theme/engine
cases. The live merchant shows total/new 3 across 7/30/90, with comparison only
under New. See [deployment evidence and dependency limitations](deployment-context.md#audience-active-cohort-release--14-october-2026).

Updated 2026-10-13. Read [shared project context](project-context.md) first.
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
Onboarding includes About and profile-image upload. Active profiles visiting
`/pending`, including refresh, redirect to `/audience`; inactive/suspended stay
in pending. R2 finalized profile assets use `https://assets.plugandnudge.com`.

Accepted desktop/mobile design is final. Maintain semantic structure and shared
state. Use existing coral `#FF6B4A`, indigo `#4338CA`, white/dark `#171B25`,
System theme, transparent avatars and `src/styles/main.css` styling ownership.
Mobile uses compact controls/pills, intended internal scrolling, dynamic safe areas,
keyboard-aware sheets and bottom-edge navigation. No page-level rubber-band/overflow
or duplicate mobile headings; keep accessible naming and 48px hit areas.
Test iOS standalone and Android browser/PWA geometry, not only desktop emulation.

## PWA, SEO and public pages

15 October 2026, local SEO implementation: public pages are generated as full HTML
from existing Vue components during the build; the merchant remains a SPA/PWA.
One public inventory generates metadata, sitemap and Nginx routing; private HTML
has noindex directives and unknown routes return real 404s. Service-worker public
offline fallback is page-specific with content-derived cache versions. Analytics
queue/initial page-view fixes are tested locally. Search Console property and GA4
stream were checked read-only; sitemap submission and live collection validation
await an approved deployment. See [rendering, analytics and verification contract](public-pages-seo.md).

15 October 2026: `/delete-account` is a public Nudge account-deletion request
resource using the existing legal-page layout. Requests go to
`kd@plugandnudge.com` for owner-approved manual follow-up. It describes the
receiver reset (personal receiver data removed, subscriptions deactivated and
inbox receipts deleted from the inbox), retained merchant profiles, and the
aggregate-only subscription, delivery, click and CTR statistics visible to
merchants. Subscriber identity and individual subscriber/click records are never
exposed to merchants. Historical analytics may remain until the retention policy
removes them; email request delivery/processing is not automatic.

Manifest app name is `Plug & Nudge`, short/install name `Nudger`, standalone
display, `/` start/scope, coral theme; Android/maskable and Apple touch icons.
Do not change it back to the receiver name `Nudge`.
Apple standalone metadata, SPA fallback, safe-area layout and static-asset-only
service worker remain part of the contract. Never cache `runtime-config.js`,
authenticated APIs or session credentials. No browser push delivery is requested.

Public routes: `/`, `/for-nudgers`, `/privacy`, `/security`, `/terms`, `/delete-account`.
Public footer excludes the Developer API Docs link. Initial HTML and SPA navigation
share canonical, description, Open Graph/Twitter/JSON-LD; robots/sitemap accompany it.
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
Read-only 13 October snapshot: `nudger-fe-00009-lcs`, Ready and 100% traffic,
service min 1 / max 5. This is deployment readiness, not a fresh login/browser test.

One shared global HTTPS load balancer serves apex/frontend and API/mobile.
Certificate `nudger-fe-managed-cert` is ACTIVE and attached. Direct external
frontend `run.app` access is intentionally blocked, not an availability test.

## Rich composer and saved history

The Rich creator/playground/history work is merged through PR #9 and was included
in the approved merchant rollout. Basic is default and omits Rich-only request
keys. Rich requires destination and Watch now/Learn more, with optional owned,
finalized R2 media. Manual WebP upload and explicit YouTube thumbnail import use
existing shared draft controls, one notification preview and immutable review.
Sender identity remains the title/avatar; content image is separate. No pricing
or hook redesign. The review retains the device-appearance warning without a
duplicate Full message section/format badge or phone frame.

Desktop history shows Message, Type, Inbox audience, Push delivered, Push silenced,
Total clicks, CTR, Status and Details. Completed duration appears once in Status.
Mobile retains compact cards and six metrics; More stats uses the existing Sheet,
desktop the existing DialogFrame. One shared details body includes device attempts,
failure counts, snapshot freshness, CTA and media viewer. Large/short/long data,
image expiry and missing metrics must not distort either presentation.

Prefer canonical `push_delivered`/`push_suppressed` over legacy aliases, including
zero. Audience/silenced/clicks count users; delivered/failed/devices count device
attempts. CTR is the backend's saved one-decimal percent, not a browser calculation.
Basic/uncalculated Rich render a dash, measured zero renders zero, and zero inbox
audience has no CTR. Multiple devices can exceed audience; no installations alone
does not mean Push silenced. See [Rich feature context](rich-notifications.md).

13 October source regression rerun: 151 checks passed. Dated Chrome/WebKit
responsive, dialog/media/error/focus/Axe evidence remains in the Rich guide.
No visual or application code changes are made in this documentation sync.

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
