# Plug & Nudge frontend instructions

Read `docs/app-context.md`, `docs/design-language.md`, `docs/vuetify-component-context.md`, and `docs/vue-architecture.md`
before changing Vue layouts, routes, components, or CSS. Read `docs/api-client.md`
before changing frontend requests. Update the owning context document when an
approved product/design rule changes; keep README as the entry point.
Read `docs/mobile-design-context.md` before mobile shell, density or gesture work.

## Scope and stack

- This is the authenticated **Nudger** Vue 3 / TypeScript / Vuetify SPA, not Nudgee.
- Work in this repository only. Do not use the separate Material UI project as a reference.
- Keep backend contracts, permissions, and API endpoints unchanged unless explicitly authorized.
- Use Composition API with `<script setup lang="ts">` and the existing Vuetify/theme system.
- Preserve unrelated user changes. Check Git availability/status before branch or commit work; do not initialize Git automatically.

## Non-negotiable workspace structure

- `AppShell.vue` owns persistent navigation and exactly one `PageLayout.vue`.
- `PageLayout.vue` owns exactly one `PageHeader.vue`, `VWindow`, and content container.
- All authenticated workspace routes use this same frame: Audience, Nudges, Compose, Profile, API Token.
- The shared header renders `<header class="header">`. Its title, metadata, actions, and filter markup are shared.
- `PillTabs.vue` is a selection control only. It must not create a content window.
- Only the routed body inside `v-window__container` is replaced during navigation.
- Never key/remount AppShell, PageLayout, PageHeader, or VWindow by route or filter.
- Route bodies must not create page-level headers, tabs, main containers, page padding, or additional windows.
- Route-specific title/description/action defaults belong in `src/data/workspacePages.ts`.
- Reactive metadata/filter bindings use `usePagePresentation()`; data fetching stays in feature composables.
- Keep creator-only broadcast restrictions. Do not add fake filters to unfiltered routes.
- Public, sign-in, onboarding, and pending-review layouts remain intentionally separate. The profile manager may render its own header only outside workspace profile mode.
- Old unrouted demo views are not examples for new workspace pages.

## Styling and reuse

- All application styling belongs in `src/styles/main.css`. No inline `style`, template style bindings, or new SFC style blocks.
- Move static SVG presentation into CSS too; keep chart coordinates/path data in markup. Do not inject styles from application JavaScript.
- Vuetify's generated theme styles and runtime geometry are library-owned exceptions, not permission for app-authored inline CSS. Preserve documented component APIs and pointer/viewport behavior.
- Share components **and** their DOM structure, not just comma-separated CSS selectors that imitate each other.
- Header rules use `.page-layout .header__*`; do not introduce page-specific header classes such as `ui-insights__header`.
- Let Vuetify generate `v-slide-group__container`, `v-slide-group__content`, and `v-window__container`; never hand-create those classes to imitate its markup.
- Brand primary: `#FF6B4A`, used sparingly. Secondary/interactive accent: `#4338CA`.
- Background and surface match: light `#FFFFFF`, dark `#171B25`. Appearance defaults to System; keep transparent merchant avatars and the supplied `nudge.png` brand mark.
- Shared success/error snackbars stay top-right for 20 seconds with manual close and hover/focus pause. Keep field validation beside inputs.
- Keep light/dark themes, 48px tap targets, keyboard focus, reduced-motion support, and mobile safe areas.
- Do not change navigation, body cards/charts/forms, or unrelated responsive layouts as a side effect of header work.

## Verification

- Run `npm run test:styles`, `npm run test:ui`, `npm run test:audience`, and `npm run build`. Build also enforces style ownership.
- Structure tests must assert persistence of header/window elements across all five workspace routes.
- Test initial/default filters, repeated selections, route cleanup, metadata updates, and creators without filters.
- Check 375px, 768px, 1440px (plus 320px reflow), both themes, sticky filters, keyboard controls, and route navigation.
- Never send a real nudge, rotate/create a token, edit a profile, or modify server data just to test layout.
