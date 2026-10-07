# Plug & Nudge design language

Current UI contract, 7 October 2026. This file owns visual conventions;
[app context](app-context.md) owns product scope and [Vue architecture](vue-architecture.md)
owns shared component/layout behavior. Preserve the existing design, not a new redesign.

## Character

Calm, clear, compact, privacy-first. Neutral surfaces, restrained coral branding,
indigo interaction, readable hierarchy, and purposeful grouping. Use Bento-style
grouping for related insights; do not turn notification history into a multi-column
desktop dashboard. Mobile should feel app-like through clear actions, touch targets,
fixed bottom navigation and focused sheets, not through duplicated business logic.

## Colour roles

| Role | Value | Use |
| --- | --- | --- |
| Primary | `#FF6B4A` | Logo, restrained brand highlights and established primary CTAs |
| Secondary / hover / selected | `#4338CA` | Interactive states, pills, selected navigation, focus accents |
| Light background and surface | `#FFFFFF` | Same base on page, app bar, navigation and cards |
| Dark background and surface | `#171B25` | Same base on page, app bar, navigation and cards |
| Light surface variant | `#F0F1F6` | Deliberate secondary grouping, not a different page background |
| Dark surface variant | `#222735` | Deliberate secondary grouping |
| Light foreground / muted | `#1B1D26` / `#666A78` | Text hierarchy |
| Dark foreground / muted | `#F5F7FB` / `#A8ADBC` | Text hierarchy |
| Dark interactive foreground | `#B5AEFF` | Readable text/focus accent on dark neutral surfaces |

`#4F46E5` is not the current secondary colour. Semantic success/warning/error/info
come from Vuetify's theme, never from arbitrary local replacements:

| Status | Light | Dark |
| --- | --- | --- |
| Success | `#15803D` | `#4ADE80` |
| Warning | `#B45309` | `#FBBF24` |
| Error | `#C2413C` | `#FB7185` |
| Info | `#2563EB` | `#60A5FA` |

`src/plugins/vuetify.ts` configures Vuetify's semantic tokens. `main.css` owns custom
selectors and `--app-*` aliases. Keep their brand values synchronized; use
`rgb(var(--v-theme-…))` for theme-aware surfaces/text. Selected indigo fills need
contrasting white text/icons, especially dark bottom navigation. Do not apply
indigo text over an indigo selection. Status must also use text/icon cues.

## Styling ownership: CSS, not HTML

- All app-authored CSS lives in `src/styles/main.css`, imported once by `src/main.ts`.
- No `style="…"`, `:style`, `v-bind:style`, style objects hidden in `v-bind`, `<style>`
  blocks in HTML/Vue, or scoped SFC CSS. Bind semantic classes for state/variants.
- No direct DOM `.style`, `cssText`, `setAttribute('style', …)` or injected CSS rules.
- Static SVG presentation (fill/stroke/vector-effect) belongs in CSS. SVG geometry
  (`viewBox`, paths, coordinates, radii) is chart data and stays in markup/state.
- `color="secondary"`, `variant`, `size`, drawer width and other supported component
  props are Vuetify's API, not embedded CSS. Keep them where needed for component
  behavior and layout bookkeeping; do not scatter custom literal colours in props.
- Vuetify generates runtime inline geometry and a theme stylesheet. These are
  library-owned, not authored HTML styling. Do not strip them or modify vendor code:
  overlays, drawer offsets, tab sliders and theme switching depend on them.
- Sheet drag/keyboard adaptation currently uses Web Animations for continuously
  measured pointer/visual-viewport geometry. This writes no HTML style attribute.
  Keep this small lifecycle-cleaned behavior; do not use it for static decoration.
- Browser metadata such as `<meta name="theme-color">` is not inline CSS.
- Use existing component/UI-role names and BEM-style classes, not route-specific
  copies of a shared header. Do not hand-create Vuetify's internal markup.

`npm run test:styles` checks authored templates, SVG presentation, style blocks and
direct style APIs. It also guards brand/theme agreement and runs before every
production build. Runtime framework styling is intentionally outside that source check.

## Identity, type, spacing and motion

- `public/nudge.png` is the supplied brand asset. Reuse `BrandLogo` for the app mark;
  favicon and Apple touch icon use the same asset. Do not substitute an icon glyph.
- Merchant avatars use the merchant image transparently with the existing fallback.
  Do not put a coloured tile behind transparent logos. Camera controls are separate.
- Preserve the current Inter-first/system sans-serif stack and monospace for tokens
  and code. Do not add a new web-font dependency for a local styling edit.
- Use the existing 4/8-point spacing rhythm, `--app-radius` (20px), subtle borders,
  and soft shadows. Round pill tabs/navigation including hover and selected areas.
- Standard filter pill: 52px tall, max 264px wide, at least 48px tap targets. Keep
  labels readable; never achieve compactness by shrinking hit areas below 48px.
- Mobile bottom nav: 56px normally, 52px compact during scroll, subtle glass surface,
  16px side insets and 8px bottom gap plus safe area. Shrink without sliding it away.
- Use short purposeful transitions and respect reduced motion/forced colours.
  Preserve the opaque fallback for unsupported blur or reduced transparency.

## Shared structure and feedback

Desktop: sidebar and main content; no app-bar header. Sidebar keeps the theme
shortcut. Mobile: no sidebar/drawer, no app-bar theme/profile controls; centred
logo bar scrolls away. Bottom nav is Audience, Nudges, API token (platform only),
then Profile avatar. Appearance settings are Light/Dark/System, with System default.

Every workspace route reuses AppShell → PageLayout → PageHeader + VWindow. Filters
remain sticky while the logo/header scrolls. Windows are transparent and borderless;
cards own their borders. History uses one card per row on mobile and desktop.
Do not rebuild the page frame when filters change or requests fail.

All operation success/error feedback uses the one shared SnackbarHost. Top-right,
20 seconds, manual close, timer paused on hover/keyboard focus, one queued message
at a time. Keep notices reachable inside modal focus boundaries. Field validation
stays beside inputs; loading/empty/completed workflow panels remain in context.

## Verification

Run style guards, UI/audience tests and build; verify affected journeys in the real
browser at 320/375/768/1440px in light/dark. Check keyboard access, 48px controls,
200% zoom/reflow, safe areas, reduced motion, stable shared layout and error recovery.
Use mocked data only. `npm run test:browser:styles` checks chart CSS and geometry
after moving presentation out of markup. See architecture docs for other browser suites.
