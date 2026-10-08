import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { updateSeo } from '../lib/seo'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../layouts/PublicLayout.vue'),
      meta: { public: true },
      children: [
        { path: '', name: 'home', component: () => import('../views/LandingView.vue'), meta: { title: 'Plug & Nudge | Never miss what matters', seo: { description: 'Intentional notifications for your lock screen. Plug & Nudge helps people receive only the updates they choose.', robots: 'index,follow' } } },
        { path: 'for-nudgers', name: 'for-nudgers', component: () => import('../views/ForNudgersView.vue'), meta: { title: 'For creators & developers | Plug & Nudge', seo: { description: 'Send useful updates to subscribers who chose to hear from you with the Plug & Nudge Nudger workspace.', robots: 'index,follow' } } },
        { path: 'privacy', name: 'privacy', component: () => import('../views/PublicInfoView.vue'), props: { topic: 'privacy' }, meta: { title: 'Privacy Policy | Plug & Nudge', seo: { description: 'Learn how Plug & Nudge is designed to keep receiver identity separate from channel subscriber counts.', robots: 'index,follow' } } },
        { path: 'terms', name: 'terms', component: () => import('../views/PublicInfoView.vue'), props: { topic: 'terms' }, meta: { title: 'Terms of Service | Plug & Nudge', seo: { description: 'Read the Plug & Nudge Terms of Service and current publication status.', robots: 'index,follow' } } },
        { path: 'security', name: 'security', component: () => import('../views/PublicInfoView.vue'), props: { topic: 'security' }, meta: { title: 'Security Statement | Plug & Nudge', seo: { description: 'Read about the security principles behind the Plug & Nudge receiver and sender experience.', robots: 'index,follow' } } },
      ],
    },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { title: 'Sign in to Nudger', publicOnly: true, seo: { description: 'Sign in to the Plug & Nudge Nudger workspace.', robots: 'noindex,nofollow' } } },
    { path: '/auth/callback', name: 'auth-callback', component: () => import('../views/AuthCallbackView.vue'), meta: { title: 'Finishing sign in', seo: { description: 'Finishing Plug & Nudge sign in.', robots: 'noindex,nofollow' } } },
    { path: '/onboarding', name: 'onboarding', component: () => import('../views/OnboardingView.vue'), meta: { title: 'Set up your profile', requiresAuth: true, seo: { description: 'Set up your Plug & Nudge Nudger profile.', robots: 'noindex,nofollow' } } },
    { path: '/pending', name: 'pending', component: () => import('../views/PendingView.vue'), meta: { title: 'Profile review', requiresAuth: true, seo: { description: 'Your Plug & Nudge profile review status.', robots: 'noindex,nofollow' } } },
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
  if (to.meta.requiresActive && (!profile || !profile.is_active)) return profileRoute
  if (to.meta.platformOnly && profile?.profile_type !== 'platform') return '/audience'
  return true
})

router.afterEach((to) => {
  updateSeo({ path: to.path, meta: to.meta })
})

export default router
