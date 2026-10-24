import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { validateRuntimeConfig } from './src/lib/runtimeConfig'

export default defineConfig(({ command, isPreview }) => {
  const workspaceCss: Plugin = {
    name: 'workspace-css-boundary', enforce: 'pre',
    transform(source, id) {
      if (id.split('?')[0].endsWith('/src/styles/main.css')) return source.split('/* MARKETING_CSS_START')[0]
    },
  }
  if (command === 'build') return { plugins: [workspaceCss, vue()], ssr: { noExternal: ['vuetify'] } }
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
  const isPrivate = (path: string) => /^\/(?:login|auth\/callback|onboarding|pending|workspace|dashboard|audience|compose|nudges|profile|token)\/?$/.test(path)
  const isResource = (path: string) => path.startsWith('/v1/') || path.startsWith('/docs') || path.startsWith('/@') || path.startsWith('/src/') || path.startsWith('/node_modules/') || path.includes('.')
  const publicPlugin: Plugin = {
    name: 'static-public-documents',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url || '/', 'http://localhost')
        if (url.pathname === '/marketing/dev.css') {
          const css = readFileSync(resolve('src/styles/main.css'), 'utf8').match(/\/\* MARKETING_CSS_START[\s\S]*?\*\/([\s\S]*?)\/\* MARKETING_CSS_END \*\//)?.[1]
          response.setHeader('Content-Type', 'text/css'); response.end(css); return
        }
        if (request.method !== 'GET' || isPrivate(url.pathname) || isResource(url.pathname)) return next()
        try {
          const source = await server.ssrLoadModule('/src/entry-server.ts')
          const path = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '')
          if (path === '/for-nudgers' || path !== url.pathname) {
            response.statusCode = 308; response.setHeader('Location', (path === '/for-nudgers' ? '/merchant' : path) + url.search); response.end(); return
          }
          response.statusCode = source.PUBLIC_PAGES.some((page: { path: string }) => page.path === path) ? 200 : 404
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.setHeader('Cache-Control', 'no-cache')
          response.end(await source.renderPublicDocument(path, { css: '/marketing/dev.css', js: '/src/public/client.ts' }))
        } catch (error) { next(error) }
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url || '/', 'http://localhost')
        if (url.pathname === '/sw.js') response.setHeader('Cache-Control', 'no-store')
        if (url.pathname.endsWith('.html') && url.pathname !== '/app.html') {
          if (url.pathname === '/index.html') { response.statusCode = 308; response.setHeader('Location', '/' + url.search); response.end(); return }
          response.statusCode = 404; response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(await readFile(resolve('dist/404.html'), 'utf8')); return
        }
        if (request.method !== 'GET' || isResource(url.pathname)) return next()
        const path = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '')
        if (path === '/for-nudgers' || path !== url.pathname) {
          response.statusCode = 308; response.setHeader('Location', (path === '/for-nudgers' ? '/merchant' : path) + url.search); response.end(); return
        }
        const privatePage = isPrivate(path)
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.setHeader('Cache-Control', privatePage ? 'no-store' : 'no-cache')
        if (privatePage) response.setHeader('X-Robots-Tag', 'noindex, nofollow')
        try { response.end(await readFile(resolve('dist', privatePage ? 'app.html' : path === '/' ? 'index.html' : path.slice(1) + '/index.html'), 'utf8')) }
        catch { response.statusCode = 404; response.setHeader('X-Robots-Tag', 'noindex, nofollow'); response.end(await readFile(resolve('dist/404.html'), 'utf8')) }
      })
    },
  }
  const runtimePlugin: Plugin = {
    name: 'runtime-config-from-env-file',
    configureServer: configureRuntime,
    configurePreviewServer: configureRuntime,
  }
  const proxy = { '/v1/': { target: upstream }, '/docs': { target: upstream }, '/openapi.json': { target: upstream } }
  return {
    appType: isPreview ? 'mpa' : 'spa',
    plugins: [workspaceCss, vue(), runtimePlugin, publicPlugin],
    server: { proxy },
    preview: { proxy },
  }
})
