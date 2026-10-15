import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import App from './App.vue'
import { createNudgerRouter } from './router'
import { createNudgerVuetify } from './plugins/vuetify'
import { PUBLIC_PAGES, SITE_ORIGIN } from './data/publicPages'
import { renderSeoHead } from './lib/seoMetadata'

export { PUBLIC_PAGES, SITE_ORIGIN, renderSeoHead }

/** Build-time only. Fresh instances never restore sessions or call backend APIs. */
export async function renderPublicPage(path: string) {
  const app = createSSRApp(App)
  const router = createNudgerRouter(createMemoryHistory())
  const vuetify = createNudgerVuetify()
  app.use(createPinia()).use(router).use(vuetify)
  await router.push(path)
  await router.isReady()
  const html = await renderToString(app)
  return { html, head: renderSeoHead(router.currentRoute.value), themeStyles: vuetify.theme.styles.value }
}
