<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import AuthCallbackView from './components/AuthCallbackView.vue'
import DashboardView from './components/DashboardView.vue'
import FlowIllustration from './components/FlowIllustration.vue'
import IconGlyph from './components/IconGlyph.vue'
import LoginView from './components/LoginView.vue'
import NudgesView from './components/NudgesView.vue'
import OnboardingView from './components/OnboardingView.vue'
import PendingView from './components/PendingView.vue'
import { initializeAuth, useAuth } from './composables/useAuth'
import { getNudgerConfig } from './config'
import { getCurrentPath, navigateTo } from './lib/navigation'

const config = getNudgerConfig()
const auth = useAuth()
const currentPath = ref(getCurrentPath())
const isLoginRoute = computed(() => currentPath.value === '/login')
const isCallbackRoute = computed(() => currentPath.value === '/auth/callback')
const isDashboardRoute = computed(() => currentPath.value === '/dashboard')
const isNudgesRoute = computed(() => currentPath.value === '/nudges')
const isOnboardingRoute = computed(() => currentPath.value === '/onboarding')
const isPendingRoute = computed(() => currentPath.value === '/pending')
const isMenuOpen = ref(false)
const isDarkMode = ref(true)

const navigationItems = [
  { label: 'Use cases', href: '#use-cases' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Get the app', href: '#download' },
]

const platformExamples = ['Order confirmed', 'Appointment reminder', 'Service or account alert']
const creatorExamples = ['No stream tonight', 'The session moved to Friday', 'We will be live at 8 PM']

const platformUseCases = [
  {
    icon: 'layers' as const,
    title: 'Transactional updates',
    description: 'Keep customers informed about the moments that matter after they take action.',
    examples: ['Order confirmed', 'Appointment reminder', 'Service or account alert'],
  },
  {
    icon: 'link' as const,
    title: 'Connected to your product',
    description: 'Plug into the platform you already run instead of building another notification system.',
    examples: ['Use your existing events', 'Keep your brand and message', 'Send only with permission'],
  },
]

const creatorUseCases = [
  {
    icon: 'play' as const,
    title: 'Tier goes live',
    description: 'Let the right tier know the stream is live, right when it begins.',
    examples: ['Gold tier is live now', 'Early access has started', 'Join the stream'],
  },
  {
    icon: 'bell' as const,
    title: 'Plans change',
    description: 'If a stream does not happen, tell people clearly so they are not left guessing.',
    examples: ['No stream tonight', 'The session moved to Friday', 'We will be live at 8 PM'],
  },
]

const journeySteps = [
  {
    number: '01',
    title: 'A platform or creator joins Nudger',
    description: 'They register and manage their notification operation from the web.',
    icon: 'globe' as const,
  },
  {
    number: '02',
    title: 'People choose Nudgee',
    description: 'Customers and communities download Nudgee and choose who they want to hear from.',
    icon: 'device' as const,
  },
  {
    number: '03',
    title: 'Nudger sends the moment',
    description: 'A useful event becomes a timely nudge, with the right audience and context.',
    icon: 'send' as const,
  },
  {
    number: '04',
    title: 'Nudgee delivers it',
    description: 'The update reaches the person even when the original website is closed.',
    icon: 'bell' as const,
  },
]

function handleNavigation(): void {
  isMenuOpen.value = false
}

function applyColorMode(): void {
  document.documentElement.style.colorScheme = isDarkMode.value ? 'dark' : 'light'
}

function handleColorModeToggle(): void {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('nudger-color-mode', isDarkMode.value ? 'dark' : 'light')
  applyColorMode()
}

function closeMenuOnEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    isMenuOpen.value = false
  }
}

function getActionUrl(url: string, fallback: string): string {
  return url || fallback
}

function isWorkspaceRoute(path: string): boolean {
  return path === '/dashboard' || path === '/nudges' || path === '/onboarding' || path === '/pending'
}

function isProfileGateRoute(path: string): boolean {
  return path === '/dashboard' || path === '/onboarding' || path === '/pending'
}

function getProfileRoute(): string {
  const profile = auth.state.merchantProfile
  if (!profile) {
    return '/onboarding'
  }
  return profile.is_active ? '/dashboard' : '/pending'
}

function handleRouteChange(): void {
  currentPath.value = getCurrentPath()

  if (!auth.state.isInitialized) {
    return
  }

  if (!auth.state.user) {
    if (isWorkspaceRoute(currentPath.value)) {
      navigateTo('/login', true)
    }
    return
  }

  const profileRoute = getProfileRoute()
  const nudgesNeedProfileApproval = isNudgesRoute.value && profileRoute !== '/dashboard'
  if ((isLoginRoute.value || isProfileGateRoute(currentPath.value) || nudgesNeedProfileApproval) && currentPath.value !== profileRoute) {
    navigateTo(profileRoute, true)
  }
}

onMounted(() => {
  const savedColorMode = localStorage.getItem('nudger-color-mode')
  if (savedColorMode === 'light' || savedColorMode === 'dark') {
    isDarkMode.value = savedColorMode === 'dark'
  } else {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  applyColorMode()
  window.addEventListener('popstate', handleRouteChange)
  watch(
    [
      () => auth.state.isInitialized,
      () => auth.state.user?.id,
      () => auth.state.merchantProfile?.id,
      () => auth.state.merchantProfile?.is_active,
    ],
    handleRouteChange,
  )
  void initializeAuth().then(handleRouteChange)
})

onUnmounted(() => {
  window.removeEventListener('popstate', handleRouteChange)
})
</script>

<template>
  <div id="top" class="site-shell" :class="{ 'site-shell--light': !isDarkMode, dark: isDarkMode }" @keydown="closeMenuOnEscape">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <LoginView v-if="isLoginRoute && auth.state.isInitialized" :is-dark-mode="isDarkMode" @toggle-color-mode="handleColorModeToggle" />

    <AuthCallbackView v-else-if="isCallbackRoute" />

    <DashboardView v-else-if="isDashboardRoute && auth.state.isInitialized && auth.state.user" />

    <NudgesView v-else-if="isNudgesRoute && auth.state.isInitialized && auth.state.user" />

    <OnboardingView v-else-if="isOnboardingRoute && auth.state.isInitialized && auth.state.user" />

    <PendingView v-else-if="isPendingRoute && auth.state.isInitialized && auth.state.user" />

    <main v-else-if="isLoginRoute || isDashboardRoute || isNudgesRoute || isOnboardingRoute || isPendingRoute" class="auth-loading" aria-live="polite">
      <div class="auth-loading__spinner" aria-hidden="true"></div>
      <p>Restoring your Nudger session…</p>
    </main>

    <template v-else>
      <header class="site-header">
      <div class="site-header__inner">
        <a class="brand" href="#top" aria-label="Plug and Nudge home" @click="handleNavigation">
          <span class="brand__mark" aria-hidden="true">
            <img class="brand__image" src="/nudge-logo.png" alt="" />
          </span>
          <span class="brand__name">Plug <span>&amp;</span> Nudge</span>
        </a>

        <button
          class="icon-button site-header__menu-button"
          type="button"
          :aria-expanded="isMenuOpen"
          aria-controls="primary-navigation"
          aria-label="Toggle navigation"
          @click="isMenuOpen = !isMenuOpen"
        >
          <IconGlyph :name="isMenuOpen ? 'close' : 'menu'" />
        </button>

        <nav id="primary-navigation" class="site-nav" :class="{ 'site-nav--open': isMenuOpen }" aria-label="Primary navigation">
          <a v-for="item in navigationItems" :key="item.href" class="site-nav__link" :href="item.href" @click="handleNavigation">
            {{ item.label }}
          </a>
          <a class="button button--small button--outline" :href="getActionUrl(config.nudgerLoginUrl, '/login')" @click="handleNavigation">
            <IconGlyph name="login" />
            Log in to Nudger
          </a>
          <button class="mode-button" type="button" :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'" @click="handleColorModeToggle">
            <IconGlyph :name="isDarkMode ? 'sun' : 'moon'" />
            <span>{{ isDarkMode ? 'Light mode' : 'Dark mode' }}</span>
          </button>
        </nav>
      </div>
      </header>

    <main id="main-content">
      <section class="hero section-frame" aria-labelledby="hero-heading">
        <div class="hero__content">
          <p class="eyebrow"><span class="eyebrow__dot"></span> One shared notification experience</p>
          <h1 id="hero-heading" class="hero__heading">The right nudge, right when it matters.</h1>
          <p class="hero__copy">
            Plug &amp; Nudge helps platforms and creators reach people with useful updates—without asking every business to build its own mobile app.
          </p>
          <div class="hero__actions">
            <a class="button button--primary" :href="getActionUrl(config.nudgerRegisterUrl, '#get-started')">
              Start with Nudger
              <IconGlyph name="arrow-up-right" />
            </a>
            <a class="text-link" href="#how-it-works">
              See how it works
              <IconGlyph name="arrow-up-right" />
            </a>
          </div>
          <div class="hero__proof" aria-label="Product benefits">
            <span><IconGlyph name="check" /> Permission-based</span>
            <span><IconGlyph name="check" /> Built for web-first teams</span>
          </div>
        </div>

        <div class="hero__visual" aria-label="Examples of a creator and platform notification journey">
          <div class="hero__visual-caption">
            <span class="hero__visual-caption-dot"></span>
            From event to nudge
          </div>
          <FlowIllustration kind="creator" />
          <div class="hero__visual-note"><IconGlyph name="device" /> One Nudgee app. Many useful moments.</div>
        </div>
      </section>

      <section id="use-cases" class="section-frame section-frame--light" aria-labelledby="use-cases-heading">
        <div class="section-heading">
          <p class="eyebrow eyebrow--dark"><span class="eyebrow__dot"></span> Built around real moments</p>
          <h2 id="use-cases-heading">A notification layer for what people care about.</h2>
          <p>Platforms and creators have different reasons to send a nudge. The experience stays simple for the person receiving it.</p>
        </div>

        <div class="use-case-grid">
          <article class="use-case-panel use-case-panel--platform">
            <div class="use-case-panel__header">
              <div class="icon-tile icon-tile--indigo"><IconGlyph name="layers" /></div>
              <span class="panel-label">For platforms</span>
            </div>
            <h3>Turn product events into helpful updates.</h3>
            <p>From a purchase to a service change, keep customers informed without building a notification infrastructure from scratch.</p>
            <ul class="scenario-list">
              <li v-for="useCase in platformUseCases" :key="useCase.title">
                <span class="scenario-list__icon"><IconGlyph :name="useCase.icon" /></span>
                <span><strong>{{ useCase.title }}</strong><small>{{ useCase.description }}</small></span>
              </li>
            </ul>
            <div class="example-strip" aria-label="Platform notification examples">
              <span v-for="example in platformExamples" :key="example">{{ example }}</span>
            </div>
            <FlowIllustration kind="platform" />
          </article>

          <article class="use-case-panel use-case-panel--creator">
            <div class="use-case-panel__header">
              <div class="icon-tile icon-tile--coral"><IconGlyph name="sparkles" /></div>
              <span class="panel-label">For creators</span>
            </div>
            <h3>Make live moments feel live.</h3>
            <p>Creators can reach the people in the right tier when a stream starts—and communicate clearly when it does not.</p>
            <ul class="scenario-list">
              <li v-for="useCase in creatorUseCases" :key="useCase.title">
                <span class="scenario-list__icon"><IconGlyph :name="useCase.icon" /></span>
                <span><strong>{{ useCase.title }}</strong><small>{{ useCase.description }}</small></span>
              </li>
            </ul>
            <div class="example-strip example-strip--coral" aria-label="Creator notification examples">
              <span v-for="example in creatorExamples" :key="example">{{ example }}</span>
            </div>
            <FlowIllustration kind="creator" />
          </article>
        </div>
      </section>

      <section id="how-it-works" class="section-frame section-frame--dark" aria-labelledby="how-it-works-heading">
        <div class="section-heading section-heading--dark">
          <p class="eyebrow"><span class="eyebrow__dot"></span> One clear flow</p>
          <h2 id="how-it-works-heading">Nudger sends. Nudgee receives.</h2>
          <p>Businesses get a web control center. People get one place to choose the updates they want.</p>
        </div>

        <ol class="journey-grid">
          <li v-for="step in journeySteps" :key="step.number" class="journey-card">
            <div class="journey-card__topline">
              <span class="journey-card__number">{{ step.number }}</span>
              <span class="icon-tile icon-tile--small"><IconGlyph :name="step.icon" /></span>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </li>
        </ol>

        <div class="role-grid">
          <article class="role-card role-card--nudgee">
            <div class="role-card__heading"><span class="role-card__mark"><IconGlyph name="device" /></span><span>Nudgee</span></div>
            <p>The free mobile app for people who want relevant updates from platforms and creators they choose.</p>
            <a class="text-link text-link--light" href="#download">Explore Nudgee <IconGlyph name="arrow-up-right" /></a>
          </article>
          <article class="role-card role-card--nudger">
            <div class="role-card__heading"><span class="role-card__mark"><IconGlyph name="globe" /></span><span>Nudger</span></div>
            <p>The web-only workspace for platforms and creators to connect, manage, and send their updates.</p>
            <a class="text-link text-link--light" :href="getActionUrl(config.nudgerRegisterUrl, '#get-started')">Register for Nudger <IconGlyph name="arrow-up-right" /></a>
          </article>
        </div>
      </section>

      <section id="download" class="section-frame section-frame--light download-section" aria-labelledby="download-heading">
        <div class="download-section__copy">
          <p class="eyebrow eyebrow--dark"><span class="eyebrow__dot"></span> For the people you reach</p>
          <h2 id="download-heading">Nudgee keeps the important stuff close.</h2>
          <p>People install Nudgee once, choose the platforms and creators they care about, and receive updates even when the original website is closed.</p>
          <div class="download-section__points">
            <span><IconGlyph name="check" /> Choose who can reach you</span>
            <span><IconGlyph name="check" /> Keep control of notifications</span>
            <span><IconGlyph name="check" /> Open the source when you are ready</span>
          </div>
        </div>
        <div class="download-card">
          <div class="download-card__icon"><IconGlyph name="device" /></div>
          <p class="panel-label">Download Nudgee</p>
          <h3>One app for the updates you choose.</h3>
          <p class="download-card__copy">Available on the platforms your community already uses.</p>
          <div class="download-card__actions">
            <a
              class="store-button"
              :href="getActionUrl(config.nudgeeIosUrl, '#download')"
              :target="config.nudgeeIosUrl ? '_blank' : undefined"
              :rel="config.nudgeeIosUrl ? 'noopener noreferrer' : undefined"
            >
              <IconGlyph name="store" />
              <span><small>Download on the</small><strong>App Store</strong></span>
            </a>
            <a
              class="store-button"
              :href="getActionUrl(config.nudgeeAndroidUrl, '#download')"
              :target="config.nudgeeAndroidUrl ? '_blank' : undefined"
              :rel="config.nudgeeAndroidUrl ? 'noopener noreferrer' : undefined"
            >
              <IconGlyph name="play" />
              <span><small>Get it on</small><strong>Google Play</strong></span>
            </a>
          </div>
        </div>
      </section>

      <section id="get-started" class="cta-section section-frame" aria-labelledby="cta-heading">
        <div class="cta-section__glow" aria-hidden="true"></div>
        <div class="cta-section__content">
          <p class="eyebrow"><span class="eyebrow__dot"></span> For platforms and creators</p>
          <h2 id="cta-heading">Your next important moment deserves a nudge.</h2>
          <p>Register for Nudger and start thinking about the updates your audience should never miss.</p>
          <div class="hero__actions">
            <a class="button button--primary" :href="getActionUrl(config.nudgerRegisterUrl, '#get-started')">
              Register for Nudger
              <IconGlyph name="arrow-up-right" />
            </a>
            <a class="text-link text-link--light" :href="getActionUrl(config.nudgerLoginUrl, '/login')">
              Already have an account? Log in
              <IconGlyph name="login" />
            </a>
          </div>
        </div>
        <div class="cta-section__signal" aria-hidden="true"><IconGlyph name="send" /></div>
      </section>
    </main>

      <footer class="site-footer">
      <div class="site-footer__inner">
        <a class="brand brand--footer" href="#top" aria-label="Plug and Nudge home">
          <span class="brand__mark" aria-hidden="true">
            <img class="brand__image" src="/nudge-logo.png" alt="" />
          </span>
          <span class="brand__name">Plug <span>&amp;</span> Nudge</span>
        </a>
        <p>Useful updates, delivered with permission.</p>
        <span class="site-footer__copyright">© 2026 Plug &amp; Nudge</span>
      </div>
      </footer>
    </template>
  </div>
</template>
