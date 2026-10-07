import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/PublicLayout.vue'),
      meta: { public: true },
      children: [
        { path: '', name: 'home', component: () => import('../views/LandingView.vue'), meta: { title: 'Plug & Nudge | Never miss what matters' } },
        { path: 'for-nudgers', name: 'for-nudgers', component: () => import('../views/ForNudgersView.vue'), meta: { title: 'For creators & developers | Plug & Nudge' } },
        { path: 'privacy', name: 'privacy', component: () => import('../views/PublicInfoView.vue'), props: { topic: 'privacy' }, meta: { title: 'Privacy Policy | Plug & Nudge' } },
        { path: 'terms', name: 'terms', component: () => import('../views/PublicInfoView.vue'), props: { topic: 'terms' }, meta: { title: 'Terms of Service | Plug & Nudge' } },
        { path: 'security', name: 'security', component: () => import('../views/PublicInfoView.vue'), props: { topic: 'security' }, meta: { title: 'Security Statement | Plug & Nudge' } },
      ],
    },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: 'Sign in to Nudger', publicOnly: true } },
    { path: '/auth/callback', name: 'auth-callback', component: () => import('../views/AuthCallbackView.vue'), meta: { title: 'Finishing sign in' } },
    { path: '/onboarding', name: 'onboarding', component: () => import('../views/OnboardingView.vue'), meta: { title: 'Set up your profile', requiresAuth: true } },
    { path: '/pending', name: 'pending', component: () => import('../views/PendingView.vue'), meta: { title: 'Profile review', requiresAuth: true } },
    {
      path: '/workspace',
      component: () => import('../layouts/AppShell.vue'),
      meta: { requiresActive: true },
      children: [
        { path: '', redirect: '/audience' },
        { path: '/dashboard', name: 'dashboard', redirect: '/audience' },
        { path: '/audience', name: 'audience', component: () => import('../views/AudienceView.vue'), meta: { title: 'Audience' } },
        { path: '/compose', name: 'compose', component: () => import('../views/ComposeNudgeView.vue'), meta: { title: 'New nudge' } },
        { path: '/nudges', name: 'nudges', component: () => import('../views/NudgesView.vue'), meta: { title: 'Nudges' } },
        { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { title: 'Profile' } },
        { path: '/token', name: 'token', component: () => import('../views/TokenView.vue'), meta: { title: 'API access', platformOnly: true } },
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
  if (to.meta.requiresActive && (!profile || !profile.is_active)) return profileRoute
  if (to.meta.platformOnly && profile?.profile_type !== 'platform') return '/audience'
  return true
})

router.afterEach((to) => {
  document.title = typeof to.meta.title === 'string' ? to.meta.title : 'Plug & Nudge'
})

export default router
