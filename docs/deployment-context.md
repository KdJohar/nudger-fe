# Nudger FE deployment context

This document is the reusable deployment contract for the Plug & Nudge
frontend. The checked-in `Dockerfile`, `Makefile` and
`scripts/deploy_cloud_run_production.sh` are authoritative when this document
and an implementation disagree.

## Runtime shape

## Repository ownership

| Repository | Role | Deployment rule |
| --- | --- | --- |
| `plugnudge-be` | Backend API and worker | Deploy backend services only; production API is `api.plugandnudge.com`. |
| `nudger-fe` | Production web frontend | This repository is the only frontend deployed to `plugandnudge.com`. |
| `nudgee-fe` | Reference frontend for mobile-app work | Never deploy this repository to the production web domain. |
| `nudge-ios` | Native iOS app | Uses the production API directly; it is not the web frontend deployment source. |

The frontend is a static Vue SPA served by Nginx in one Cloud Run service:

| Resource | Purpose | Default runtime contract |
| --- | --- | --- |
| `nudger-fe` | Production SPA and same-origin API proxy | 1 vCPU, 512 MiB, concurrency 80, min 1 / max 5, port 80 |
| `nudger-fe-app` | Artifact Registry Docker repository | `asia-south1`, image `nudger-fe:latest` |

The service uses `internal-and-cloud-load-balancing` ingress. Users reach the
frontend through the global HTTPS load balancer at `https://plugandnudge.com`;
the Cloud Run `run.app` URL is not the public application URL.

## Browser/API boundary

Production browser configuration uses:

```text
Browser -> https://plugandnudge.com/v1/*
        -> Nginx in nudger-fe
        -> https://nudge-api-...a.run.app (same-project Cloud Run internal path)
        -> nudge-api
```

`VITE_API_BASE_URL=/` is intentional. It keeps cookies, OAuth start requests,
and API calls on the frontend origin. The mobile application continues to use
`https://api.plugandnudge.com`; that public API host is not embedded in the
production frontend image.

`API_PROXY_UPSTREAM` is a runtime-only environment value. It must be an HTTPS
origin without a path and must point at the API Cloud Run service URL. The
frontend container never receives database, Redis, OAuth client-secret or other
backend secrets.

## Image lifecycle

`make create-image` runs the frontend tests and production build before creating
the `linux/amd64` image. `make publish-image` then ensures the Artifact Registry
repository exists, reapplies the cleanup policy, configures Docker
authentication, and pushes `nudger-fe:latest`.

The repository cleanup policy deletes only untagged image digests older than 48
hours. The `latest` tag remains available. Cloud Run deployment resolves the
tag to an immutable digest before deploying.

```sh
cp .env.nudger.production.example .env.nudger.production
make publish-image
make deploy-production
```

The production environment file is local and ignored. Review
`API_PROXY_UPSTREAM` and the profile-image limits before deployment; do not
commit it.

## Global HTTPS load balancer

The deployment script reuses the existing API load balancer:

- API backend remains the default route and continues serving
  `api.plugandnudge.com`.
- `plugandnudge.com` is added as a host rule to the `nudger-fe` serverless
  NEG/backend.
- A managed certificate covers `plugandnudge.com`.
- Cloudflare DNS must keep the apex record pointed at the load balancer IP and
  must allow Google certificate validation to complete.

Do not create a second load balancer for the frontend.

## OAuth production contract

The browser origin for the production web OAuth client is:

```text
https://plugandnudge.com
```

The backend callback remains:

```text
https://api.plugandnudge.com/v1/app-identity/google/callback
```

The OAuth client ID and secret belong in the backend production environment,
not in this repository or in the frontend container. The backend should allow
the frontend return URL `https://plugandnudge.com/auth/callback`.

## Production observability

The frontend receives observability values at container startup through the
ignored `.env.nudger.production` file. These values are intentionally absent
from local development files, so local sessions do not send production
telemetry.

- Google Analytics 4 uses the `plugandnudge.com` web stream and records SPA
  page views after Vue Router navigation.
- Sentry uses the separate `nudger-fe` Vue project with the `production`
  environment and a 10% tracing sample rate. Default PII collection remains
  disabled.
- New Relic Browser uses the `nudger-fe-production` browser entity with the
  EU beacon. The backend continues to use its existing New Relic APM service.
- Runtime configuration is never cached by the service worker and is not
  included in the immutable frontend build.

## Verification checklist

- `make create-image` passes tests, type-check/build and creates the image.
- `make publish-image` pushes the latest image and reports its digest.
- Cloud Run service has min 1 / max 5 and internal-and-load-balancing ingress.
- `https://plugandnudge.com/`, `/audience`, `/nudges` and `/auth/callback`
  resolve through SPA fallback.
- Browser network calls use `https://plugandnudge.com/v1/...`, not
  `api.plugandnudge.com`.
- API OAuth start and callback return to the production frontend.
- `api.plugandnudge.com` still routes to `nudge-api` for mobile clients.
- GA4, Sentry and New Relic production integrations load only when their
  production runtime values are present.
- Managed certificate is `ACTIVE` after DNS validation.
