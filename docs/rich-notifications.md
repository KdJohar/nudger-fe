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

### Confirmation layout contract — 12 October 2026

Review & send → immutable review → edit the preserved draft or send once. The
existing workflow, API payloads, preview and queued/error states stay unchanged.
`DialogFrame` owns a non-shrinking header and action footer around one keyboard-
scrollable body for desktop Compose and API playground. Outer Vuetify dialogs
retain focus trapping, dismissal and busy-state ownership. Composer dialog and
mobile Sheet display the full message once in expanded `NotificationPreview`;
playground displays it once in a heading-free `MessageSummary`. `ContentSummary`
hides its format badge in review and can hide its media when the shared
notification preview already shows it; CTA and destination remain visible.

Verify actual mounted dialogs, not just preview-card dimensions: footer inside
the viewport before/after body scrolling, full message natural height, wrapped
URLs, one thumbnail, focus/escape/restore, Basic and Rich with/without media,
failed images, rejected/busy sends, narrow/short screens, Chrome/WebKit and both
themes. Use fixtures only; never send the user's open draft.

Root cause: Vuetify's direct `VCard` flex layout overrode the intended grid. The
overflowing full-message block could shrink to its label while a second large
image pushed the actions outside the visible card. Earlier checks asserted full
text in the DOM and preview geometry, but not visible modal/footer geometry. The
new footer assertion failed against the old code at 1728×761 before the fix.

Verification for the correction:

- **142 source/component tests passed**, including three new shared review-layout
  tests, UI/audience tests, style ownership and PWA checks. Type check, production
  build and local Docker build passed; no dependency changes. Existing large-chunk
  warning and two moderate dependency audit findings remain outside this fix.
- Chrome Rich fixture suite passed against the rebuilt localhost:5174 container
  at **320/375/414/768/1440px**, both themes. WebKit passed against local Vite at
  **320/375/414/1440px**, both themes. Both engines passed the complete confirmation
  matrix and short-screen playground/Sheet checks. The
  confirmation matrix also covers **1728×761, 1440×600, 768×600, 375×500, 320×568
  and 844×390**, both themes. Keyboard checks use macOS WebKit's Option-Tab mode
  to include all controls; Chrome uses Tab. Assertions wait for the documented
  dialog focus transition and Sheet visual-viewport resize handler to settle.
- Geometry checks cover fixed actions before/after body scrolling, natural-height
  full text, long destination wrapping, one preview thumbnail, Basic, image-less
  Rich, broken images, Escape/focus restoration, busy-state dismissal blocking and
  rejected-send draft preservation. Short-screen playground and long-message
  mobile Sheet reviews include their media/CTA and pinned-footer checks.
- Axe reported no violations within the changed form/preview and confirmation
  frame in the exercised themes/viewports. The existing Chrome mobile-native
  suite passed at **320/375/390/440/412/768px and 844×390**, both themes, including
  simulated iPhone/Android insets and route/viewport changes.
- Screenshots reviewed under `/tmp/nudger-dialog-chrome`,
  `/tmp/nudger-dialog-container` and `/tmp/nudger-dialog-webkit`. Only the local Nudger container was rebuilt; the
  existing local route and tunnel both returned HTTP 200. The user's open draft
  was not reloaded or submitted. No real send/upload, production deployment,
  backend/Nudgee/native code change, merge or push belongs to this correction.

Physical iPhone/Android PWA/keyboard testing and screen-reader testing were not
performed. Browser engine and viewport simulations do not replace device checks.

### Review content refinement — 12 October 2026

Approved: remove the duplicate Full message section and Rich badge from review.
Desktop Compose and mobile Sheet retain one notification card, optional image,
Watch now/Learn more and destination, plus the exact note: “Appearance varies by
device. Review the full message before sending.” The shared preview's `isExpanded`
state removes the message clamp only during review, so all text remains readable
in the single scrolling body and actions remain pinned. Live editing retains the
four-line illustrative preview. Playground retains one plain-text message/media
summary without the redundant heading or format badge. History format metadata
and queued-result presentation retain their existing defaults.

Existing review checks now assert no repeated message/format label, the retained
note, natural-height message inside the expanded card, wrapped URLs and fixed
actions. Tests use fixture sends/uploads only.

Verified for this refinement: **142 source/component tests passed**, plus the
local Docker build/type/style/PWA checks. Chrome passed at 320/375/414/768/1440px;
WebKit passed at 320/375/768/1440px, both themes, against the rebuilt container.
Both engines passed the six short-screen/landscape confirmation sizes above,
long-message Sheet review and playground review, image failures, busy/rejected
sends, keyboard/focus restoration and Axe checks. Screenshots were reviewed in
`/tmp/nudger-review-clean-chrome` and `/tmp/nudger-review-clean-webkit`. The existing
local tunnel returned HTTP 200. Physical-device checks were not repeated for this
content-only refinement; no real sends/uploads or production deployment occurred.

### History table and mobile cards — 12 October 2026

Approved frontend-only change: `/nudges` shows a desktop table from 960px and
the existing mobile card pattern below that breakpoint. Keep the existing
filters, header/shell, pagination, queued/send journey and theme tokens. Columns:
message, Basic/Rich type, audience, delivered, muted, total clicks, CTR, status,
CTA and media. A completed desktop status reads, for example, `Completed in 6s`;
there is deliberately no separate completion column. Mobile cards expose the same
information through the existing status chip.

`useNudgeHistory` still owns fetching/pagination. `nudgeHistoryPresentation` maps
existing response data once for both views; `NudgeHistoryPanel` owns expanded
message IDs and the selected image. `ExpandableText` reveals long messages in
place. `ImageViewer` reuses `MediaPreview`, `DialogFrame` and `Sheet`; image loading
starts only on demand. The active overlay survives rotation, and the next open
chooses the current viewport. Failure/deletion shows the existing image-unavailable
fallback while message, CTA and delivery details remain readable. Do not infer
expiry from a hardcoded seven-day cutoff: storage cleanup and retention are backend
policy, and a null URL is different from a previously present URL returning 404.

Current source contract: the history API returns saved nightly Rich engagement as
unique-recipient `stats.total_clicks`, one-decimal percentage `stats.ctr`, and top-level
`engagement_as_of`. Both presentations consume those saved values directly and
never derive a rate in the browser. Basic and incomplete/uncalculated Rich remain
**—**; a zero-inbox-audience snapshot is `0` clicks and **—** CTR. Basic also
has no CTA or media. A short note explains the nightly cadence. No backend, schema,
API endpoint or native-app changes belong in this frontend slice.

Failed status is distinct from queued/processing/completed. Completion duration is
shown only for completed sends with valid ordered timestamps. Preserve zero
counts, failed-delivery details, loaded entries during refresh/error, and explicit
retry. Verification covers theme/viewport table-card changes, message expansion,
safe CTA links, absent/deleted media, dialog/Sheet focus, loading/empty/error,
pagination and lifecycle consistency using fixtures only.

Verification for this frontend-only change:

- 146 source/component tests passed, including status/duration/zero-count rules,
  Basic/Rich actions, retained refresh state and expansion across table/card views.
  Required UI/audience checks, CSS ownership, PWA guards, type checks and local
  Docker build passed.
- `test:browser:history` passed in Chrome and WebKit at 320/375/768/1024/1440px,
  both themes, against localhost:5174. Covered initial loading, empty/error/retry,
  all four statuses, absent engagement, deferred media requests, missing/deleted
  images, safe CTA links, full messages, keyboard focus/Escape, background inertness,
  one open viewer through rotation, restored focus and no extra history fetch on
  resize. Axe found no violations in the changed list/viewer surfaces.
- Existing API pagination suite passed at 320/375/768/1440px, both themes, including
  retry/deduplication, creator restrictions, cursor safety and retained scrolling.
  Its obsolete public-footer docs-link assertion now reflects the already-approved
  removal; its fixtures also supply the existing notification capabilities response.
- Existing Chrome composer/playground/confirmation tests passed at 375/1440px,
  both themes, plus long text and the six short/landscape confirmation sizes. The
  shared Sheet now supports an image-specific close label and initializes focus/
  background handling even when mounted already open.
- Mobile shell suite passed at 320/375/390/440/412/768px and 844×390 landscape,
  both themes, plus simulated iPhone/Android safe areas. Screenshot review includes
  `/tmp/nudger-history-final-chrome` and `/tmp/nudger-history-final-webkit`.
  Physical-device/PWA and screen-reader testing were not performed.
- Only the local Nudger container was rebuilt. No backend change, production
  deployment, real send/upload, merge or push was performed. Click/CTR analytics
  remain unavailable until separately added to the backend history response.

### Mobile history card refinement — 12 October 2026

Approved: remove the repeated merchant title from mobile cards. Basic/Rich sits
on the left of the header and status on the right, aligned vertically. Completed
status includes the valid duration (e.g. “Completed in 6s”); missing/invalid timing
falls back to “Completed”. Retain the sent date and full-message disclosure.
Delivery metrics form two rows of three: Audience/Delivered/Muted, then Total
clicks/CTR/Failed deliveries. Failed deliveries displays the existing API count,
including zero, with error emphasis only when nonzero. Remove the separate timing
and failure footer. Keep CTA/media actions and the existing image viewer.

`nudgeHistoryPresentation` supplies the card status/count labels and saved
engagement values from the existing response; `NudgeHistoryPanel` owns the same
state and events. Desktop table markup, filters, pagination, and all unavailable
metric behavior remain unchanged.
Verify both themes at 320/375/768px, aligned chips and six metrics, invalid/missing
duration fallback, zero/nonzero failures, long content, image fallback and resize
to the unchanged desktop table. Use the existing fixture browser suite.

Verified: required UI tests (53), audience tests (10), style/PWA guards, type
checks and local build passed. Chrome and WebKit passed the history fixture suite
at 320/375/768/1440px in both themes against the rebuilt localhost:5174 container.
Checks assert no repeated card title/footer, aligned format/status chips, six
statistics with aligned second-row values, zero/nonzero failures, completed timing,
image deletion fallback, focus/Escape/rotation, full messages, refresh/retry and
unchanged desktop table columns. Axe found no violations in the tested list/viewer
surfaces. Screenshots reviewed under `/tmp/nudger-card-refinement-chrome` and
`/tmp/nudger-card-refinement-webkit`. Physical-device and screen-reader checks
were not performed. All sends/storage were fixtures; no backend or production
deployment was changed.

### Saved engagement metrics — 12 October 2026

The backend history contract now provides saved—not live—engagement for Rich
nudges: `stats.total_clicks` is a unique-recipient integer, `stats.ctr` is a
one-decimal percentage from 0 to 100, and `engagement_as_of` is the UTC snapshot cutoff.
The Nudger client consumes these fields in its one shared history presentation
mapping for both the desktop table and mobile cards. It never divides delivered
counts in the browser.

Basic, uncalculated Rich, and an older API response with no snapshot remain `—`.
A calculated Rich nudge with no inbox audience shows `0` total clicks and
`—` CTR. The small history note explains the nightly cadence; accessible labels
include the snapshot timestamp without adding another visual data row. Invalid
negative, non-finite, out-of-range, partial, or Basic engagement snapshots are
rejected at the typed API boundary.

Verification for this update: `make test`, the style/PWA/typecheck production build,
and the focused Rich suite passed locally. The history browser fixture passed in
Chrome and WebKit at 320/375/768/1024/1440px in both themes, with mocked response
data proving Basic `—`, saved click/CTR rendering, zero-audience CTR fallback,
accessible snapshot labels, resize, image-viewer focus, and no horizontal overflow.
The wider Chromium mobile-shell fixture also passed at 320/375/390/412/440/768px.
No live history data, send, upload, deployment, merge, or backend change occurred.

### Desktop history sizing — 12 October 2026

The desktop table bounds Message to a 30% share with a 240–420px text area,
reserves room for whole metrics/CTR and the existing completion chip, and lets
content-sized columns grow for unusually large counts. Only the table region
scrolls when those columns need more room. Long paragraphs, emoji and unbroken
URLs use the existing full-message disclosure without shifting column alignment.
The mobile branch and shared message/presentation logic are unchanged.

Verified with mocked browser data in Chrome and WebKit at
1024/1280/1440/1728px, both themes: short-only lists, long paragraphs, expanded
messages near the 4096-character limit, unbroken URLs, `13.4%`/`100%`, large counts, and
completed/missing-time/processing/queued/failed statuses. Geometry assertions
check whole metrics, unclipped chips, contained message text and stable columns
after expansion. Existing list/viewer accessibility, focus, resize and recovery
checks pass. Chrome also passed at 320/375/768px; the 375/768px mobile card
screenshots were byte-identical before and after the edit in both themes.
Required UI/audience tests, style/PWA guards, TypeScript and the build passed.

### Reproduce safely

Run `node --test tests/*.test.mjs`, `npm run build`, then start local Vite with
the existing selected env. `npm run test:browser:rich` defaults to localhost:5174.
If Playwright/Axe are only installed in the sibling receiver checkout, provide
`PLAYWRIGHT_MODULE` and `AXE_MODULE` as their absolute entry paths. Optional
`UI_BASE_URL`, `RICH_SCREENSHOT_DIR`, `RICH_VIEWPORTS`, `RICH_HEIGHT` and `BROWSER_ENGINE` select
only the fixture test harness; they do not change app configuration. All API,
storage PUT, thumbnail and destination requests are intercepted.

### Not tested / deliberately unchanged

- Real API/database send-to-inbox integration, Google consent, real R2 CORS/signatures/cleanup, media ownership and expired-upload responses from a live backend. These need the prepared backend branch and locally configured storage; fixtures only prove the frontend contract.
- Real Firebase/APNs/Android Rich notifications, native external-link opening, notification action taps, cold launch, attachment download timeouts and physical-device PWA keyboard/safe-area behaviour. These belong to the later native phase.
- Production configuration, cloud infrastructure, migration, deployment, registry push, pricing/billing and hooks API changes.
- No merge, deployment or real notification was performed in this phase. Browser tests' 202 responses are fixtures, not evidence of delivery.

### Inbox and push snapshots with More stats — 12 October 2026

This approved contract supersedes the earlier direct CTA/media columns and the
old successful-push CTR denominator. Backend receipt/delivery rules are defined
in `../plugnudge-be/docs/inbox-delivery.md`; this task changes frontend presentation only.

- Desktop keeps Message, Type, Inbox audience, Push delivered, Push silenced,
  Total clicks, CTR, Status and Details. Completed status includes its duration
  once; any failed pushes are indicated without inventing a second status.
- Mobile retains the existing cards, format/status header, sent date, expandable
  message and six-metric grid: inbox audience, push delivered, push silenced,
  clicks, CTR and failed pushes. More stats is a 48px action below the metrics.
- `NudgeHistoryDetails` renders one shared body in the existing Sheet or
  DialogFrame/VDialog, chosen at opening and preserved through rotation. It
  shows all seven metrics including device attempts, definitions, the saved
  engagement cutoff, CTA and optional image disclosure. Opening stats does not
  fetch media; only View image does. Missing media never removes stats/actions.
- Prefer `push_delivered`/`push_suppressed`, including zero, over older response
  aliases. Audience/silenced/clicks count users; delivered/failed/devices count
  device attempts. Missing installations alone do not imply silencing. Multiple
  devices may make push totals exceed audience. No frontend aggregation is added.
- Basic and pending Rich engagement show `—`; measured zero is `0`/`0%`, and a
  zero inbox audience has no CTR. Provider success is not phone display proof.
  Percentages use at most one decimal and never split across lines.
- Large mobile counts use compact notation with exact accessible names; details
  retain full counts and deliberately stack exceptionally long values on narrow
  screens. Normal desktop tables fit 1440px; narrower/large-data tables scroll
  within their own region. Messages and status chips retain their established design.
- Stats follow the current history item on refresh and close if it disappears.
  Keyboard dismissal covers the Sheet header as well as its body, including
  immediate reopening. List focus is restored to the current responsive trigger.

Verification: 57 UI, 14 API/pagination, 10 audience, 4 style and 6 PWA tests pass;
TypeScript and production-style build pass. Chrome fixture checks cover
320/375/768/1024/1440px, both themes; WebKit checks cover 375/1440px. Checks include
canonical-only and alias responses, no-device clicks, multiple devices, silenced
preferences, every status, zero/null snapshots, 13.4%/100%, short/long/unbroken
messages, huge counts, expansion/rotation, image expiry, keyboard/focus and Axe.
Screenshots live under `/tmp/nudger-stats-qa` and `/tmp/nudger-stats-webkit`.
No backend/native changes, real sends, production deployment or PR merge.
