# Frontend API contract

The selected environment file owns the API endpoint. Docker supplies its values
to runtime-config.js at startup; Vite parses exactly one selected file. No bundled
localhost default, mode-file fallback or shell override is used by the client.
All five public config fields are validated, including runtime image settings.
API_PROXY_UPSTREAM is server-side configuration for the local proxy only.

- `config.ts` validates runtime config when consumed.
- `lib/apiUrl.ts` joins the configured base with code-owned route paths. It also
  builds absolute URLs for all five code examples and public API documentation.
- `lib/api.ts` owns fetch, headers, a 30-second timeout, caller cancellation,
  JSON parsing and structured errors. All application API calls use this client.
  Private responses are not cached; credentials use the explicit Bearer header.
  The transport never retries requests. Authentication alone retains its existing
  one-time session refresh on 401; merchant-token sends never use session refresh.
- Feature adapters in `lib/` own endpoint paths and typed response contracts.
  `lib/nudges.ts` validates the history envelope before it reaches UI state.
- Signed image upload URLs are an intentional exception: the storage URL comes
  from the existing API, uses XHR for progress, and never receives a session token.

Absolute pagination links are reduced to the expected list path and query. Their
host cannot override the environment endpoint. Root-relative, path-relative and
query-only cursors work with same-origin and absolute bases, including prefixes.
Unexpected endpoints, protocols, fragments and malformed links fail explicitly.

HTML, invalid JSON and null successful responses never reach feature code as a
successful payload. HTTP error status, API error codes, retryability and field
errors remain available. A 204/205 is explicitly an empty response; consumers that
require data must validate it. No response body or token is written to logs.

Nudge history retains cards on errors, retries the failed page, blocks duplicate
page loads, deduplicates overlapping pages, and aborts obsolete requests on filter
change/unmount. Filter refreshes replace data only after success. Creator accounts
remain broadcast-only; the redundant creator notice is removed.

Verification: `npm run test:api`, existing UI/audience/profile/compose/API access
tests, `npm run build`, and `npm run test:browser:api` against the local Docker
app. Browser tests mock APIs and never modify merchant data or send notifications.
