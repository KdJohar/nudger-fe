<script setup lang="ts">
import PublicIcon from './PublicIcon.vue'
</script>

<template>
  <section class="m-section m-wrap" aria-labelledby="alternatives-title">
    <div class="m-section-heading">
      <p class="m-eyebrow">Find your kind of connection</p>
      <h2 id="alternatives-title">Looking for a Pushover<br />or ntfy alternative?</h2>
      <p>Nudge brings discovery, subscriptions and a creator workspace together.<br class="m-desktop-break" /> A useful fit when your updates have an audience.</p>
    </div>
    <div class="m-use-grid">
      <article>
        <PublicIcon name="globe" />
        <h3>Be found.<br />Be followed.</h3>
        <p>People discover participating creators and platforms inside Nudge and choose who to subscribe to. Your profile is a place to start that connection.</p>
      </article>
      <article>
        <PublicIcon name="arrow" />
        <h3>See what<br />connects.</h3>
        <p>Your workspace brings audience totals and delivery outcomes together. Rich notifications also report unique clicks and click-through rate in periodically updated statistics.</p>
      </article>
      <article>
        <PublicIcon name="lock" />
        <h3>An audience.<br />Their privacy.</h3>
        <p>Creators and platforms see aggregate results, without subscriber names, email addresses or individual click histories. People stay in control of their subscriptions.</p>
      </article>
    </div>
    <div class="m-source-note">
      <p>Different tools suit different needs. <a href="https://pushover.net/api/subscriptions">Pushover supports subscription links and group broadcasts.</a> <a href="https://docs.ntfy.sh/">ntfy uses topic subscriptions</a> and offers <a href="https://docs.ntfy.sh/install/">optional self-hosting.</a></p>
    </div>
    <a class="m-text-link" href="/merchant">Explore Nudge for creators &amp; platforms <span aria-hidden="true">→</span></a>
  </section>
</template>
