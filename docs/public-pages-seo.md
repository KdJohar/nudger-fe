# Public HTML, SEO and merchant SPA contract

Accepted 15 October 2026. Implementation branch: `feature/public-pages-seo-prerender`.
The owner subsequently approved the frontend-only production rollout. Implementation
was merged through PR #14 and deployed from clean main `ed605471022d63eebbfded4d593ffab3f363348b`.
See the production evidence below; earlier local observations remain dated evidence.

## Rendering and ownership

`src/data/publicPages.ts` is the route/metadata inventory for `/`, `/for-nudgers`,
`/privacy`, `/terms`, `/security`, `/delete-account` and `/support`. The normal build compiles
the Vue client and a build-only renderer, then `scripts/prerender.mjs` renders the
existing public components into complete HTML. There is no runtime Node server.
Nginx serves the generated documents from the existing image.

`src/entry-server.ts` creates a fresh Vue app, memory router, Pinia and Vuetify for
each page. Public generation never reads runtime env files, restores sessions,
executes client telemetry or calls backend services; fetch requests during
generation fail the build. Actual public text, headings, footer anchors, images,
SEO metadata and Vuetify's generated theme stylesheet are available in the HTTP
response before JavaScript. Content is not duplicated into a separate bot template.

The client waits for its lazy route before hydrating public HTML. Browser theme
preferences apply after hydration; generated HTML uses the existing light theme.
The snackbar teleport starts after mounting. Private documents still mount the
normal client app, preserve the authenticated persistent workspace frame and use
the existing runtime env/proxy/auth contracts. Public code/layout/styles and the
merchant design are shared with their existing Vue sources.

## Routing, metadata and crawlers

`seoMetadata.ts` owns document and SPA metadata together: titles/descriptions,
canonical URLs, robots, Open Graph/Twitter and Organization/WebSite/WebPage JSON-LD.
Canonical URLs use the production origin and exclude query strings and fragments.
The renderer escapes head values and JSON. Structured data describes existing
visible content only; there are no invented reviews, ratings or store links.

The build generates `dist/sitemap.xml` and `dist/public-routes.conf` from that same
public inventory. Keep public/sitemap.xml as the development snapshot. The image
copies the generated Nginx include into `/etc/nginx/snippets`. Exact public routes
receive their own HTML; trailing slashes redirect to the canonical path. Known
auth/workspace routes receive generic `app.html` with noindex metadata and
`X-Robots-Tag: noindex, nofollow`. Unknown routes/assets return HTTP 404 and a
noindex public error page, rather than homepage HTTP 200. Vue also renders this
error view for unknown client-side navigation. API and docs proxy precedence is
preserved; `/v1/*` never becomes a static file or frontend fallback.

`robots.txt` permits public rendering resources including runtime-config.js.
Private HTML is crawlable so robots can see its noindex directive; this is not an
authentication boundary. API/docs endpoints are disallowed. Never add private,
authenticated, query-token or staging URLs to the sitemap.

## PWA caching

The manifest, install names, icons, scope, standalone behavior and workspace
navigation are unchanged. The generated service worker has a content-derived
cache version. Public navigations are network-first with an exact-page offline
copy; `/privacy` must not fall back to the homepage. Private navigation may use
only the generic app shell. Runtime config, auth/API responses and user data are
never cached. Activation removes only older Nudger caches, preserving unrelated
origin caches. Old policy documents are replaced through build-version activation
and network-first requests. Explicit client config remains network-only offline.

## Analytics and Search Console

Read-only account checks on 15 October 2026 confirmed the existing Search Console
domain property `sc-domain:plugandnudge.com`, with the account shown as a verified
owner: zero indexed pages, four not indexed, and no submitted sitemap.
The existing production Analytics web stream is
`Plug & Nudge Production Web`, stream 16074794704, measurement ID `G-XPJ12JHLR6`,
property 555974992. The ignored production env matches it. Google reports no data
received in the preceding 48 hours; connection alone is not proof of collection.

The prior gtag wrapper queued rest-parameter arrays instead of the documented
arguments objects. This branch uses the supported queue, loads the tag once,
deduplicates initial afterEach/isReady callbacks, tracks successful SPA routes,
preserves page titles/referrers and removes URL queries/fragments from explicit
page-view payloads. Local env has no telemetry IDs; regression tests use a fake
queue and send no real Analytics events. This does not add notification click
tracking or expose subscriber identity to Google Analytics.

Production's Enhanced Measurement history-page-change checkbox is currently
enabled. At an approved rollout, disable that one automatic history mechanism
when enabling this manual router page-view implementation, so it cannot duplicate
SPA views. No Analytics settings were saved during local work. Then verify a real
public visit and route transition in Realtime/DebugView, including one view per
navigation and correct titles. Confirm configured telemetry providers stay
production-only. Do not claim live collection is repaired before rollout.

After an approved production deployment, submit
`https://plugandnudge.com/sitemap.xml` in the verified domain property, inspect
homepage/legal URLs with Google's live URL test, and request recrawling as
appropriate. Search Console cannot crawl localhost; crawling/indexing delays and
approval remain external. No sitemap was submitted during the local-only task.

The robots report shows the canonical HTTPS apex robots.txt was fetched. Older
HTTP/apex and HTTP/HTTPS www entries report failures. Read-only live checks also
found HTTP apex connection reset, HTTP www status 520 and HTTPS www status 400.
These variants need canonical HTTPS-apex redirects in the appropriate production
DNS/load-balancer/edge routing when that work is authorized; an app-only local
HTML build cannot repair traffic that never reaches this Nginx service. No DNS,
certificate, load-balancer or Cloudflare settings changed during this task.

## Verification

- `node --test tests/*.test.mjs`: frontend/component regressions including pure
  metadata escaping/canonicalization, Analytics queue/navigation/deduplication and
  simulated worker offline/exclusion/upgrade behavior.
- `npm run build`: style/PWA/SEO guards, project typecheck, client build, Vue
  prerender, and built-document/sitemap/worker checks; no missing public HTML may
  silently pass the build.
- `SEO_BASE_URL=http://localhost:5174 npm run test:seo:built`: local-only real HTTP
  checks for public content, private noindex shell, redirects, runtime/SW caching
  and genuine 404s. API mutations are not part of these checks.
- Browser checks: complete public content/metadata, hydration, navigation/menu,
  themes, 320/375/768/1440px reflow, and transition into the existing workspace.
  Actual no-JavaScript content is asserted from raw HTTP/built HTML, not inferred
  from a JS-rendered screenshot. Mobile/desktop visual screenshots preserve the
  existing design. Physical PWA installation and live Analytics collection are
  separate from these local checks.

Local evidence: all 165 source/component checks passed; all four built-site/HTTP
checks passed against the final container. Chrome passed homepage/privacy/deletion
at 320/375/768/1440px in both themes, and the remaining public routes at desktop.
Public menu state persisted through SPA navigation and metadata followed the
destination. Authenticated local Audience/Nudges/Profile/API-token routes retained
one header/window and mobile navigation, with desktop navigation on resize.
The Google sign-in entry respected the existing signed-in redirect to Audience.
No profile changes, sends, uploads, token creation/rotation or real analytics
events were used for these checks. Privacy screenshots before/after at 375px were
visually reviewed with the same layout and text wrapping. No browser application
warnings/errors were observed in these checks. Physical-device PWA installation,
a fresh Google consent flow and production Analytics ingestion were not retested.

References: [Vue SSR/SSG](https://vuejs.org/guide/scaling-up/ssr.html),
[Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[GA4 manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views).

## Production verification — 15 October 2026

- PR #14 merged, its feature branch deleted locally/remotely, and local main
  fast-forwarded to GitHub before publication. No other open Nudger PRs existed.
- Published `nudger-fe:latest` index digest:
  `sha256:02acf3660e508626ae72b6479a0f96ffdafd5652d0d99bb7e9bd5e56b34aa479`.
  Cloud Run `nudger-fe-00013-qqb` is Ready with 100% traffic, service min 1/max 5,
  1 CPU/512 MiB, restricted ingress and existing Direct VPC all-traffic preserved.
- Previous deployed image `sha256:53b86ea81d5133239ac24a2eea8d237bc496c5c0e744828e778569cf2f6c0998`
  is protected by tag `rollback-before-seo-20261015`. No backend, worker,
  migration, Nudgee or native app was deployed.
- All 165 source/component tests passed again; the production publish pipeline's
  tests, typecheck, client/server build and prerender guards passed. Live HTTP
  checks confirmed six full public HTML pages/canonicals, three private noindex
  shells, true page/asset 404s, sitemap/robots, no-store config/SW, and successful
  same-origin Google-start JSON with the correct public API callback.
- Live mobile menu and 320/375/768/1440px public reflow checks passed without
  overflow. Browser application warnings/errors were absent in these checks.
  These are not physical-device installation or fresh-consent acceptance tests.
- The production GA4 web stream received the real browser visit in Realtime,
  including its title and subsequent SPA routes. Automatic history-based page
  views were disabled and the saved unchecked setting verified. An already-open
  tab initially double-counted navigation, consistent with cached remote tag
  settings; after browser reload, controlled Terms and For creators transitions
  each recorded one view. Do not treat an already-open
  cached tag as evidence that a newly saved remote setting failed.
- Search Console processed `https://plugandnudge.com/sitemap.xml` successfully
  and discovered all six public URLs. Its initial transient "Couldn't fetch"
  changed to success; frontend request logs also show Googlebot HTTP 200.
  Live homepage and privacy URL tests returned "URL is available to Google"
  and "Page can be indexed". The homepage's indexed result already reported
  "URL is on Google"; privacy was discovered but not yet indexed. Indexing all
  pages is Google's decision, not a deployment health guarantee.
- The optional manual homepage indexing request failed because Google's
  reCAPTCHA service could not connect. No challenge was solved or bypassed;
  sitemap processing and live crawling succeeded independently.
- The separate www redirect was prepared but not deployed: browser safety review
  requested approval for the exact wildcard-to-target mapping. Apex remains
  DNS-only to preserve the current Google-managed certificate contract. HTTP
  apex has no port-80 load-balancer listener. Do not claim HTTP/www redirects
  were repaired, turn on apex proxying, or add billable forwarding resources
  without resolving that separate routing decision.

Documentation-only release evidence may be committed after publication; it does
not change the application image or its recorded build-source commit.

## App Store support resource — 19 October 2026

Owner-approved `/support` reuses PublicLayout and PublicInfoView, with the current
public typography, colours and responsive styles. Journey: store listing or site
footer → support instructions → explicit email action, privacy or deletion links.
It needs no account, API call, form submission, new service or mobile-app change.
The shared public inventory provides prerendered HTML, canonical metadata, routing,
sitemap and the existing exact-page offline behavior. Existing legal-page labels
remain unchanged; the support page supplies its own contact/promise labels.

The public contact is `kd@plugandnudge.com`. Copy explains provider-specific login,
notification Settings/preferences, optional redacted screenshots and safe issue
reports. Never promise instant replies, automatic deletion or an implemented
moderation workflow. Support email is a manual contact channel, not a replacement
for in-app report/block functionality.

Verify the public HTTP document and email/privacy/deletion anchors without login,
single h1, keyboard access, 320/375/768/1440 reflow and both themes. This change
does not alter the merchant workspace, APIs, native apps or their store links.

Local verification: 166 source/component tests passed; typecheck, style/PWA/SEO
guards, client/server build and seven-page prerender passed. All four built-site
checks passed against the final Docker image at localhost:5184. Chrome confirmed
one h1, no horizontal overflow and 50px main action targets at actual
320/375/768/1440px widths. Both themes and the privacy navigation were checked;
mobile and desktop screenshots retain the existing public-page layout. Chrome's
viewport override became ineffective, so final narrow-width checks used its
visible responsive-device controls instead. No mail, account mutation or
production analytics event was needed for local verification. Physical PWA
installation and automated Axe coverage were not rerun for this content-only page.
