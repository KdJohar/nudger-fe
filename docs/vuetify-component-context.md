# Plug & Nudge — shared Vuetify component context

Use this reference when building another Plug & Nudge application or extending
this frontend. It records the components and design choices used in `nudger-fe`
as of 7 October 2026. Share the visual primitives and interaction rules across
applications; keep each application's routes, permissions and feature state separate.

## Source of truth

| Concern | Owning source |
| --- | --- |
| Theme colours, icon set and Vuetify defaults | [`src/plugins/vuetify.ts`](../src/plugins/vuetify.ts) |
| Authored styles, responsive geometry, focus and motion | [`src/styles/main.css`](../src/styles/main.css) |
| Reusable visual components | [`src/components/ui/`](../src/components/ui/) |
| Appearance preference and resolved theme | [`src/lib/appTheme.ts`](../src/lib/appTheme.ts), [`useAppTheme`](../src/composables/useAppTheme.ts) |
| Persistent workspace layout | [Vue architecture](vue-architecture.md) |
| Visual rules and CSS ownership | [Design language](design-language.md) |
| Product scope and role-specific journeys | [App context](app-context.md) |

This is an implementation reference, not a second independent theme. When a design
decision changes, update its owning source and these references together.

## Framework and design character

Vue 3, TypeScript, Composition API (`<script setup lang="ts">`), Vue Router and
Vuetify 3 form the SPA. Icons use the **MDI** set through `@mdi/font` and
`vuetify/iconsets/mdi`. Vuetify is the component layer; Tailwind and official
Material Web are not part of this implementation. Use the repository lockfile
for reproducible dependency versions.

The visual language is calm, compact and neutral: restrained coral branding,
indigo interactions, rounded controls, subtle borders and clear text hierarchy.
Group related insights in a Bento grid, but keep linear forms and history lists
linear. Mobile should feel like an app through reachable actions, stable navigation,
compact controls and focused sheets.

## Colour contract

| Semantic role / Vuetify key | Light | Dark | Use |
| --- | --- | --- | --- |
| `primary` | `#FF6B4A` | `#FF6B4A` | Supplied brand mark and restrained brand accents |
| `secondary` | `#4338CA` | `#4338CA` | Selected controls, interaction, send/save actions |
| `background` | `#FFFFFF` | `#171B25` | Page background |
| `surface` | `#FFFFFF` | `#171B25` | Cards and navigation; matches background |
| `surface-variant` | `#F0F1F6` | `#222735` | Intentional secondary grouping |
| `on-background`, `on-surface` | `#1B1D26` | `#F5F7FB` | Main text |
| `on-surface-variant` | `#666A78` | `#A8ADBC` | Supporting text and inactive controls |
| `success` | `#15803D` | `#4ADE80` | Successful outcomes, positive metrics |
| `warning` | `#B45309` | `#FBBF24` | Attention and pending states |
| `error` | `#C2413C` | `#FB7185` | Failures, invalid fields, destructive meaning |
| `info` | `#2563EB` | `#60A5FA` | Informational states |

Hover and selected states use **secondary `#4338CA`**, not coral or the older
`#4F46E5`. On filled indigo selections, use white text/icons (`#FFFFFF`) in both
themes. Dark neutral surfaces use `#B5AEFF` where an indigo text/focus accent would
be difficult to read. This is a foreground adaptation, not a replacement secondary.
Do not use colour alone to explain status or selection.

Current CSS aliases and geometry:

| CSS property | Current value |
| --- | --- |
| `--app-primary` | `#FF6B4A` |
| `--app-primary-hover` | `#4338CA` |
| `--app-secondary`, `--app-secondary-hover` | `#4338CA` |
| `--app-border` | `rgba(116, 125, 151, 0.16)` |
| `--app-radius` | `20px` |
| `--app-shadow` | `0 14px 42px rgba(32, 38, 58, 0.07)` |

Vuetify also configures `border-color` as `#E4E6EE` / `#2A3040` in light/dark.
These theme variables are distinct from the custom translucent `--app-border`.
Use `rgb(var(--v-theme-surface))` for custom surfaces and
`rgb(var(--v-theme-on-surface))` for text. Use `rgba(var(--v-theme-secondary), 0.06)`
for a subtle interactive tint. Custom CSS uses `var(--app-secondary)` for the
shared accent. Avoid literal hex colours in new component templates.

Appearance is **System by default**, with explicit Light/Dark choices stored
locally. One app-owned theme state resolves the preference, follows OS changes
in System mode and synchronizes tabs. Vuetify's bootstrap `defaultTheme: 'light'`
is not the user's default preference. Do not create separate page theme state.

## Vuetify defaults used here

| Component | Registered defaults | Application convention |
| --- | --- | --- |
| `VBtn` | `rounded: 'lg'`, `elevation: 0` | Send/save controls explicitly use `rounded="pill"`; icon actions use `rounded="circle"` and an accessible name |
| `VCard` | `rounded: 'xl'` | Custom cards often use semantic HTML and `--app-radius`; apply the same neutral surface/border language |
| `VTextField` | `variant: 'outlined'`, `density: 'comfortable'`, `rounded: 'lg'` | Visible labels, field-specific errors and readable mobile inputs |
| `VSelect` | `variant: 'outlined'`, `density: 'comfortable'`, `rounded: 'lg'` | Use only for actual selection tasks; filters use the shared pill control |

`VTextarea` and other components do not inherit these field defaults automatically.
Inspect the existing feature usage and set supported props explicitly when needed.
A typical action is `<v-btn color="secondary" rounded="pill">Save changes</v-btn>`;
custom sizing and decorative styling belong in CSS.

## Vuetify components in current journeys

| Components | Current responsibility / convention |
| --- | --- |
| `VApp`, `VMain`, `VContainer` | App layout and main content; the workspace shell owns them |
| `VNavigationDrawer`, `VList`, `VListItem`, `VDivider` | Desktop sidebar and route links; drawer width is 272px |
| `VAppBar`, `VAppBarTitle` | Not rendered in the workspace; mobile controls start below the safe area |
| `VBottomNavigation`, `VBtn` | Mobile pill navigation, with rounded hover/selected regions |
| `VTabs`, `VTab` | `PillTabs` filtering; icons optional, `slider-transition="grow"` |
| `VWindow`, `VWindowItem` | Single persistent content region owned by `PageLayout` |
| `VChip`, `VIcon` | Compact role/capability/status metadata; use semantic tone plus readable labels |
| `VForm`, `VTextField`, `VTextarea` | Setup/edit fields and API recipient entry; keep validation near the input |
| `VCard`, `VCardText`, `VDialog` | Auth surfaces and reviewed send/token confirmations |
| `VBottomSheet` | Shared draggable mobile composer sheet through `Sheet` |
| `VSnackbar` | One global operation-feedback host, not a new snackbar per page |
| `VSwitch` | Desktop theme shortcut; full appearance settings use shared native radio cards |
| `VAvatar` | Existing identity/preview surfaces; merchant-image containers remain transparent |
| `VProgressCircular`, `VProgressLinear`, `VSkeletonLoader` | Busy, progress and initial-loading states without replacing stable chrome |

The plugin registers the full Vuetify component/directive collection. That does
not mean every registered component is part of the current design vocabulary.
Unrouted demo views remain in `src/views`; their tables and older form controls
are not templates for new workspace pages. Check the router and active feature
components when deciding what to reuse.

## Reusable application components

All paths below are relative to `src/components/ui/`. Prefer these components to
rebuilding their markup. Feature containers own fetching, permissions and workflow.

| Component | Reuse contract |
| --- | --- |
| `PageLayout.vue` | Persistent shared header, panel IDs, one content window and routed slot |
| `PageHeader.vue` | Same title/description/metadata/actions/filter structure on every workspace route |
| `PillTabs.vue` | Typed `modelValue`, items, label and panel/tab IDs; optional `mobileCompact` presentation; emits selection and does not fetch or render a window |
| `BrandLogo.vue` | Supplied `public/nudge.png`, shared small/medium/large presentation and alt text |
| `Avatar.vue` | Transparent merchant image with broken/missing-image user-icon fallback; enclosing action owns its accessible name |
| `AvatarPicker.vue` | Image preview, accessible upload/change action, busy state and identity label slot |
| `ChoiceCards.vue` | Native radio group with icons, titles and optional descriptions; default cards or compact `inline` appearance options |
| `MetricCard.vue` | Audience statistic with icon, semantic tone, value, change and optional detail |
| `LineChart.vue` | Shared trend drawing, keyboard/touch exploration and accessible daily-value table; SVG geometry stays data-driven |
| `MessageField.vue` | Labelled compact native textarea, character count, limit, validation and exposed input focus |
| `NotificationPreview.vue` | Merchant image/name/message and live client clock; adaptive composer presentation |
| `PhonePreview.vue` | Public landing-page demo; distinct from the live sender preview |
| `Sheet.vue` | Labelled bottom sheet, header/body/footer slots, drag/tap close, focus handling and keyboard viewport adaptation |
| `CodeBlock.vue` | Selectable code and explicit copying; secret display and copied code have separate contracts |
| `SnackbarHost.vue` | Single App-owned feedback surface, queue rendering and accessible announcements |
| `SnackbarFeedback.vue` | Bridge feature success/error state to shared feedback; lifecycle-aware cleanup |
| `ActionDock.vue` | Public mobile landing actions supplied as typed links |

`SectionHeader.vue` exists for separate/older surfaces; workspace views must use
`PageHeader` through `PageLayout`, not mount a second header themselves.

## Layout, density and responsive behaviour

The workspace structure is `AppShell → PageLayout → PageHeader + VWindow → routed
body`. The header owns `.header__content`, `.header__copy`, `.header__metadata`,
`.header__actions` and `.header__filters`. Route views supply presentation data
through `usePagePresentation`; only content inside the persistent window changes.
Windows are transparent, borderless and shadowless. Individual cards own borders.
Do not key/remount the shell or frame by route/filter, or fabricate Vuetify internal
classes such as `v-slide-group__container`.

| Pattern | Current dimensions / behaviour |
| --- | --- |
| Filter pills | Desktop: 52px tall, 13px labels. Mobile: Nudgee-style 32px visual track, 30px selection, 48px targets and 11px labels. Maximum 264px wide with pill rounding |
| Filter row | Desktop sticks while the title scrolls. Mobile stays above the scrolling window without a top logo bar; Audience/Nudges headings are visually hidden. Selection retains the scroll owner offset |
| Mobile bottom navigation | 56px tall, 52px while compact; 16px side insets, 8px bottom gap plus safe area; fixed width while shrinking |
| Bottom-nav glass | Theme surface at 0.76 alpha, 20px blur, 135% saturation; opaque fallback for unavailable blur/reduced transparency |
| Navigation breakpoint | Share Vuetify `smAndDown` in shell and FAB; mobile navigation below 960px, sidebar from 960px |
| Main frame | Outer container maximum 1600px; shared page maximum 1360px; mobile uses a bounded 100dvh shell with one content scroll owner and safe-area/nav clearance |
| Cards | 20px base radius, thin neutral border; compact 16–20px padding and 24px where space permits |
| History | One card per row in mobile and desktop; footer delivery/timing align to opposite sides |
| Audience metrics | Two columns on narrow screens; four at the existing 1200px layout breakpoint |
| Send action | 48px round FAB; desktop navigates to `/compose`, mobile opens the shared sheet |

Mobile navigation is Audience, Nudges, API token (platform only), then the Profile
avatar. No mobile sidebar or theme shortcut; appearance and logout live in Profile.
Desktop keeps sidebar navigation and its theme shortcut with no app bar.
Share feature state between responsive presentations. Do not copy an entire page
or introduce a second breakpoint for the same navigation behaviour.
See [mobile design context](mobile-design-context.md) for scroll, gestures,
compact status chips, forms and real-device verification.

Typography uses `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", sans-serif`; no added font download is required. Body starts at 15px;
message inputs use 16px. Existing workspace titles are 26px/32px across the 721px
CSS breakpoint; filter labels are 13px and metric values 28px/32px. Use the current
component styles rather than inventing a new scale per page. Use tabular numerals
for changing metrics, monospace for code, and the existing 4/8-point spacing rhythm.

## Feedback, motion and accessibility

Success/error outcomes use `useSnackbar` or `SnackbarFeedback`. The single host
renders top-right, fits mobile safe areas, closes after 20 seconds, includes a close
button, and pauses dismissal on hover/focus. Field validation stays inline; loading,
empty states and completed workflow panels remain beside their content. Preserve
recovery controls after a notice disappears. Never put tokens or personal payloads
in feedback text.

Keep short purposeful motion: current bottom-nav compaction is 180ms, sheet entry
uses a 240ms transform with 180ms opacity, and pill selection uses Vuetify's grow
slider. Respect reduced motion, reduced transparency and forced colours. Keep
keyboard focus visible and meaningful when animations are skipped.

Use 48px minimum interaction targets, labels for inputs, accessible names for icon
buttons, one page h1, semantic headings, and keyboard-operable tabs/radios. Modal
and sheet focus must stay inside, then return to the trigger. Preserve safe-area
clearance, zoom, 320px reflow, text wrapping and status cues beyond colour.

## Applying this context in another application

1. Start from the shared theme roles, MDI icon family, logo and appearance model.
2. Reuse the appropriate primitives and their structure; keep product-specific
   state, requests and permissions in that application's feature layer.
3. Put authored styles in the application's central CSS file. No inline/bound
   styles, HTML/Vue style blocks or JavaScript style injection. Keep static SVG
   presentation in CSS; coordinates/path data remain in markup/state.
4. Preserve supported Vuetify props, generated theme styles and runtime geometry.
   Existing pointer/keyboard viewport Web Animations are a documented behavioural
   exception, not a pattern for static styling.
5. Use semantic state classes and UI-role/BEM names. Extend a shared primitive
   when needed rather than copying a nearly identical page component.
6. Verify light/dark at 320/375/768/1440px, keyboard paths, focus, sticky filters,
   touch targets, loading/empty/error states and reduced motion using mocked data.

For this repo, `npm run test:styles` checks CSS ownership and token agreement;
`test:ui`, `test:audience` and the relevant browser suites cover component behaviour.
Run `npm run build` for implementation changes. Keep this guide and its links
current when an approved design decision changes.
