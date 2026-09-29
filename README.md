# Nudger frontend

Vue 3 single-page landing site for Plug & Nudge. The page explains the relationship between Nudger, the web-only platform for businesses and creators, and Nudgee, the mobile app people use to receive permission-based updates.

## Local development

```sh
npm install
npm run dev
```

The Vite development server runs at `http://localhost:5174`. Port `5173` is reserved for the Nudgee frontend.

For Vite development values, create `.env.local` from `.env.nudger.example`. The landing page also works without configured URLs; registration falls back to the on-page CTA and Nudger login opens the local `/login` screen. Configure `VITE_NUDGER_GOOGLE_AUTH_URL` when the Google auth endpoint is available.

## Docker

The production image uses a Node Alpine build stage and an Nginx Alpine runtime stage. Store and Nudger URLs are injected when the container starts, so the same image can be used in different environments.

```sh
cp .env.nudger.example .env.nudger
docker build -t nudger-fe:local .
docker run --rm --name nudger-fe-local --env-file .env.nudger -p 5174:80 nudger-fe:local
```

Open `http://localhost:5174`. The container listens on port `80`; the host mapping keeps the Nudgee app's `5173` port free.
