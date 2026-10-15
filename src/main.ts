import { createApp, createSSRApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vuetify } from './plugins/vuetify'
import { getNudgerConfig } from './config'
import { initializeProductionTelemetry } from './lib/productionTelemetry'
import './styles/main.css'

const isPrerendered = document.querySelector('#app')?.hasAttribute('data-prerendered')
const app = isPrerendered ? createSSRApp(App) : createApp(App)
const runtimeConfig = getNudgerConfig()

initializeProductionTelemetry(app, router, runtimeConfig)

app
  .use(createPinia())
  .use(router)
  .use(vuetify)

// Lazy public routes must resolve before hydrating their existing HTML.
void router.isReady().then(() => app.mount('#app'))

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
      console.warn('Unable to register the Nudger service worker.', error)
    })
  }, { once: true })
}
