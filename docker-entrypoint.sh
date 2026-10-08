#!/bin/sh
set -eu

: "${API_PROXY_UPSTREAM:?API_PROXY_UPSTREAM must be supplied with the Docker environment file}"
: "${VITE_API_BASE_URL:?VITE_API_BASE_URL must be supplied with the Docker environment file}"
: "${VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES:?VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES must be supplied with the Docker environment file}"
: "${VITE_PROFILE_IMAGE_FINAL_MAX_BYTES:?VITE_PROFILE_IMAGE_FINAL_MAX_BYTES must be supplied with the Docker environment file}"
: "${VITE_PROFILE_IMAGE_MAX_DIMENSION:?VITE_PROFILE_IMAGE_MAX_DIMENSION must be supplied with the Docker environment file}"
: "${VITE_PROFILE_IMAGE_WEBP_QUALITY:?VITE_PROFILE_IMAGE_WEBP_QUALITY must be supplied with the Docker environment file}"

# Validate substitutions before writing JavaScript or Nginx configuration.
if ! printf '%s\n' "$API_PROXY_UPSTREAM" | grep -Eq '^https?://([A-Za-z0-9.-]+|\[[A-Fa-f0-9:]+\])(:[0-9]+)?$'; then
  echo 'API_PROXY_UPSTREAM must be an HTTP(S) origin without a path.' >&2
  exit 1
fi
case "$VITE_API_BASE_URL" in
  //*) echo 'VITE_API_BASE_URL cannot be protocol-relative.' >&2; exit 1 ;;
  http://*|https://*|/*) ;;
  *) echo 'VITE_API_BASE_URL must be an HTTP(S) URL or root-relative path.' >&2; exit 1 ;;
esac
if [ -n "$(printf '%s' "$VITE_API_BASE_URL" | tr -d 'a-zA-Z0-9_./:%~[]-')" ]; then
  echo 'VITE_API_BASE_URL contains unsupported characters.' >&2
  exit 1
fi
for value in "$VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES" "$VITE_PROFILE_IMAGE_FINAL_MAX_BYTES" "$VITE_PROFILE_IMAGE_MAX_DIMENSION"; do
  if ! printf '%s\n' "$value" | grep -Eq '^[1-9][0-9]*$'; then
    echo 'Profile image limits must be positive integers.' >&2
    exit 1
  fi
done
if ! printf '%s\n' "$VITE_PROFILE_IMAGE_WEBP_QUALITY" | grep -Eq '^(0\.[0-9]*[1-9][0-9]*|1(\.0+)?)$'; then
  echo 'VITE_PROFILE_IMAGE_WEBP_QUALITY must be greater than 0 and at most 1.' >&2
  exit 1
fi

envsubst '${VITE_API_BASE_URL} ${VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES} ${VITE_PROFILE_IMAGE_FINAL_MAX_BYTES} ${VITE_PROFILE_IMAGE_MAX_DIMENSION} ${VITE_PROFILE_IMAGE_WEBP_QUALITY} ${VITE_GA_MEASUREMENT_ID} ${VITE_SENTRY_DSN} ${VITE_SENTRY_ENVIRONMENT} ${VITE_SENTRY_TRACES_SAMPLE_RATE} ${VITE_NEW_RELIC_ACCOUNT_ID} ${VITE_NEW_RELIC_APPLICATION_ID} ${VITE_NEW_RELIC_AGENT_ID} ${VITE_NEW_RELIC_LICENSE_KEY} ${VITE_NEW_RELIC_BEACON} ${VITE_NEW_RELIC_ERROR_BEACON} ${VITE_NEW_RELIC_TRUST_KEY}' \
  < /usr/share/nginx/html/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js

envsubst '${API_PROXY_UPSTREAM}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
nginx -t

exec "$@"
