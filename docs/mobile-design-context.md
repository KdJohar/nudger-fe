# Nudger mobile-native refinement contract

The finalized Nudger design is shared between desktop and mobile. Responsive
rules change behavior and density, not routes, API contracts, permissions, card
hierarchy, navigation destinations, brand colors or feature state. The receiver
Nudgee context informed the viewport/gesture rules; its inbox, subscription and
pull-to-refresh features do not belong in this sender workspace.

## Viewport and scroll ownership

- Keep `width=device-width, initial-scale=1.0, viewport-fit=cover`. Never add
  `user-scalable=no`, maximum-scale restrictions or global touch preventDefault.
- At Vuetify `smAndDown` (below 960px), AppShell adds `app-shell--mobile`.
  Central CSS locks html/body/#app only while that class is present, fixes the
  body and uses `100vh` followed by `100dvh` for the bounded shell.
- Mobile has no top app/brand bar or reserved toolbar height. Shared page
  controls start below the top safe area, above `page-layout__window`. Audience
  and Nudges visually hide their heading/description row while retaining the
  same accessible h1 and layout IDs. Other workspace headings remain visible.
  The window alone owns vertical content scrolling, momentum and overscroll.
- Header, window and navigation remain mounted across all five workspace routes.
  Page navigation resets internal scroll; filtering and loading retain the offset.
  Bottom-nav compaction listens to that window and clears after idle/navigation.
- Keep safe-area clearance at all four edges, including bottom navigation, FAB,
  last content row and sheets. Content padding also clears the floating send
  action on the history route. Short landscape screens reduce header spacing.
- Public marketing, onboarding and pending review retain document scrolling.
  Sign-in uses a separate bounded welcome surface, neutral branding and an
  indigo Google pill matching Nudgee; short screens omit decorative examples.
  Workspace desktop behavior/styles are unchanged.

## Density without redesign

- The shared PillTabs `mobileCompact` variant matches Nudgee: a 32px visual track,
  30px selected pill and 11px labels inside a 48px interactive row. Keep labels
  visible at 320px and retain indigo/white selection and keyboard focus. Audience
  keeps 7/30/90 days; Nudges keeps Broadcast/Transactional and creator restrictions.
- Noninteractive status/badge chips use a 24px surface and 11px labels. Do not
  use that smaller height for interactive chips or buttons.
- Shared mobile card/panel padding is 16px; metric cards use 14px/12px padding,
  26px values and tighter grid gaps. Preserve card shapes, charts, selected colors
  and content ordering. Profile link rows remain at least 56px tall.
- All actions and navigation retain 48px touch targets, accessible names,
  keyboard selection and visible focus. Inputs stay at least 16px to avoid iOS
  focus zoom. Use the existing light/dark/System theme state and motion fallbacks.
- CSS lives only in `src/styles/main.css`; no copied mobile trees or stylesheets.

## Sheets and keyboard

Preserve Sheet's visualViewport handling, zoom-scale guard, inert background,
heading focus, trigger-focus restoration, independent body scrolling and
busy-dismiss protection. Only its handle/header drags. The footer stays inside
the sheet's viewport, with bottom/side safe areas. Do not turn sheet gestures
into document handlers or cache private API data.

## Verification

Run the required styles, UI, audience and production build checks, plus
`npm run test:browser:mobile` with Vite running and Playwright/Chrome installed.
It uses mocked APIs only and checks all five routes at 320/375/414/768px, short
844px landscape, both themes, frame overflow, actual content scrolling, absent
app bar, accessible compact headings, filter offsets, final-row clearance, deep-link reload, focus, reduced
viewport sheets, resizing and public-page scrolling. Existing navigation and
style browser suites still cover contrast, keyboard and creator restrictions.

`PLAYWRIGHT_MODULE` may point to an installed module; `UI_BASE_URL` overrides the
preview URL. `MOBILE_NATIVE_ARTIFACT_DIR` selects screenshot output (default
`/tmp/nudger-mobile-native`). Before an edit, run the browser script with
`--capture-desktop` to record the geometry/computed styles of all five 1440px
routes in both themes; its next normal run compares the unchanged desktop.

Browser automation cannot prove physical Safari keyboard/gesture behavior or
Home Screen installation. Before release, check iOS Safari browser/standalone
and Android Chrome installation, safe areas, keyboard, pinch/accessibility zoom,
sheet drag/Escape/focus restoration and reduced transparency on real devices.
