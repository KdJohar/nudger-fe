#!/bin/sh
set -eu

envsubst '${VITE_API_BASE_URL} ${VITE_NUDGEE_ANDROID_URL} ${VITE_NUDGEE_IOS_URL} ${VITE_NUDGER_REGISTER_URL} ${VITE_NUDGER_LOGIN_URL}' \
  < /usr/share/nginx/html/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js

exec "$@"
