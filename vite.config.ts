import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { validateRuntimeConfig } from './src/lib/runtimeConfig'

export default defineConfig(({ command }) => {
  if (command === 'build') return { plugins: [vue()] }
  // Read exactly one selected file. Shell variables and Vite mode files cannot override its values.
  const envFile = resolve(process.env.NUDGER_ENV_FILE || '.env.nudger.local')
  const env = parseEnv(readFileSync(envFile, 'utf8'))
  const runtime = validateRuntimeConfig({
    apiBaseUrl: env.VITE_API_BASE_URL,
    profileImageSourceMaxBytes: env.VITE_PROFILE_IMAGE_SOURCE_MAX_BYTES,
    profileImageFinalMaxBytes: env.VITE_PROFILE_IMAGE_FINAL_MAX_BYTES,
    profileImageMaxDimension: env.VITE_PROFILE_IMAGE_MAX_DIMENSION,
    profileImageWebpQuality: env.VITE_PROFILE_IMAGE_WEBP_QUALITY,
    gaMeasurementId: env.VITE_GA_MEASUREMENT_ID,
    sentryDsn: env.VITE_SENTRY_DSN,
    sentryEnvironment: env.VITE_SENTRY_ENVIRONMENT,
    sentryTracesSampleRate: env.VITE_SENTRY_TRACES_SAMPLE_RATE,
    newRelicAccountId: env.VITE_NEW_RELIC_ACCOUNT_ID,
    newRelicApplicationId: env.VITE_NEW_RELIC_APPLICATION_ID,
    newRelicAgentId: env.VITE_NEW_RELIC_AGENT_ID,
    newRelicLicenseKey: env.VITE_NEW_RELIC_LICENSE_KEY,
    newRelicBeacon: env.VITE_NEW_RELIC_BEACON,
    newRelicErrorBeacon: env.VITE_NEW_RELIC_ERROR_BEACON,
    newRelicTrustKey: env.VITE_NEW_RELIC_TRUST_KEY,
  })
  const upstream = env.API_PROXY_UPSTREAM
  if (!upstream || !/^https?:\/\//.test(upstream)) throw new Error('API_PROXY_UPSTREAM is required in the selected environment file.')
  const upstreamUrl = new URL(upstream)
  if (upstreamUrl.username || upstreamUrl.password || upstreamUrl.search || upstreamUrl.hash || upstreamUrl.pathname !== '/') {
    throw new Error('API_PROXY_UPSTREAM must be an HTTP(S) origin without a path.')
  }
  function configureRuntime(server: Pick<ViteDevServer, 'middlewares'>) {
    server.middlewares.use('/runtime-config.js', (_request, response) => {
      response.setHeader('Content-Type', 'application/javascript')
      response.setHeader('Cache-Control', 'no-store')
      response.end(`window.__NUDGER_CONFIG__ = ${JSON.stringify(runtime)};`)
    })
  }
  const runtimePlugin: Plugin = {
    name: 'runtime-config-from-env-file',
    configureServer: configureRuntime,
    configurePreviewServer: configureRuntime,
  }
  const proxy = { '/v1/': { target: upstream }, '/docs': { target: upstream }, '/openapi.json': { target: upstream } }
  return {
    plugins: [vue(), runtimePlugin],
    server: { proxy },
    preview: { proxy },
  }
})
