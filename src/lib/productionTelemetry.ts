import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent'
import * as Sentry from '@sentry/vue'
import type { App } from 'vue'
import type { Router } from 'vue-router'

import type { NudgerRuntimeConfig } from './runtimeConfig'
import { initializeGoogleAnalytics } from './googleAnalytics'

function initializeSentry(app: App, config: NudgerRuntimeConfig): void {
  if (!config.sentryDsn) return

  Sentry.init({
    app,
    dsn: config.sentryDsn,
    environment: config.sentryEnvironment || 'production',
    tracesSampleRate: config.sentryTracesSampleRate,
  })
}

function initializeNewRelic(config: NudgerRuntimeConfig): void {
  const hasRequiredConfig = [
    config.newRelicAccountId,
    config.newRelicApplicationId,
    config.newRelicAgentId,
    config.newRelicLicenseKey,
    config.newRelicBeacon,
    config.newRelicErrorBeacon,
  ].every(Boolean)
  if (!hasRequiredConfig) return

  new BrowserAgent({
    init: {
      ajax: { deny_list: [config.newRelicBeacon, config.newRelicErrorBeacon] },
      distributed_tracing: { enabled: true },
      privacy: { cookies_enabled: true },
    },
    info: {
      applicationID: config.newRelicApplicationId,
      beacon: config.newRelicBeacon,
      errorBeacon: config.newRelicErrorBeacon,
      licenseKey: config.newRelicLicenseKey,
      sa: 1,
    },
    loader_config: {
      accountID: config.newRelicAccountId,
      agentID: config.newRelicAgentId,
      applicationID: config.newRelicApplicationId,
      licenseKey: config.newRelicLicenseKey,
      trustKey: config.newRelicTrustKey || config.newRelicAccountId,
    },
  })
}

export function initializeProductionTelemetry(app: App, router: Router, config: NudgerRuntimeConfig): void {
  if (!import.meta.env.PROD) return

  initializeSentry(app, config)
  if (config.gaMeasurementId) initializeGoogleAnalytics(config.gaMeasurementId, router)
  initializeNewRelic(config)
}
