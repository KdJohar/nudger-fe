#!/bin/sh
set -eu

envsubst '${VITE_NUDGEE_ANDROID_URL} ${VITE_NUDGEE_IOS_URL} ${VITE_NUDGER_REGISTER_URL} ${VITE_NUDGER_LOGIN_URL} ${VITE_NUDGER_GOOGLE_AUTH_URL}' \
  < /usr/share/nginx/html/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js

exec "$@"
