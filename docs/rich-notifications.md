# Rich notification frontend contract

Approved 11 October 2026. Local-only feature branch; no merge or deployment.
Backend source: `../plugnudge-be/docs/rich notification implementation.md` and
`rich-notification-backend-report.md` (approved addendum supersedes old proposals).

## Journey and ownership

Existing Nudges FAB → desktop composer/mobile sheet → reviewed immutable payload
→ one send → queued result/history. Basic is default; Rich requires destination
and Watch now/Learn more, with an optional finalized image. Merchant identity owns
the title/avatar; content media is separate. No pricing or hook changes.

`useNotificationDraft` owns capabilities, format/destination/CTA, media upload and
stale cancellation. `NotificationFields` renders shared controls for composer,
sheet and playground. Existing composer/playground composables own confirmation
and sends; typed notification adapters own requests. Preview/history reuse media
presentation. No page frame duplication; central CSS and existing tokens only.

Loading/error/retry capabilities, optional failed image, replacement/removal,
upload/finalization busy, invalid fields, immutable review, queued/uncertain send
are explicit states. Never retry an uncertain send automatically. Basic omits all
Rich keys. Media follows presign → unauthenticated signed PUT → finalize; only an
owned finalized URL is sent. YouTube import is explicit, never arbitrary scraping.

Mobile retains internal scroll, bottom safe areas, 48px controls and accessible
headings but no visible page/app header on Compose or API access. Desktop design
and the shared shell remain unchanged. Long content stays reachable.

## Verification and boundaries

Unit/component tests cover payloads, capabilities, validation, async races and
review. Fixture browser checks cover both themes, responsive views, uploads,
playground/history and focus. No real sends/uploads or production mutation.
Actual storage/Firebase/native testing is a later release gate.
`nudgee-fe` is the receiver reference only; iOS/Android are not rebuilt here.
Receiver in-app click tracking means explicit Rich CTA only, not passive viewing.

## Implemented checklist

- [x] Backend capabilities control available formats, CTAs, delivery types and limits; loading, malformed responses and explicit retry are handled.
- [x] Shared Basic/Rich controls in desktop Compose, mobile composer Sheet and platform playground. No extra editable title or pricing UI.
- [x] Rich destination is required public HTTPS; Watch now/Learn more are the only CTA values. Image remains optional. Basic payloads omit all three Rich keys.
- [x] Static JPEG/PNG/WebP input, source byte/magic/animation/dimension checks, aspect-preserving resize and metadata-free canvas processing. Chrome encodes bounded WebP. Safari's PNG encoding fallback uses the existing PNG staging contract; finalization still requires WebP within final limits.
- [x] Presign → anonymous signed PUT → finalize; only finalized public media is used. Upload progress, replacement, removal, cancellation, explicit retry and stale-result suppression. Uploads never receive session/merchant credentials.
- [x] Explicit supported YouTube thumbnail import. Manual image overrides imports. Destination changes invalidate YouTube media. Missing thumbnail permits image-less Rich.
- [x] Live preview, immutable confirmation and Rich history presentation keep sender avatar separate from content image. One notification card is shared across desktop, mobile sheet and review; full message and CTA/destination remain reachable in confirmation.
- [x] Platform broadcast/transactional targeting, six-digit recipient validation and all five generated request languages carry the same fields. Sample fields in examples are explicitly labelled; actual sends always validate actual inputs.
- [x] Duplicate-send blocking, no automatic send retry, uncertain-send history guidance, server field feedback, owner changes/disposal, and preserved draft on rejection.
- [x] Message limits count trimmed Unicode code points consistently with the backend; native UTF-16 maxlength does not prematurely reject emoji.

## Local verification — 11 October 2026

- Full source/component suite: **135 passed**. Focused Rich suite: 13 tests. Existing API, auth, profile, history, theme, layout, snackbar, PWA and style tests remain included.
- Production build/type checks passed, including four style and six PWA guards. The existing large-bundle warning remains; it is not a failing build or addressed by this feature.
- Chrome fixture Rich journey: 320/375/414/768/1440px, both themes. Upload bytes/MIME, Basic/Rich payloads, immutable review, queued result, missing destination, creator capability retry, rejected-send preservation, image-less transactional playground, history and mobile-sheet thumbnail failure checked.
- WebKit fixture Rich journey **passed** at 375/414px in both themes, including actual PNG staging fallback, byte/MIME declarations, final WebP response, creator retry/rejection, mobile sheet and platform playground/history. Browser-engine simulation is not physical-device PWA verification.
- Axe checks target the changed Rich form controls in both themes; receiver checks cover the complete Rich Sheet. These are automated checks, not a substitute for screen-reader/device testing.
- Existing Chrome mobile-native fixture suite passed: both themes at 320/375/390/440/412/768px and landscape 844×390, simulated iPhone/Android bottom insets, content scrolling, navigation and viewport changes. Desktop sidebar/route assertions passed; no pre-change pixel baseline was available.
- Screenshots were reviewed for sender mobile/desktop and receiver Sheet. Temporary artifacts live outside Git under `/tmp/nudger-rich-qa`, `/tmp/nudger-rich-webkit` and `/tmp/nudgee-rich-qa`.

### Notification preview refinement — 12 October 2026

- Removed the phone frame/live clock and duplicate placement-specific preview rules. `NotificationPreview` now owns the caption, readable card, merchant avatar/Nudge badge and optional right thumbnail in every composer placement.
- Four-line wrapping applies only to the illustrative card. Long merchant names are visually ellipsized with the full title retained; review exposes the complete message separately. Basic and Rich-without-image reserve no media column. Avatar/media failures recover independently on replacement.
- Shared fields use consistent label/group spacing and a message slot, so desktop, mobile sheet and playground follow the same editing order without duplicating draft state.
- `tests/NotificationPreview.test.mjs` covers identity, independent image fallbacks, format switching, empty drafts, long Unicode text and non-live confirmation. It also runs under `npm run test:compose`.
- `tests/browser/richNotifications.mjs` checks right-side thumbnail/badge geometry, readable font sizes, four-line limit, field order, touch targets, full-text review, broken images and draft preservation, in addition to the existing fixture send/upload journeys. These tests never deliver real notifications.

Verified for this refinement:

- **139 source/component tests passed**, including UI/audience/style/PWA and the new four preview tests. Local build/type checks and the local Docker build passed. Existing bundle-size warning and `npm ci`'s two moderate dependency findings remain outside this UI change; dependencies were not changed.
- Chrome fixture journey passed at **320/375/414/768/1440px**, both themes, against the rebuilt localhost:5174 container. WebKit passed at **320/375/414/1440px**, both themes. Additional keyboard checks passed in Chrome and WebKit: arrow-key format selection and focus on an invalid destination.
- Axe reported no violations in the changed notification fields and preview across the tested themes/widths. Short/long/Unicode messages, long merchant names, empty drafts, optional/missing/broken/replaced images, Basic reset, full review, creator retry, rejected-send preservation and playground/sheet flows are covered.
- Existing mobile-native regression passed in Chrome at **320/375/390/440/412/768px** plus **844×390 landscape**, both themes. Simulated iPhone 14/16 Pro Max and Android inset/no-inset dock checks passed after scrolling/navigation/viewport changes. This is not a physical-device keyboard/PWA test.
- Screenshots reviewed under `/tmp/nudger-card-container` and `/tmp/nudger-card-webkit`; the local Nudger container was rebuilt and its existing tunnel returned HTTP 200. No production deployment, backend/Nudgee/mobile app change, real upload or real send was performed.

### Reproduce safely

Run `node --test tests/*.test.mjs`, `npm run build`, then start local Vite with
the existing selected env. `npm run test:browser:rich` defaults to localhost:5174.
If Playwright/Axe are only installed in the sibling receiver checkout, provide
`PLAYWRIGHT_MODULE` and `AXE_MODULE` as their absolute entry paths. Optional
`UI_BASE_URL`, `RICH_SCREENSHOT_DIR`, `RICH_VIEWPORTS` and `BROWSER_ENGINE` select
only the fixture test harness; they do not change app configuration. All API,
storage PUT, thumbnail and destination requests are intercepted.

### Not tested / deliberately unchanged

- Real API/database send-to-inbox integration, Google consent, real R2 CORS/signatures/cleanup, media ownership and expired-upload responses from a live backend. These need the prepared backend branch and locally configured storage; fixtures only prove the frontend contract.
- Real Firebase/APNs/Android Rich notifications, native external-link opening, notification action taps, cold launch, attachment download timeouts and physical-device PWA keyboard/safe-area behaviour. These belong to the later native phase.
- Production configuration, cloud infrastructure, migration, deployment, registry push, pricing/billing and hooks API changes.
- No merge, deployment or real notification was performed in this phase. Browser tests' 202 responses are fixtures, not evidence of delivery.
