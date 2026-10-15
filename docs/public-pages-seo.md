# Public HTML, SEO and merchant SPA contract

Accepted 15 October 2026. Implementation branch: `feature/public-pages-seo-prerender`.
This work is local for review; it does not authorize publishing, merging or deploying.

## Rendering and ownership

`src/data/publicPages.ts` is the route/metadata inventory for `/`, `/for-nudgers`,
`/privacy`, `/terms`, `/security` and `/delete-account`. The normal build compiles
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
