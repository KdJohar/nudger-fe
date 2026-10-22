# Public website revamp — local review

Approved scope, 22 October 2026: redesign public marketing around the Nudge mobile
app; preserve the existing login, onboarding and authenticated workspace. Work is
local on `feat/public-landing-revamp`. Nothing has been pushed, merged or deployed.

## Preview

Use Node 22+ and install the lockfile dependencies with `npm ci` if needed.
Copy `.env.nudger.example` to `.env.nudger.local` for a new checkout and point
`API_PROXY_UPSTREAM` at your local backend. Public pages do not call that backend.
The review worktree already has a local-only configuration with no telemetry IDs.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5186 --strictPort
```

Open `http://127.0.0.1:5186/`. For source edits, `npm run dev -- --host 127.0.0.1
--port 5187 --strictPort` renders the same public templates on request; refresh
after editing. Use the production preview for final performance and routing tests.

Pages: `/`, `/merchant`, `/integrations`, `/integrations/webhooks`,
`/integrations/python`, `/integrations/curl`, `/integrations/javascript`,
`/integrations/automations`, `/integrations/iot`, `/integrations/chatgpt`, plus the
five existing legal/support routes. `/for-nudgers` permanently redirects to
`/merchant`, preserving query strings and browser fragments.

## What to review

- Home: app showcase, benefits, privacy/control, use cases, integrations, FAQs.
- Mobile: persistent iPhone download action with footer/safe-area clearance.
- Merchant: creator/platform distinction, existing registration links, screenshots,
  aggregate CTR explanation and an honest own-app comparison; free during pilot.
- Catalog: name search, category selection, empty/reset state, detail pages and
  copyable setup examples. Every card and guide is present without JavaScript.
- Legal/support: policy copy and contact links retained, with the new public shell.
- Desktop and narrow phone widths, light/dark themes and keyboard navigation.
- Existing sign-in/dashboard: unchanged UI, APIs, permissions and authentication.
  Public links now load a separate HTML document. The existing workspace manifest
  opens `/audience` so installed workspace users do not start on the consumer site.

## Add an integration without changing the design

Append one object to `src/data/integrations.json`; keep existing entries intact.
Use the same fields as an existing entry: unique lowercase hyphenated `slug`,
`name`, `mark`, `category`, `status`, `featured`, `summary`, `description`,
`requirements`, ordered `steps`, `codeLanguage`, `code`, `examples`, and `note`.

`status` must be `available` (built-in), `recipe` (generic webhook guide), or
`preview` (limited access). Never mark a planned/native integration as available.
`featured: true` includes the card on the home page. Category options, catalog,
detail page, metadata, sitemap and Nginx route inventory derive from the JSON.
Rebuild to publish an addition; adding a name alone is not enough to invent setup
instructions. All prose is rendered as text, never injected as HTML. The build
rejects invalid/duplicate slugs and incomplete guide fields.

The initial catalog includes personal webhooks and five generic HTTP recipes.
ChatGPT is labelled Preview because public distribution has not been verified.
There is no private installation URL or credential in the catalog.

## Assets and content

The four app/dashboard images in `public/showcase/` are optimized screenshots of the existing local app and
workspace, captured with isolated fixture sessions and intercepted API requests.
They are actual UI, with fictional profiles, messages and metrics. Captions state
that metrics are illustrative. No real send, token, account mutation, customer
record, private webhook or production login was needed. `scripts/capture-marketing.mjs`
reproduces the source PNG captures against the local receiver (5173) and workspace
(5174); `PLAYWRIGHT_MODULE` may point to an existing installation. PNG intermediates
are ignored. The landing page does not claim these fictional creators are available.

Store link: owner-supplied `https://apple.co/4yDfgX4`. Android is coming soon.
Privacy copy describes identities hidden from senders and no sale of personal
information; it does not promise zero processing or deny the product's click/CTR
analytics. The comparison contains no invented monetary estimates or conversion
claims. Registration still uses the existing Google/onboarding/review flow.

## Rendering and performance

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
