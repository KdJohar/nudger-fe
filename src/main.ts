import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vuetify } from './plugins/vuetify'
import { getNudgerConfig } from './config'
import { initializeProductionTelemetry } from './lib/productionTelemetry'
import './styles/main.css'

const app = createApp(App)
const runtimeConfig = getNudgerConfig()

initializeProductionTelemetry(app, router, runtimeConfig)

app
  .use(createPinia())
  .use(router)
  .use(vuetify)
  .mount('#app')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error: unknown) => {
      console.warn('Unable to register the Nudger service worker.', error)
    })
  }, { once: true })
}
