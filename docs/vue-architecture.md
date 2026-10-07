# Vue workspace architecture

Accepted: 6 October 2026, following the user's confirmation of a persistent, identical page frame.

Companion context: [app scope and journeys](app-context.md), [design language and CSS ownership](design-language.md),
and [API client conventions](api-client.md). This document owns layout/component
structure; the design guide owns colours, styling rules and visual behavior.
The [shared Vuetify component context](vuetify-component-context.md) catalogs the
current component library, defaults and cross-application reuse rules.

## The rule

Reuse the whole structure, not merely the visual appearance. Every authenticated workspace page has the same layout and header. Titles and filter options change as data; only the routed body changes structurally.

```text
AppShell
  Sidebar / mobile app bar
  Main > Container
    PageLayout                         persistent
      PageHeader <header class="header">
        header__content
          header__copy
          header__metadata
          header__actions
        header__filters
          PillTabs
            Vuetify slide-group container/content
      VWindow                          persistent
        v-window__container            persistent
          VWindowItem                  persistent
            RouterView > route body    changes here
  Mobile bottom navigation
```

The desktop app bar remains removed. This is a shared **page header inside main content**, not a replacement global navigation bar.

## File ownership

| Location | Responsibility |
| --- | --- |
| `src/layouts/AppShell.vue` | Navigation, theme, authenticated frame; renders PageLayout outside RouterView. |
| `src/components/ui/PageLayout.vue` | Shared section, stable heading/panel IDs, PageHeader, single VWindow and routed slot. |
| `src/components/ui/PageHeader.vue` | One header structure for titles, descriptions, metadata, badges, actions, and filters. |
| `src/components/ui/PillTabs.vue` | Accessible selection control; emits a value, performs no requests and owns no body/window. |
| `src/types/pageLayout.ts` | Typed definitions for page presentation, filters, metadata, and actions. |
| `src/data/workspacePages.ts` | Static route titles, descriptions, badges, and navigation actions. |
| `src/composables/usePageLayout.ts` | Shell-scoped typed presentation bridge, selection validation, ownership-safe cleanup. |
| `src/views/` and feature components | Render the current body; compose feature state and reusable UI. |
| `src/composables/useAudienceOverview.ts`, etc. | Feature state, API loading, stale-response protection, lifecycle cleanup. |
| `src/lib/` | Typed API adapters and pure utilities. |
| `src/styles/main.css` | All styling, tokens, responsive rules, focus and motion behaviour. |

## Add or change a workspace page

1. Add its lazy child route under AppShell in the router.
2. Add a title and short description under that route name in `WORKSPACE_PAGES`.
3. Render only body content in the view. Do not add another header, `page-view` wrapper, PillTabs, or VWindow.
4. Keep API requests and selected filter state in the existing feature composable/controller.
5. If needed, call `usePagePresentation(() => ({ filter, metadata, badge }))` once from the active route's controller. Read reactive values inside the getter.
6. Supply filter items, selected value, label, and an `onSelect` handler that updates the existing ref. Never make a duplicate API request from the header.
7. Extend the shared primitive for a new header capability rather than creating a page-specific header variant.

Examples: Audience binds its existing period ref; Nudges binds its nudge-type ref. Profile supplies neutral account/capability chips through `badges` alongside its active/pending `badge`. Compose's history link and Token's platform badge come from static page definitions. Header chips remain informational and wrap within the shared `header__actions`; no route-specific header is needed.

## Lifecycle and SPA behaviour

PageLayout provides an instance-scoped injection context. There is no module-global mutable page state.

Each registration records its route key and an ownership token. A route change immediately ignores old presentation data, even before the old body finishes unmounting. Disposing an old registration cannot erase a newer one. Late API responses cannot restore an obsolete header.

Changing a filter updates the feature ref and existing body in place. It does not remount the page, create multiple copies of charts/history, or duplicate requests. Navigating replaces only the RouterView content.

Filter refreshes must retain already-loaded content until the new result arrives, as Audience and Nudges do. Full skeletons are for initial loading only: replacing a long list with short placeholders collapses document height and resets browser scroll. Announce refreshes with a live status and `aria-busy`; disable pagination while loading or showing a failed refresh so a previous filter's cursor cannot be used. Test scroll position in the real browser, not just component persistence.

Routes without filters keep the same header/filter wrapper and control component, but the wrapper is hidden and has no tab items. Do not fill empty space with fake tabs.

## Vuetify and accessibility

The `items` prop on the installed Vuetify VTabs automatically creates a sibling content window. Because PageLayout owns the only window, PillTabs instead iterates its own typed items in VTabs' default slot. Do not reintroduce `items` on the internal VTabs and accidentally create another window.

Tabs point to the layout-owned panel. The panel is labelled by the selected tab when filters exist; otherwise it is a region labelled by the page heading. IDs originate in the persistent layout and must remain unique.

Keep a single h1, 48px targets, visible keyboard focus, reduced-motion handling, and native Vuetify tab keyboard behaviour. Hidden filters must not enter the focus order.

## CSS and layout

All authored rules live in `src/styles/main.css`; template classes select those
rules. No inline CSS, SFC style blocks, direct DOM styling or static SVG presentation
attributes. Preserve library-generated Vuetify styles and data-driven SVG geometry;
see the explicit boundaries in [design language](design-language.md).
`npm run test:styles` enforces this contract during every production build.

Use `header` and `header__*` consistently, scoped beneath `.page-layout` in main.css. Header structure never depends on the route.

The semantic header uses `display: contents` so its filter row can remain sticky within the full page rather than being constrained by a short header box. The heading scrolls normally; filters stick at the viewport top on both mobile and desktop, without a reserved fixed-header gap.

The mobile logo bar uses Vuetify's absolute layout mode: its initial space remains reserved, but it scrolls away with the document and returns only when the user scrolls back to it. Do not substitute hide-on-scroll behavior that reappears over the sticky filters. Desktop has no app bar; mobile bottom navigation remains fixed. Verify scroll-down, scroll-up, route changes, and breakpoint resizing in the browser when changing this behavior.

Mobile navigation uses the same `smAndDown` breakpoint everywhere. The sidebar is
mounted only on desktop; mobile has no drawer, More action or app-bar theme button.
`NAVIGATION_ITEMS` supplies mobile order independently of desktop order: Audience,
Nudges, API token (platform only), Profile avatar last. `Avatar` renders the current
merchant image transparently, with a user-icon fallback for missing/broken images.
Its enclosing router link supplies the Profile name and current-page state. Keep
the shared shell mounted across routes and retain the Nudges FAB for broadcasting.
Mobile appearance controls live in Profile Settings. The mobile-only logout button
follows Settings and delegates to the profile manager's existing logout flow.
The editor confirms unsaved changes before session cleanup; cancelling must retain
the session and draft. Prevent logout during saves/uploads and duplicate requests,
then replace the route with login even when server logout fails.

The page frame owns width and margins. Content windows are transparent and borderless. Individual body cards may have their own borders; do not style the window as another card.

Use one responsive DOM tree and existing theme tokens. Never hard-code separate Audience/Nudges header spacing or duplicate mobile page layouts to solve a CSS difference.

## Boundaries

Public pages, Google sign-in, onboarding, and pending-review screens have separate layouts. The shared profile manager renders its local introductory header only in onboarding/pending mode; the authenticated profile uses the persistent PageHeader.

The introductory header owns one shared logout icon for onboarding and pending review. It uses the existing `useAuth().logout()` action, prevents duplicate clicks or sign-out during a profile save, and replaces the route with `/login` after local session cleanup, including when server logout fails. Keep this action outside the form; it must not submit profile details. Workspace navigation remains unchanged.

Onboarding composes `MerchantProfileSetup` only when the manager's mode is `onboarding`. Its `ChoiceCards` and `AvatarPicker` primitives own accessible selection and local preview behavior; account-type copy and public-link field definitions live in `src/data/merchantProfile.ts`. The form emits the existing typed profile payload and selected file to the manager, which keeps API save/upload and approval routing.

Workspace profile mode composes `MerchantProfileDetails`: one Public profile card containing identity/avatar, About and public links. Account type/capabilities are read-only shared header chips rather than a body card. It adds no page header or navigation frame. Its image selection and pending review both use the manager's `handleImageReplacement`, which calls the existing `updateProfileImage` action. The temporary preview clears on completion so failures restore the last saved image. `AvatarPicker` provides a label slot for identity content while retaining its accessible button label, hints, validation and status messages. Avatar image containers must stay transparent in onboarding, pending and profile; only the separate camera action has a coloured background. Never create a real profile or upload an image merely to test the UI.

Feature forms, API contracts, notification delivery, authentication, and navigation behaviour are outside a page-frame refactor. Preserve them.

### Public profile editing

Profile body changes approved 7 October 2026: `MerchantProfileDetails` combines
identity/avatar, About and links in one Public profile card, and opens
`MerchantProfileEditor` inline for About and the six public links. One responsive
form, no new shell/header/window. Creator/Platform and capabilities are supplied
by `ProfileView` to the shared header; creators never get a Transactional chip.
`useMerchantProfile.updateProfileDetails` owns session-authenticated PATCH and shared
state synchronization; image uploads remain separate. `profileDetails.ts` owns the
editable whitelist, normalization, partial-patch/null semantics, URL/Unicode validation
and microsecond revision comparisons. Session refresh cannot overwrite newer saved
profile data. The editor owns its draft, inline errors, save/discard state and unsaved
navigation/close guards. Failure never discards typed text or reports success.

About is optional plain text (500 Unicode characters), exposed by the public merchant
API. Display name/handle/type/approval remain read-only. Only changed fields are sent;
blank fields become null. Keep controls clear of bottom navigation, retain 48px targets,
transparent avatars, existing themes and all styling in main.css. Test only mocked
profile requests in browser checks; never edit real merchant data for layout testing.

### Appearance settings

`ProfileView` places `AppearanceSettings` below the public profile. It reuses the
native radios in `ChoiceCards` with the compact `inline` variant; onboarding's
default cards and API access's existing compact cards remain unchanged.
Settings apply immediately and must not save, submit or discard profile drafts.

`App` installs `provideAppTheme` once. `useAppTheme` injects that app-owned state
into the profile selector and desktop sidebar shortcut. `lib/appTheme.ts`
separates the saved preference (`light`, `dark`, `system`) from the resolved theme
(`light`, `dark`). No saved preference means System; preserve explicit legacy
Light/Dark choices. System follows live OS changes; a shortcut explicitly selects
Light or Dark. Remember choices in browser storage, synchronize across tabs, and
remain usable if storage is blocked. One media listener/storage listener per app,
cleaned up on disposal. No backend calls, duplicate theme state or new page shell.

## Regression checks

### Shared feedback

`App` installs `provideSnackbar` and one `SnackbarHost`. Use `SnackbarFeedback`
to bridge existing error/success state, or `useSnackbar().show` for discrete
events. Never add page-specific `v-alert` banners for operation outcomes. Keep
field validation next to its input, loading states near their content, and
completed workflow/result panels intact. API adapters and composables must not
create a second toast system or couple transport failures to visual components.

The app-owned queue shows one notice at a time. One feedback source updates its
existing notice; clearing that source resolves it. Route-bound errors and retry
callbacks are removed on disposal; success notices can survive redirects. All
notices close after 20 seconds or through the close button; hover or keyboard
focus pauses dismissal. Dismissal never retries a send.
Keep recovery controls on the relevant page even after an error is dismissed.

The host announces errors assertively and successes politely without stealing
focus. It attaches inside the top active Vuetify dialog so controls stay inside
the modal focus boundary (including sheets that make the app root inert). Notices
stay at the viewport's top-right on every route, including dialogs; mobile notices
fit the viewport and respect safe areas. Use only
main.css for styling, 48px controls, both themes and reduced-motion support.
Do not put credentials, request bodies or personal data in notification text.

`npm run test:snackbar` covers queue/source lifetimes and repeated messages.
`npm run test:browser:snackbar` checks actual Vuetify feedback, retry, dismissal,
timing, keyboard/modal access and responsive positioning with mocked APIs only.

### Mobile landing actions

`PublicLayout` mounts `PublicEntryActions` only on the home route at the shared
`smAndDown` breakpoint. It restores the existing `useAuth` session without blocking
landing content. Until restoration completes, the dock shows a neutral loading
message; it must not briefly offer onboarding to an existing merchant.

`ActionDock` is a presentation primitive with typed route actions. Signed-in users
with a submitted profile (active or pending) get one `/nudges` link. Existing
approval guards still send pending merchants to `/pending`; this UI does not grant
workspace access before approval. Visitors and signed-in users without a profile
get two actions: app availability at `/#get-app` (coming soon) and Start sending at
`/login` or `/onboarding`, respectively. No new token, profile or auth API is added.
Desktop and other routes do not render this dock. Reserve bottom/safe-area space so
footer content remains reachable; style the shared primitive only in main.css.
`npm run test:browser:public-actions` checks these account states with mocked APIs,
session restoration without incorrect CTA flashes, scrolling, coming-soon links,
footer clearance, light/dark reflow and mobile/desktop breakpoint changes. It uses
the same Playwright environment as the navigation checks; `PUBLIC_SCREENSHOT_DIR`
optionally saves local previews.

### Broadcast composer body

The Nudges FAB uses the same Vuetify `smAndDown` breakpoint as AppShell: mobile opens the existing composer sheet; desktop is a router link to `/compose`. Keep one FAB, preserve its appearance and use SPA navigation without reloading the shell.

`ComposeNudgeView` composes `BroadcastComposer` inside the unchanged workspace frame. The body groups sender identity, a live preview and a short message field in one responsive panel. Mobile uses a cropped lock-screen preview above the editor; wider screens show a compact phone alongside it. `NotificationPreview` owns the live client clock and supports an opt-in `adaptive` variant; its default remains unchanged for the existing sheet.

`BroadcastComposer` and `NudgeComposerSheet` share `useBroadcastComposer` for validation, the reviewed message snapshot, duplicate-send protection and queued/error state. Both use `MessageField` for labels, counting, validation hints and input focus. No draft is persisted. The existing session-authenticated broadcast endpoint and permissions remain unchanged. A queued response is not delivery confirmation; link to history and retain the draft after a failed send. Do not automatically resend. Verify confirmation, focus restoration, failure recovery, long messages, both themes and mobile/desktop with mocked requests only.

### API access body

`TokenView` composes `TokenCredentials`, `NudgeApiPlayground`, and `NudgeApiReference` inside the existing page window. The platform-only route guard and navigation filter remain in the router and AppShell. `useApiToken` owns token loading/create/rotate/copy state; secrets stay in memory, start masked, and reset to masked after replacement. `useNudgeApiPlayground` owns the draft, validation, reviewed payload snapshot, one-shot send, and response. `CodeBlock` is the shared selectable/copyable code primitive. All styling stays in main.css.

The typed send adapter uses the merchant Bearer token directly for `POST /v1/app-nudger/nudge/send`; it must never use session refresh or automatically retry a send. The contract is a 1–4096 character message, broadcast/transactional type, and a required six-digit numeric Nudge ID only for transactional requests. A 202 means queued, not delivered. Network uncertainty must direct the user to history before retrying. Use mocked responses for browser verification; never send real notifications or rotate real tokens for UI tests.

All five request languages declare `NUDGE_API_TOKEN` locally and use it in the Bearer header. The token card and example share `useApiToken`'s single visibility state via `TokenView`; either eye button toggles both. The display string contains only the mask until revealed. `CodeBlock.copyCode` holds the separate full example in memory for explicit copying; never bind it to a DOM attribute or hidden text node. Successful creation/rotation updates both examples and resets masking; failed changes keep the existing credential. Copy and reveal are disabled while credentials are changing or unavailable. Without a token, show the create/load prompt instead of a dummy credential. Never persist generated snippets or reveal state.

- `npm run test:compose`: shared message field semantics, broadcast validation, immutable confirmation, duplicate prevention, error recovery and late-response cleanup.
- `npm run test:api-access`: validation, safe examples, merchant authentication, confirmation, duplicate-send prevention, cancellation, async cleanup, and token masking lifecycle.
- `npm run test:profile`: public editor/partial update behaviour, header capabilities, compact body, System default, OS/storage changes, shortcut synchronization and listener cleanup.

- `npm run test:ui`: real Vue component lifecycle/contract tests with third-party render stubs, presentation ownership and structural guards.
- `npm run test:audience`: chart geometry and loading/error/race-condition tests.
- `npm run build`: full TypeScript project check and production build.
- Browser checks: all five routes; matching header/window hierarchy; 320/375/768/1440 widths; light/dark; sticky filters; keyboard selection; creators without filters; no duplicate h1 or content windows.
- Confirm actual Vuetify behaviour in-browser: the unit render stubs do not prove its layout, keyboard handling, or generated DOM.
- `npm run test:browser:navigation`: with Vite running and Playwright/Chrome available,
  verifies mobile selected/hover/focus colours, touch selection, avatar fallbacks,
  creator/platform navigation, composer access, logout/draft protection, target sizes,
  persistent navigation and responsive desktop switching using mocked API data.
  `UI_BASE_URL` overrides the local URL; `PLAYWRIGHT_MODULE` can point to an existing
  Playwright module. Optional `NAV_SCREENSHOT_DIR` saves navigation screenshots.
  The dark bottom bar scopes `--ui-button-interaction-color` to white: the global
  button hover/focus rule must consume this override rather than paint purple text
  on its purple selection background. Light mode and desktop retain their defaults.
