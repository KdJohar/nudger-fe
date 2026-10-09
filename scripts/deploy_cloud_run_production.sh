#!/usr/bin/env bash

# Deploy the frontend image, expose it through the existing global HTTPS load
# balancer, and keep browser API traffic on the frontend origin.
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-plugnudge-509408}"
REGION="${GCP_REGION:-asia-south1}"
IMAGE_REPOSITORY="${GCP_ARTIFACT_REPOSITORY:-nudger-fe-app}"
IMAGE_NAME="${IMAGE_NAME:-nudger-fe}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY_HOST="${REGION}-docker.pkg.dev"
IMAGE_PATH="${REGISTRY_HOST}/${PROJECT_ID}/${IMAGE_REPOSITORY}/${IMAGE_NAME}"
SERVICE_NAME="${CLOUD_RUN_FE_SERVICE:-nudger-fe}"
ENV_FILE="${NUDGER_FE_ENV_FILE:-.env.nudger.production}"

NEG_NAME="${CLOUD_RUN_FE_NEG:-nudger-fe-serverless-neg}"
BACKEND_SERVICE="${CLOUD_RUN_FE_BACKEND_SERVICE:-nudger-fe-backend}"
URL_MAP="${CLOUD_RUN_URL_MAP:-nudge-api-url-map}"
HTTPS_PROXY="${CLOUD_RUN_HTTPS_PROXY:-nudge-api-https-proxy}"
API_CERTIFICATE="${CLOUD_RUN_API_CERTIFICATE:-nudge-api-managed-cert}"
FE_CERTIFICATE="${CLOUD_RUN_FE_CERTIFICATE:-nudger-fe-managed-cert}"
FE_PATH_MATCHER="${CLOUD_RUN_FE_PATH_MATCHER:-nudger-fe-hosts}"
FE_DOMAIN="${CLOUD_RUN_FE_DOMAIN:-plugandnudge.com}"
VPC_NETWORK="${CLOUD_RUN_FE_VPC_NETWORK:-default}"
VPC_SUBNET="${CLOUD_RUN_FE_VPC_SUBNET:-default}"
VPC_TAG="${CLOUD_RUN_FE_NETWORK_TAG:-nudge-cloudrun}"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

require_command gcloud

if [ "$SERVICE_NAME" != "nudger-fe" ] || [ "$IMAGE_REPOSITORY" != "nudger-fe-app" ] || [ "$IMAGE_NAME" != "nudger-fe" ] || [ "$FE_DOMAIN" != "plugandnudge.com" ]; then
  echo 'Production frontend deployment is locked to nudger-fe -> plugandnudge.com.' >&2
  echo 'nudgee-fe is reference-only and must never be deployed by this script.' >&2
  exit 1
fi

[ -f "$ENV_FILE" ] || {
  echo "Missing production environment file: $ENV_FILE" >&2
  echo "Copy .env.nudger.production.example to $ENV_FILE and review it before deploying." >&2
  exit 1
}

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

required_values=(
  API_PROXY_UPSTREAM
  VITE_API_BASE_URL
  VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES
  VITE_PROFILE_IMAGE_FINAL_MAX_BYTES
  VITE_PROFILE_IMAGE_MAX_DIMENSION
  VITE_PROFILE_IMAGE_WEBP_QUALITY
  VITE_GA_MEASUREMENT_ID
  VITE_SENTRY_DSN
  VITE_SENTRY_ENVIRONMENT
  VITE_SENTRY_TRACES_SAMPLE_RATE
  VITE_NEW_RELIC_ACCOUNT_ID
  VITE_NEW_RELIC_APPLICATION_ID
  VITE_NEW_RELIC_AGENT_ID
  VITE_NEW_RELIC_LICENSE_KEY
  VITE_NEW_RELIC_BEACON
  VITE_NEW_RELIC_ERROR_BEACON
  VITE_NEW_RELIC_TRUST_KEY
)
for key in "${required_values[@]}"; do
  value="${!key:-}"
  if [ -z "$value" ]; then
    echo "$key must be filled in $ENV_FILE before deployment" >&2
    exit 1
  fi
done

case "$VITE_API_BASE_URL" in
  /|/*) ;;
  *) echo 'Production VITE_API_BASE_URL must be root-relative so browser calls stay on plugandnudge.com.' >&2; exit 1 ;;
esac

if ! printf '%s\n' "$API_PROXY_UPSTREAM" | grep -Eq '^https://([A-Za-z0-9.-]+|\[[A-Fa-f0-9:]+\])(:[0-9]+)?$'; then
  echo 'API_PROXY_UPSTREAM must be an HTTPS origin without a path.' >&2
  exit 1
fi

private_google_access="$(gcloud compute networks subnets describe "$VPC_SUBNET" \
  --project="$PROJECT_ID" --region="$REGION" --format='value(privateIpGoogleAccess)')"
if [ "$private_google_access" != "True" ]; then
  gcloud compute networks subnets update "$VPC_SUBNET" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --enable-private-ip-google-access
fi

image_digest="$(gcloud artifacts docker images describe "${IMAGE_PATH}:${IMAGE_TAG}" \
  --project="$PROJECT_ID" --format='value(image_summary.digest)')"
[ -n "$image_digest" ] || {
  echo "Unable to resolve ${IMAGE_PATH}:${IMAGE_TAG}; publish the image first." >&2
  exit 1
}
image="${IMAGE_PATH}@${image_digest}"

runtime_env="^|^API_PROXY_UPSTREAM=${API_PROXY_UPSTREAM}|VITE_API_BASE_URL=${VITE_API_BASE_URL}|VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES=${VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES}|VITE_PROFILE_IMAGE_FINAL_MAX_BYTES=${VITE_PROFILE_IMAGE_FINAL_MAX_BYTES}|VITE_PROFILE_IMAGE_MAX_DIMENSION=${VITE_PROFILE_IMAGE_MAX_DIMENSION}|VITE_PROFILE_IMAGE_WEBP_QUALITY=${VITE_PROFILE_IMAGE_WEBP_QUALITY}|VITE_GA_MEASUREMENT_ID=${VITE_GA_MEASUREMENT_ID}|VITE_SENTRY_DSN=${VITE_SENTRY_DSN}|VITE_SENTRY_ENVIRONMENT=${VITE_SENTRY_ENVIRONMENT}|VITE_SENTRY_TRACES_SAMPLE_RATE=${VITE_SENTRY_TRACES_SAMPLE_RATE}|VITE_NEW_RELIC_ACCOUNT_ID=${VITE_NEW_RELIC_ACCOUNT_ID}|VITE_NEW_RELIC_APPLICATION_ID=${VITE_NEW_RELIC_APPLICATION_ID}|VITE_NEW_RELIC_AGENT_ID=${VITE_NEW_RELIC_AGENT_ID}|VITE_NEW_RELIC_LICENSE_KEY=${VITE_NEW_RELIC_LICENSE_KEY}|VITE_NEW_RELIC_BEACON=${VITE_NEW_RELIC_BEACON}|VITE_NEW_RELIC_ERROR_BEACON=${VITE_NEW_RELIC_ERROR_BEACON}|VITE_NEW_RELIC_TRUST_KEY=${VITE_NEW_RELIC_TRUST_KEY}"

gcloud run deploy "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$image" \
  --port=80 \
  --cpu=1 \
  --memory=512Mi \
  --concurrency=80 \
  --timeout=60 \
  --min=1 \
  --max=5 \
  --ingress=internal-and-cloud-load-balancing \
  --allow-unauthenticated \
  --network="$VPC_NETWORK" \
  --subnet="$VPC_SUBNET" \
  --network-tags="$VPC_TAG" \
  --vpc-egress=all-traffic \
  --execution-environment=gen2 \
  --set-env-vars="$runtime_env"

if ! gcloud compute network-endpoint-groups describe "$NEG_NAME" \
  --region="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute network-endpoint-groups create "$NEG_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --network-endpoint-type=SERVERLESS \
    --cloud-run-service="$SERVICE_NAME"
fi

if ! gcloud compute backend-services describe "$BACKEND_SERVICE" \
  --global --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute backend-services create "$BACKEND_SERVICE" \
    --project="$PROJECT_ID" \
    --global \
    --protocol=HTTP \
    --load-balancing-scheme=EXTERNAL_MANAGED
fi

backend_group="$(gcloud compute backend-services describe "$BACKEND_SERVICE" \
  --global --project="$PROJECT_ID" --format='value(backends.group)')"
if ! printf '%s\n' "$backend_group" | grep -Fq "/$NEG_NAME"; then
  gcloud compute backend-services add-backend "$BACKEND_SERVICE" \
    --project="$PROJECT_ID" \
    --global \
    --network-endpoint-group="$NEG_NAME" \
    --network-endpoint-group-region="$REGION"
fi

if ! gcloud compute ssl-certificates describe "$FE_CERTIFICATE" \
  --global --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute ssl-certificates create "$FE_CERTIFICATE" \
    --project="$PROJECT_ID" \
    --global \
    --domains="$FE_DOMAIN"
fi

gcloud compute target-https-proxies update "$HTTPS_PROXY" \
  --project="$PROJECT_ID" \
  --global \
  --ssl-certificates="$API_CERTIFICATE,$FE_CERTIFICATE"

url_map_yaml="$(gcloud compute url-maps describe "$URL_MAP" \
  --global --project="$PROJECT_ID" --format=yaml)"
if ! printf '%s\n' "$url_map_yaml" | grep -Fq "name: $FE_PATH_MATCHER"; then
  gcloud compute url-maps add-path-matcher "$URL_MAP" \
    --project="$PROJECT_ID" \
    --global \
    --path-matcher-name="$FE_PATH_MATCHER" \
    --default-service="$BACKEND_SERVICE" \
    --new-hosts="$FE_DOMAIN"
elif ! printf '%s\n' "$url_map_yaml" | grep -Fq "$FE_DOMAIN"; then
  gcloud compute url-maps add-host-rule "$URL_MAP" \
    --project="$PROJECT_ID" \
    --global \
    --hosts="$FE_DOMAIN" \
    --path-matcher-name="$FE_PATH_MATCHER"
fi

service_url="$(gcloud run services describe "$SERVICE_NAME" \
  --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
certificate_status="$(gcloud compute ssl-certificates describe "$FE_CERTIFICATE" \
  --global --project="$PROJECT_ID" --format='value(managed.status)')"

printf 'Frontend Cloud Run deployment completed.\nService: %s\nImage: %s\nLoad balancer host: https://%s\nManaged certificate: %s\n' \
  "$service_url" "$image" "$FE_DOMAIN" "${certificate_status:-PENDING_DNS}"
