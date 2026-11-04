# Public website revamp — local review

The public website revamp was approved on 22 October 2026 and merged through
frontend PR 17. This document retains the original dated verification records.

Current local follow-up, approved 27 October 2026: `feat/odoo-integration-page`
publishes **only Odoo** in the local build. The catalog, home card and Odoo detail
page are visible; all other integration code is retained but unpublished. See
[Odoo context, content boundaries and local review](odoo-integration-plan.md).
Do not merge or deploy this follow-up without a new request.

## Preview

Use Node 22+ and install the lockfile dependencies with `npm ci` if needed.
Copy `.env.nudger.example` to `.env.nudger.local` for a new checkout and point
`API_PROXY_UPSTREAM` at your local backend. Public pages do not call that backend.
The current local checkout is `/Users/kd/projects/nudger-fe`; its local
configuration has no telemetry IDs. Use port 5174 for either preview or dev,
running one at a time.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5174 --strictPort
```

Open `http://127.0.0.1:5174/`. For source edits, `npm run dev -- --host 127.0.0.1
--port 5174 --strictPort` renders the same public templates on request; refresh
after editing. Use the production preview for final performance and routing tests.

Local public pages: `/`, `/merchant`, `/integrations`, `/integrations/odoo` and
the five existing legal/support routes. The sitemap contains these nine routes.

All other integration detail routes remain unpublished (HTTP 404, noindex,
absent from links and sitemap): `/integrations/webhooks`, `/integrations/python`,
`/integrations/curl`, `/integrations/javascript`, `/integrations/automations`,
`/integrations/iot`, `/integrations/chatgpt`. `/for-nudgers` permanently redirects
to `/merchant`, preserving query strings and browser fragments.

## What to review

- Home: app showcase, benefits, privacy/control, use cases and FAQs. Integration
  navigation and the Odoo card are visible. The webhook-guide link is hidden;
  general webhook and automation use cases remain visible.
- Mobile (600px and below): persistent bottom actions with footer/safe-area
  clearance. Home has matching active Download for iPhone and Download for Android
  buttons with Apple and Google Play icons in a compact floating glass dock.
  Merchant has Create your profile linking to `/login`. Both hero download buttons
  appear only above 600px; mobile retains Meet Nudge. The public navbar has no
  Get the app CTA. The existing login/registration flow is unchanged.
- Merchant: creator/platform distinction, existing registration links, screenshots,
  aggregate CTR explanation and an honest own-app comparison; free during pilot.
- Catalog: Odoo only, with search/category/empty/reset states. Odoo detail includes
  setup, alert groups, delivery modes, opt-in/privacy, FAQs and official store links.
  Retained recipe guides and their copyable examples remain unpublished.
- Legal/support: policy copy and contact links retained, with the new public shell.
- Desktop and narrow phone widths, light/dark themes and keyboard navigation.
- Existing sign-in/dashboard: unchanged UI, APIs, permissions and authentication.
  Public links now load a separate HTML document. The existing workspace manifest
  opens `/audience` so installed workspace users do not start on the consumer site.

## Add an integration without changing the design

Each entry in `src/data/integrations.json` must have an explicit boolean
`published`. Only `published: true` entries are public. `status` is descriptive
availability, and `featured` selects home cards among published entries; neither
publishes an entry. Only Odoo is currently approved. Never infer publication from
an entry being marked Available.

`PUBLISHED_INTEGRATIONS` in `src/data/publicFeatures.ts` supplies links, cards,
search categories, detail rendering, route inventory and sitemap. The derived
`PUBLIC_INTEGRATIONS_ENABLED` controls the catalog navigation when at least one
entry is published. Every direct link to a specific guide must check that guide's
publication. If all entries become hidden, the catalog/nav also disappear.

Append an object with a unique lowercase hyphenated slug and complete, verified
content. Keep existing entries intact. Common fields: name, mark, category, status,
published, featured, summary, description, requirements, steps, examples and note.
Optional `logo` contains a local asset path, alt text and pixel dimensions; optional
`seo` contains title and description. Validation rejects incomplete content,
unsafe asset paths, duplicate slugs and invalid external product links.

Recipe guides require `codeLanguage` and `code`. Installed-app guides use a
`product` object instead: headline, app label/URL, supported-version links,
benefits, administrator steps, alert groups, delivery modes, recipient groups,
privacy, FAQs, an illustrative message and qualifying content notes. Use the
Odoo entry as the complete schema example. All prose is escaped text; no raw HTML.
The shared product layout does not require another page component for additions.

For an approved publication, change that entry's `published` flag and rebuild.
Update `public/sitemap.xml`, the development snapshot, to match generated output.
Regression checks intentionally assert Odoo is the only published integration in
this release. Update that release assertion when another entry is approved.

## Assets and content

The four app/dashboard images in `public/showcase/` are optimized screenshots of the existing local app and
workspace, captured with isolated fixture sessions and intercepted API requests.
They are actual UI, with fictional profiles, messages and metrics. Captions state
that metrics are illustrative. No real send, token, account mutation, customer
record, private webhook or production login was needed. `scripts/capture-marketing.mjs`
reproduces the source PNG captures against the local receiver (5173) and workspace
(5174); `PLAYWRIGHT_MODULE` may point to an existing installation. PNG intermediates
are ignored. The landing page does not claim these fictional creators are available.

Store links: owner-supplied iOS `https://apple.co/4yDfgX4` and Android
`https://bit.ly/4BJ3NHZ`.
Privacy copy describes identities hidden from senders and no sale of personal
information; it does not promise zero processing or deny the product's click/CTR
analytics. The comparison contains no invented monetary estimates or conversion
claims. Registration still uses the existing Google/onboarding/review flow.

## Rendering and performance

### Android download and alternatives follow-up — 4 November 2026

The owner approved committing this follow-up, opening and merging its PR into
`main`, and deploying the frontend on 4 November 2026 after local review. The
verification records below describe the reviewed source; final rollout evidence
is reported with the release result rather than inferred from a local build.

Local branch: `feat/android-download-link`. Preview: `http://127.0.0.1:5175/`
because another project occupies 5174. The public button primitive `IconLink`
shares accessible text, native links and locally rendered Apple/Google Play icons
between the hero, download section and fixed mobile dock. Both platforms use the
same active indigo treatment. Both hero download buttons are hidden at the dock's
mobile breakpoint. No dashboard, API or deployment changes.

`AlternativesSection` appears before the home FAQ and reuses the existing section,
icon and responsive three-column layout. It presents reasons to choose Nudge's
creator/platform experience: in-app discovery and subscriptions, audience and
periodic rich-notification click/CTR reporting, and aggregate reporting without
subscriber identities. These are supported by the existing landing/merchant
product contract, `src/types/audience.ts`, `src/types/nudges.ts` and the public
privacy copy. Hook alerts are not described as producing CTR.

Official comparison sources checked 4 November 2026:

- https://pushover.net/api/subscriptions — subscription links, opt-in and group
  broadcasts. Do not claim Pushover lacks subscription or multi-user support.
- https://docs.ntfy.sh/ — topic subscriptions and HTTP publishing.
- https://docs.ntfy.sh/install/ — hosted use and optional self-hosting.
- https://docs.ntfy.sh/config/#access-control — users, roles and access control.

No claim of exclusive features, superior delivery, higher conversion, permanent
free pricing or missing competitor analytics is justified by this review. The
section uses positive Nudge capabilities and linked workflow facts, not an
unsupported feature checklist. Recheck sources before future comparison changes.
Store glyphs are from Bootstrap Icons (MIT), with the license distributed at
`public/licenses/bootstrap-icons.txt`; there is no icon-font/runtime dependency.

Verification: required UI/audience checks and production build passed. The public
browser suite passed all nine static routes and 320/375/768/1440px in both themes,
including Axe and overflow checks. A focused 600/601px boundary check confirms
the extra hero Android button and mobile dock switch together. Both mobile store
links are 56px tall with the same active colors; keyboard Tab/Enter reaches the
Android destination (intercepted during the check). Review images are saved in
`.review/android-desktop.png`, `.review/android-mobile.png` and
`.review/alternatives-desktop.png`. Preview remains available on 5175. Changes
remain uncommitted on the feature branch; no merge or deployment was performed.

Follow-up polish: remove the public navbar download link and mobile hero iPhone
duplicate, retaining both desktop hero downloads. `PublicLayout` owns the shared
floating dock and compact two-line store labels; `IconLink` continues to own the
native link/icon markup. All styling stays in the public CSS section. The inset
glass surface uses theme-aware blur with an opaque fallback, 48px minimum targets,
8px target separation and safe-area/footer clearance. No new script or API state.
The updated dock is 62px tall. Styles, UI (57), audience (13), production build
and the full public browser suite pass. Focused checks at 320/375/600/601/768/1440px
in both themes confirm hero visibility, absent navbar CTA, download destinations,
keyboard focus and reduced-transparency fallback. Conservative black/white
backdrop compositing gives a minimum text contrast of 4.72:1 including hover.
Reviewed screenshots: `.review/glass-mobile-light.png`,
`.review/glass-mobile-dark.png` and `.review/glass-desktop.png`.

### Public rendering contract

Build-time Vue renders plain public HTML. Public pages load no Vue, Vuetify,
Pinia, router, icon font, authentication session or workspace telemetry bundle.
The small `src/public/client.ts` progressively enhances theme, navigation,
search/filter and copying. Existing production GA page views are preserved with
sanitized URLs, no Google signals/ad personalization, deferred loading and no local
telemetry. Public content still works with JavaScript disabled or blocked storage.

All authored styles remain in `src/styles/main.css`. The marked marketing section
is scoped under the marketing document/site and extracted into a hashed stylesheet;
it cannot alter the private app's appearance. Native FAQs and links need no JS.
Images have fixed dimensions; the primary image is prioritized and later images
load lazily. No remote fonts, videos or animation dependencies.

Public documents have no manifest, install metadata, hydration or service-worker
registration. The existing workspace worker bypasses public documents and marketing
assets and continues to protect private API/config data. The generated private
app shell retains its existing SPA/PWA behavior. Public unknown routes return 404;
private documents remain noindex. Sitemap, canonicals and metadata are generated
from the same route catalog as HTML.

## Verification

Required checks: `npm run test:styles`, `npm run test:ui`,
`npm run test:audience`, and `npm run build` (includes PWA, SEO/catalog, typecheck,
static generation and built-document checks).

`npm run test:browser:marketing` exercises all public pages without JavaScript,
five page types at 320/375/768/1440px in both themes, Axe accessibility, no overflow,
static runtime isolation, catalog controls, copying, theme persistence, keyboard
menu, mobile CTA and footer clearance. Set `PLAYWRIGHT_MODULE`, `AXE_MODULE` and
`UI_BASE_URL` to existing local tools/preview as needed. Screenshots and lab metrics
are saved under ignored `.review/`. Lab performance is not production field Core
Web Vitals; real-user INP and p75 metrics need a later deployed measurement.

### Local verification result — 22 October 2026

All 95 required source/component checks passed (styles, UI, audience, PWA and
SEO/catalog), as did type checking, the production build and four generated/HTTP
route checks. The public browser suite passed all 15 pages without JavaScript and
40 viewport/theme/page-type combinations with no Axe violations or horizontal
page overflow. Catalog interactions, copy, theme, keyboard menu and mobile dock
clearance passed. Existing audience and full workspace navigation browser suites
passed with mocked APIs; no live authentication or notification send was used.

The final mobile lab run used 150 ms round-trip latency, 1.6 Mbps download and 4×
CPU slowdown: LCP 896 ms, CLS 0, initial resource transfer 39,887 bytes. Public
site JavaScript is 3,254 bytes before compression and public CSS is 27,015 bytes.
These are local lab measurements, not real-user INP or production p75 results.
The original 6250px brand PNG remains unchanged for the app; public pages use a
1,890-byte lossless derivative of the same mark. No public styles enter the built
workspace stylesheet and no workspace styles enter the public stylesheet.

Review images: `.review/final-desktop.png`, `.review/final-mobile.png`, plus full
home, merchant, catalog and guide screenshots. `.review/verification.json` and
`.review/final-performance.json` retain the measured results locally. The main
checkout remains clean on `main`; this revamp is isolated in its own worktree.

### Mobile bottom CTA follow-up — 23 October 2026

Added the approved home download pair and merchant profile action on the same
local branch. The build and required style, UI and audience checks pass. The public
browser suite passes in both themes with no accessibility violations or overflow.
Additional browser checks confirm side-by-side downloads, disabled Android,
footer clearance and operation without JavaScript at 320/375/600px; the dock stays
hidden at 768/1440px. The merchant action opens the existing `/login` page.
Screenshots: `.review/bottom-cta-home-375.png` and
`.review/bottom-cta-merchant-375.png`. Nothing was deployed.

### Integration publication and production setup — 24 October 2026

Integrations are unpublished through the single build-time flag. Direct catalog
and guide URLs return 404 with noindex, without rendering their retained content.
The generated and development sitemaps list only the seven published routes.

Production Analytics uses existing stream 16074794704, measurement ID
`G-XPJ12JHLR6`, supplied by runtime config; the production example now names that
same public ID. The real public entry is tested under an intercepted production
origin: exactly one manual page view per document, correct title/path, sanitized
query/fragment/referrer, Google signals and ad personalization disabled. All Google
requests are intercepted; local preview never collects even with a production ID.
The existing workspace Analytics implementation is unchanged. Read-only GA
settings also confirm automatic history-based page views remain disabled, matching
the manual page-view implementation.

Read-only account checks on 24 October confirmed the production stream is receiving
traffic in the past 48 hours, and Search Console still identifies the account as
a verified owner of `sc-domain:plugandnudge.com`. Its existing sitemap URL is
`https://plugandnudge.com/sitemap.xml`, status Success, last read 23 October,
seven discovered URLs. No new verification tag, credential or sitemap submission
is needed for this local change. After a separately approved deployment, Google
can fetch the updated sitemap at that same URL; verify the new page titles in GA
Realtime and the new `/merchant` URL in Search Console. Local checks cannot prove
collection or indexing of an undeployed build. No account settings were changed.

Verification for this follow-up: required style/UI/audience/SEO/PWA checks,
type checking, build, all four built/HTTP checks, and the public browser suite
passed. Seven pages work without JavaScript, all eight integration URLs return
404, and 40 viewport/theme/page combinations have no Axe violations or overflow.
The isolated production Analytics browser check passed without sending real events.
The local preview remains on port 5174; no merge, push or deployment was performed.

Implementation references: [GA4 manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views)
and [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
