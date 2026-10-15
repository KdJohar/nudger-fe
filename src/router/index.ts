import { createRouter, createMemoryHistory, createWebHistory, type RouterHistory } from 'vue-router'
import { PUBLIC_PAGES } from '../data/publicPages'
import { useAuth } from '../composables/useAuth'
import { updateSeo } from '../lib/seo'
import { getPendingProfileRedirect } from '../lib/profileRoute'

export function createNudgerRouter(history: RouterHistory = import.meta.env.SSR ? createMemoryHistory() : createWebHistory(import.meta.env.BASE_URL)) {
  const router = createRouter({
    history,
    routes: [
      {
        path: '/',
        component: () => import('../layouts/PublicLayout.vue'),
        meta: { public: true },
        children: [
          ...PUBLIC_PAGES.map(page => ({
            path: page.path.slice(1), name: page.name,
            component: page.name === 'home' ? () => import('../views/LandingView.vue')
              : page.name === 'for-nudgers' ? () => import('../views/ForNudgersView.vue')
                : () => import('../views/PublicInfoView.vue'),
            props: 'topic' in page ? { topic: page.topic } : undefined,
            meta: { title: page.title, seo: { description: page.description, robots: 'index,follow' } },
          })),
          { path: ':pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Page not found | Plug & Nudge', seo: { description: 'This page could not be found. Explore Plug & Nudge or return to the homepage.', robots: 'noindex,nofollow' } } },
        ],
      },
      { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: 'Sign in to Nudger', publicOnly: true, seo: { description: 'Sign in to the Plug & Nudge Nudger workspace.', robots: 'noindex,nofollow' } } },
      { path: '/auth/callback', name: 'auth-callback', component: () => import('../views/AuthCallbackView.vue'), meta: { title: 'Finishing sign in', seo: { description: 'Finishing Plug & Nudge sign in.', robots: 'noindex,nofollow' } } },
      { path: '/onboarding', name: 'onboarding', component: () => import('../views/OnboardingView.vue'), meta: { title: 'Set up your profile', requiresAuth: true, seo: { description: 'Set up your Plug & Nudge Nudger profile.', robots: 'noindex,nofollow' } } },
      { path: '/pending', name: 'pending', component: () => import('../views/PendingView.vue'), meta: { title: 'Profile review', requiresAuth: true, requiresPendingProfile: true, seo: { description: 'Your Plug & Nudge profile review status.', robots: 'noindex,nofollow' } } },
      {
        path: '/workspace',
        component: () => import('../layouts/AppShell.vue'),
        meta: { requiresActive: true },
        children: [
          { path: '', redirect: '/audience' },
          { path: '/dashboard', name: 'dashboard', redirect: '/audience' },
          { path: '/audience', name: 'audience', component: () => import('../views/AudienceView.vue'), meta: { title: 'Audience', seo: { description: 'Private audience analytics for your Plug & Nudge workspace.', robots: 'noindex,nofollow' } } },
          { path: '/compose', name: 'compose', component: () => import('../views/ComposeNudgeView.vue'), meta: { title: 'New nudge', seo: { description: 'Create a new Plug & Nudge broadcast.', robots: 'noindex,nofollow' } } },
          { path: '/nudges', name: 'nudges', component: () => import('../views/NudgesView.vue'), meta: { title: 'Nudges', seo: { description: 'Review your Plug & Nudge notification history.', robots: 'noindex,nofollow' } } },
          { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { title: 'Profile', seo: { description: 'Manage your Plug & Nudge profile.', robots: 'noindex,nofollow' } } },
          { path: '/token', name: 'token', component: () => import('../views/TokenView.vue'), meta: { title: 'API access', platformOnly: true, seo: { description: 'Manage private API access for your Plug & Nudge platform workspace.', robots: 'noindex,nofollow' } } },
        ],
      },
    ],
    scrollBehavior: (to) => to.hash ? { el: to.hash, top: 80, behavior: 'smooth' } : { top: 0 },
  })

  router.beforeEach(async (to) => {
    if (to.matched.some((record) => record.meta.public)) return true
    const { state, initializeAuth } = useAuth()
    await initializeAuth()
    const hasUser = Boolean(state.user && state.accessToken)
    const profile = state.merchantProfile
    const profileRoute = !hasUser ? '/login' : !profile ? '/onboarding' : !profile.is_active ? '/pending' : '/audience'
    if (to.meta.publicOnly && hasUser) return profileRoute
    if (to.meta.requiresAuth && !hasUser) return { path: '/login', query: { return_to: to.fullPath } }
    if (to.meta.requiresPendingProfile) {
      const pendingRedirect = getPendingProfileRedirect(profile)
      if (pendingRedirect) return pendingRedirect
    }
    if (to.meta.requiresActive && (!profile || !profile.is_active)) return profileRoute
    if (to.meta.platformOnly && profile?.profile_type !== 'platform') return '/audience'
    return true
  })

  router.afterEach((to, _from, failure) => {
    if (!failure && typeof document !== 'undefined') updateSeo({ path: to.path, meta: to.meta })
  })

  return router
}

export default createNudgerRouter()
