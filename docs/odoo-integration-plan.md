# Odoo integration website brief

Recorded 27 October 2026. The user requested an Odoo integration detail page and
SEO targeting mobile push notifications for Odoo CRM. The user approved implementation on `feat/odoo-integration-page`, with only Odoo
visible and all other integrations hidden. Local testing uses port 5174. Do not
merge or deploy without a subsequent request.

## Repository and current publication state

Repository: `/Users/kd/projects/nudger-fe`, the sole website source for
`https://plugandnudge.com`. Before this brief, the checkout was clean on `main` at
`900e6cdb14aab8533f8b075c8fa59f11da0e10e0`. A fresh fetch confirmed local main
and origin/main matched. Created `feat/odoo-integration-page` from that commit.

At branch creation, `PUBLIC_INTEGRATIONS_ENABLED` was false. Integration navigation,
homepage cards, catalog and detail routes are hidden; routes return 404/noindex
and are excluded from the sitemap. Keep their existing JSON and components.

The previous public website revamp was merged through frontend PR 17. Older
local-only statements in landing-review.md are dated historical review notes,
not permission to deploy this new work.

## Approved implementation

Make Odoo the first visible integration while keeping all seven existing entries
unpublished. Add explicit per-entry publication control, separate from descriptive
status labels such as Available or Preview. Generate links, homepage cards,
catalog, detail routes and sitemap from the same published subset. Do not simply
turn on the old global flag and expose every retained guide.

Create `/integrations/odoo`, an Odoo-only catalog/home card and relevant navigation.
Use the existing minimal public design, coral/indigo branding, responsive layouts,
light/dark themes and static HTML generation. Use the official Odoo logo without
recoloring it or displaying partner badges. Add optimized, locally served assets
with meaningful alternative text and dimensions. Extend the JSON-backed guide
schema for product integrations where necessary; do not fabricate a code sample
just to satisfy fields intended for developer recipes.

H1: Receive Odoo CRM push notifications on your mobile.
Title: Odoo CRM Mobile Push Notifications | Plug & Nudge.
Target intent: receive push notification on odoo crm on your mobile. Use natural
wording in the introduction, headings and useful FAQs. Add unique description,
canonical URL, social metadata, appropriate structured data and internal links.
Include only published URLs in the sitemap. Keep the page useful without JavaScript
and test performance, accessibility and mobile layouts. Search ranking is not an
implementation acceptance criterion.

Page sections: benefits; supported CRM alerts; contextual notification examples;
who receives alerts; administrator installation; employee connection; Scheduled
versus Immediate delivery; compatibility; privacy; troubleshooting; FAQs; and
clear links to get the Odoo module and download Nudge for iOS. Android remains
Coming soon. Preserve the existing mobile download and merchant CTAs.

## Product facts and copy boundaries

Source: [Nudge Odoo integration features setup and operations](https://chatgpt.com/space/page_b537cd93a5f48191bacfa07f1ec9bd56),
reference date 27 October 2026. This is the product source for the page; internal
release instructions and historical test identities are not public marketing copy.

- CRM Push Alerts, module `nudge_online`, supports Odoo 19 and 20. Match the module
  package to the database version; Odoo 18 is unsupported and intermediate SaaS
  versions need separate compatibility checks.
- Scope is CRM leads/opportunities, related activities, reminders and conversations.
  Do not imply Sales orders, Accounting, inventory, calendars or all Odoo apps.
- The catalog contains 26 event/reminder types. Scheduled supports 24 observable
  types; lead removal and activity cancellation require Immediate. Some types start
  disabled, and database policy determines which selected alerts are sent.
- Scheduled is the default, checking saved state every five minutes. Delays and
  batching can take longer, and changes between scans can be missed. Existing
  records are baselined rather than sending historical creation alerts.
- Scheduled uses core Odoo scheduled actions, without mandatory Studio or Automation
  Rules. It was tested with an Odoo One App Free database remaining Free; do not
  promise universal or permanent Odoo plan eligibility.
- Optional Immediate uses Automation Rules and can affect Odoo subscription status.
  Reminders remain scheduled in either mode. Do not promise instant or guaranteed
  delivery, one-to-two-minute scans, or a durable retry queue.
- Each employee opts in by saving their own copied Nudge webhook at
  My Preferences → Nudge → Manage my webhook. Clearing it stops future alerts.
  Native CRM permissions still apply.
- Lead alerts normally go to the assigned salesperson; activity alerts to the
  relevant assignee, mentions to the mentioned employee. Settings administrators
  can opt into selected-lead watching or oversight; administrator status alone does
  not subscribe them to every lead. Recipient paths are deduplicated.
- Notifications contain useful record context, including names, assignments,
  relevant activity details and dates. Learn more opens the record, subject to Odoo
  access. Removed records have no destination button.
- Selected notification content, including customer or employee names, excerpts and
  links, is processed by Plug & Nudge. This is not full CRM synchronization. Explain
  consent and link the privacy policy; do not claim no personal data is processed.
- Hook notifications do not produce CTR events. Do not market merchant CTR analytics
  as an Odoo integration feature. Endpoint versioning stays internal.
- The module is free under LGPL-3.0; Odoo subscription requirements and Nudge service
  terms are separate. Do not describe internal Android testing as a public release.

## Links and assets

User-supplied module CTA: https://bit.ly/4yIFbMK. Resolved on 27 October to
https://apps.odoo.com/apps/modules/20.0/nudge_online, HTTP 200.
Odoo 19 listing from the product reference:
https://apps.odoo.com/apps/modules/19.0/nudge_online.

Existing iOS CTA: https://apple.co/4yDfgX4.
Public support: kd@plugandnudge.com.
Official logo and CRM icon source: https://www.odoo.com/page/brand-assets.
Retain official logo colors, adequate clear space and at least 20px height.
Do not use the official-partner logos.

## Implementation and review boundary

Implementation remains local on `feat/odoo-integration-page`. JSON now contains
`published: true` only for Odoo. `PUBLISHED_INTEGRATIONS` drives the catalog, homepage
cards, detail routes, links and sitemap. The global display flag is derived from
that subset; it cannot publish hidden entries on its own. The Webhooks CTA also
checks the specific webhook entry before rendering.

The build produces nine public documents, including `/integrations` and
`/integrations/odoo`. All seven retained guides remain 404/noindex. Product detail
content lives in the JSON `product` object and renders through the shared
`ProductIntegrationView`; code samples remain required for recipe guides, but are
not fabricated for an installed app. `IntegrationSteps` shares the setup markup.
All CSS remains in the scoped public section of main.css. SEO uses the existing
escaped metadata generator plus breadcrumb structured data.

Authentication, dashboard, API and native mobile source are outside this change.
No merge, deployment or production change is authorized by this task.

## Official logo provenance

The unchanged 180 × 79 PNG is served locally at
`/integrations/assets/odoo-logo.png` (2,901 bytes), fetched from the official
Odoo 19 source at
https://raw.githubusercontent.com/odoo/odoo/19.0/addons/web/static/img/logo.png
on 27 October 2026. It retains the official colors and clear space. A white
backing keeps it legible in both site themes; no partner mark is used.

SHA-256: `d79c3b91b672ea79370c5fe4516e59bcb72028b365c68030e01982eb1cfd845f`.

No customer screenshots, private webhook, internal Android distribution link or
historical test identities were copied into the page. The alert text example is
labelled illustrative with fictional names; it is not presented as an app screenshot.

## Local verification on 27 October 2026

- Required source checks: styles 4/4, UI 57/57, audience 13/13, PWA 8/8 and
  SEO/Analytics/service-worker/catalog 15/15 passed. Type checking and build passed.
- Five generated-document and local HTTP checks passed on port 5174, including
  nine static pages, exact sitemap, private noindex shells and hidden-guide 404s.
- Browser checks passed for nine pages without JavaScript and 40 combinations of
  five page types at 320/375/768/1440px in light/dark themes. No Axe violations,
  horizontal overflow, broken images or browser errors were reported.
- Catalog search/filter/reset, Odoo navigation and CTA, FAQs, theme persistence,
  mobile menu Escape and the home download dock/footer clearance passed.
- All seven hidden guide URLs, including their direct index.html variants, returned
  404/noindex. Published pages contain no links to those guides.
- Public Analytics isolation passed with Google requests intercepted: one sanitized
  page view per document under the simulated production origin and none locally.
- Odoo mobile lab: 150ms round-trip latency, 1.6Mbps download, 4× CPU slowdown;
  LCP 592ms, CLS 0, resource transfer 16,742 bytes. These are local lab results,
  not production field Core Web Vitals. Public JS remains 3,254 bytes and CSS is
  30,394 bytes before compression.

Review captures: `.review/integrations-odoo-1440-light.png` and
`.review/integrations-odoo-375-light.png`; browser report `.review/verification.json`.
The local preview runs at http://127.0.0.1:5174/integrations/odoo.
No merge, push or deployment was performed.
