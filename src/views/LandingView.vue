<script setup lang="ts">
import PhonePreview from '../components/ui/PhonePreview.vue'

const valueBadges = [
  '100% free forever for receivers',
  'No spam. Zero algorithms.',
  'No personal data shared with channels',
]

const controlFeatures = [
  { icon: 'mdi-account-check-outline', title: 'An invitation, never an interruption.', copy: 'Find and subscribe to channels yourself. No accidental opt-ins or default spam.' },
  { icon: 'mdi-tune-variant', title: 'The details are up to you.', copy: 'Turn on Going Live. Turn off Weekly Vlog. Follow only the topics that matter.' },
  { icon: 'mdi-inbox-outline', title: 'Quiet is a setting.', copy: 'Mute a channel instantly or send its updates to your Nudge Inbox to read later.' },
]

const privacyFeatures = [
  { icon: 'mdi-account-off-outline', title: 'No personal details for senders', copy: 'Your email, phone number, and name stay out of creators’ and channels’ hands.' },
  { icon: 'mdi-account-group-outline', title: 'A count, not a contact list', copy: 'Channels see subscriber totals, not a list of the people behind them.' },
  { icon: 'mdi-delete-outline', title: 'Leave on your terms', copy: 'Unsubscribe whenever you want. You can also request to delete your account.' },
]

const steps = [
  { number: '01', icon: 'mdi-magnify', title: 'Search & find', copy: 'Find a creator, store, or personal webhook you actually want to hear from.' },
  { number: '02', icon: 'mdi-tune-variant', title: 'Choose channels', copy: 'Pick the exact kinds of updates you want. Nothing gets added for you.' },
  { number: '03', icon: 'mdi-bell-check-outline', title: 'Receive direct nudges', copy: 'Updates arrive on your lock screen or in your quiet inbox, without a feed in the middle.' },
]
</script>

<template>
  <div class="site-page">
    <section class="site-hero" aria-labelledby="hero-heading">
      <div class="site-wrap site-hero__grid">
        <div class="site-hero__copy">
          <div class="site-kicker"><span class="site-kicker__dot" /> A quieter way to stay close</div>
          <h1 id="hero-heading">Never miss what matters.<br /><span>Zero unwanted noise.</span></h1>
          <p class="site-hero__lead">A universal notification layer for your lock screen. Subscribe only to the creators, updates, and automated alerts you care about.</p>
          <ul class="site-hero__badges" aria-label="Why receivers choose Plug & Nudge">
            <li v-for="badge in valueBadges" :key="badge"><v-icon icon="mdi-check-circle" size="17" />{{ badge }}</li>
          </ul>
          <div class="site-hero__actions"><a class="site-button site-button--primary" href="#get-app">Get the app · Free <v-icon icon="mdi-arrow-down" size="18" /></a><a class="site-button site-button--text" href="#how-it-works">See how it works <v-icon icon="mdi-arrow-right" size="18" /></a></div>
          <p class="site-hero__microcopy">Made for your lock screen, not another feed.</p>
        </div>
        <div class="site-hero__visual"><div class="site-hero__visual-orbit" aria-hidden="true" /><PhonePreview /><div class="site-hero__visual-caption"><v-icon icon="mdi-sparkles" size="16" /> Only what you asked for</div></div>
      </div>
    </section>

    <section id="features" class="site-section site-section--tint" aria-labelledby="features-heading">
      <div class="site-wrap site-feature-grid">
        <div class="site-feature-grid__copy">
          <span class="site-eyebrow">01 / Your space, your rules</span>
          <h2 id="features-heading" class="site-heading">You decide what reaches your lock screen.</h2>
          <p class="site-intro">From the first subscription to the last notification, you stay in control.</p>
          <div class="site-feature-list"><article v-for="feature in controlFeatures" :key="feature.title" class="site-feature-list__item"><span class="site-feature-list__icon"><v-icon :icon="feature.icon" size="22" /></span><div><h3>{{ feature.title }}</h3><p>{{ feature.copy }}</p></div></article></div>
        </div>
        <div class="site-feature-grid__visual"><PhonePreview mode="controls" /><div class="site-feature-grid__caption"><v-icon icon="mdi-hand-pointing-up" size="17" /> Try the switches</div></div>
      </div>
    </section>

    <section id="privacy" class="site-section" aria-labelledby="privacy-heading">
      <div class="site-wrap">
        <div class="site-section-head"><span class="site-eyebrow">02 / Privacy is the point</span><h2 id="privacy-heading" class="site-heading">Your identity stays yours. Period.</h2><p class="site-intro">The connection is direct. Your personal information isn’t part of the handoff.</p></div>
        <div class="site-trust-grid">
          <article class="site-trust-grid__anchor"><div class="site-trust-grid__anchor-icon"><v-icon icon="mdi-shield-lock-outline" size="30" /></div><div><span class="site-trust-grid__overline">PRIVACY LAYER</span><h3>Stay in the loop.<br />Stay out of the list.</h3><p>Subscribe to what you love without handing your personal identity to the channel sending it.</p></div><div class="site-trust-flow" aria-label="Your phone connects through a privacy shield to an anonymous channel subscriber count"><span><v-icon icon="mdi-cellphone" size="22" /> Your phone</span><v-icon icon="mdi-arrow-right" size="18" /><span class="site-trust-flow__shield"><v-icon icon="mdi-shield-check-outline" size="22" /> Privacy shield</span><v-icon icon="mdi-arrow-right" size="18" /><span><v-icon icon="mdi-account-multiple-outline" size="22" /> Count only</span></div></article>
          <article v-for="feature in privacyFeatures" :key="feature.title" class="site-trust-grid__tile"><span class="site-trust-grid__tile-icon"><v-icon :icon="feature.icon" size="23" /></span><div><h3>{{ feature.title }}</h3><p>{{ feature.copy }}</p></div></article>
        </div>
      </div>
    </section>

    <section id="how-it-works" class="site-section site-section--tint" aria-labelledby="steps-heading">
      <div class="site-wrap"><div class="site-section-head"><span class="site-eyebrow">03 / Three simple steps</span><h2 id="steps-heading" class="site-heading">A better signal, in three taps.</h2><p class="site-intro">No feed to scroll. No ranking system deciding for you. Just the updates you chose.</p></div><div class="site-steps"><article v-for="step in steps" :key="step.number" class="site-step"><div class="site-step__top"><span>{{ step.number }}</span><v-icon :icon="step.icon" size="24" /></div><h3>{{ step.title }}</h3><p>{{ step.copy }}</p></article></div></div>
    </section>

    <section id="get-app" class="site-section site-download" aria-labelledby="download-heading">
      <div class="site-wrap site-download__grid"><div><span class="site-eyebrow">The calm is coming</span><h2 id="download-heading" class="site-heading">A little less noise.<br />A lot more meaning.</h2><p class="site-intro">Plug &amp; Nudge for receivers is on its way. The app will be free to use.</p></div><div class="site-download__stores" aria-label="App availability"><div class="store-badge" aria-label="App Store coming soon"><v-icon icon="mdi-apple" size="28" /><span><small>Coming soon to the</small><strong>App Store</strong></span></div><div class="store-badge" aria-label="Google Play coming soon"><v-icon icon="mdi-google-play" size="28" /><span><small>Coming soon to</small><strong>Google Play</strong></span></div></div></div>
    </section>

    <section class="site-section site-section--callout" aria-labelledby="callout-heading"><div class="site-wrap site-callout"><div><span class="site-eyebrow">On the other side of the nudge</span><h2 id="callout-heading" class="site-heading">Want to send intentional Nudges?</h2><p class="site-intro">Reach your most dedicated followers or send automated push notifications from your own code.</p></div><div class="site-callout__actions"><RouterLink class="site-button site-button--light" to="/for-nudgers#creators">For creators &amp; channels <v-icon icon="mdi-arrow-up-right" size="18" /></RouterLink><RouterLink class="site-button site-button--outline" to="/for-nudgers#developers">For developers &amp; webhooks <v-icon icon="mdi-arrow-up-right" size="18" /></RouterLink></div></div></section>
  </div>
</template>
