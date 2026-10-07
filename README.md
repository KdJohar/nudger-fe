# Plug&Nudge — Nudger workspace

A Vue 3 + TypeScript + Vuetify 3 SPA for authenticated Nudger workflows. It uses the Nudger identity/profile, audience, nudge history, and platform token APIs from the local Plug&Nudge backend.

## Run locally

```bash
npm install
# Copy .env.nudger.example to .env.nudger.local and set your endpoint.
# When running Vite on the host, set API_PROXY_UPSTREAM=http://localhost:8001.
npm run dev -- --host 0.0.0.0 --port 5174
```

The local preview is `http://localhost:5174`. There is no default API endpoint.
Vite reads only `.env.nudger.local` (or the file selected with `NUDGER_ENV_FILE`).
Shell values and Vite mode env files do not override that file. Restart after env changes.
Use Node 22+ for local development.

For Docker, `VITE_API_BASE_URL=/` keeps browser requests on the current origin,
including mobile/LAN clients. `API_PROXY_UPSTREAM=http://host.docker.internal:8001`
sets the backend reached by the local Nginx proxy. An absolute HTTP(S) API URL or a
root-relative prefix is also supported. Public paths such as `/v1/...` stay in code.
Every required value comes from the selected env file; missing/invalid values fail
validation instead of falling back to another endpoint. Browser config is public:
never put tokens or secrets in these settings.

```bash
docker build -t nudger-fe:pre .
docker run -d --name nudger-fe --restart unless-stopped \
  --env-file .env.nudger.local --add-host host.docker.internal:host-gateway \
  -p 5174:80 nudger-fe:pre
```

Docker generates runtime config at startup, so the same image can use a different
env file without rebuilding. This repository's image does not contain local env
files. See [API client conventions](docs/api-client.md) when adding requests.

## Scripts

- `npm run dev` — start the Vite development server
- `npm run typecheck` — run Vue TypeScript checks
- `npm run build` — typecheck and create a production build
- `npm run preview` — preview the production build locally
- `npm run test:ui` — shared layout persistence, controls, and page structure tests
- `npm run test:audience` — audience/chart state and geometry regression tests

## Structure

Read [AGENTS.md](AGENTS.md) and [Vue architecture](docs/vue-architecture.md) before changing layouts or adding workspace pages. All five workspace routes share one persistent header and content window; only the routed body changes.


- `src/layouts/AppShell.vue` — authenticated shell with persistent navigation, theme toggle, account actions, and mobile bottom navigation
- `src/components/ui/PageLayout.vue`, `PageHeader.vue`, and `PillTabs.vue` — the shared page frame, header, and selection-only control
- `src/data/workspacePages.ts` — static page titles, descriptions, and actions
- `src/composables/usePageLayout.ts` — typed, shell-scoped reactive header/filter bindings
- `src/router/index.ts` — SPA routes and auth/profile/platform route guards
- `src/plugins/vuetify.ts` — Vuetify registration, light/dark themes, and brand tokens
- `src/styles/main.css` — the shared visual language; custom styling stays out of templates and SFC style blocks
- `src/composables/` — auth session, profile, audience, nudge history, and theme state
- `src/lib/` — typed API adapters, image processing/upload, and chart formatting helpers
- `src/types/` — API contract types shared by views and composables
- `src/components/` — reusable feature components such as the profile manager and audience overview
- `src/views/` — route-level screens for login, onboarding, audience, nudges, compose, profile, and API token

## Authenticated routes

- `/login` and `/auth/callback` — Google sign-in handoff
- `/onboarding` and `/pending` — profile creation and review state
- `/dashboard` — redirects to Audience
- `/compose` — broadcast composer with live notification preview
- `/audience` — live audience metrics and trends
- `/nudges` — filtered, cursor-paginated nudge history
- `/profile` — profile identity and image management
- `/token` — platform-only API token creation and rotation

## Brand tokens

- Primary: `#FF6B4A`
- Secondary / hover / active indigo: `#4338CA`

The app intentionally excludes Nudgee merchant discovery/subscription workflows. Responsive mobile layout is implemented in the UI; device/network configuration remains a separate deployment concern.
