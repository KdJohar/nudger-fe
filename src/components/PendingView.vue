<script setup lang="ts">
import { computed } from 'vue'

import { useAuth } from '../composables/useAuth'
import IconGlyph from './IconGlyph.vue'
import WorkspaceShell from './WorkspaceShell.vue'

const { state } = useAuth()
const merchantProfile = computed(() => state.merchantProfile)
</script>

<template>
  <WorkspaceShell>
    <section v-if="merchantProfile" class="status-card" aria-labelledby="status-heading">
      <div class="status-card__icon" aria-hidden="true"><IconGlyph name="bell" /></div>
      <p class="eyebrow"><span class="eyebrow__dot"></span> Profile review</p>
      <h1 id="status-heading">Your profile is waiting for approval.</h1>
      <p class="status-card__copy">Your merchant profile is inactive right now. Please wait until it is approved before sending updates through Nudger.</p>

      <div class="status-card__profile">
        <img class="status-card__image" :src="merchantProfile.profile_image_url" :alt="`${merchantProfile.display_name} profile picture`" />
        <div>
          <strong>{{ merchantProfile.display_name }}</strong>
          <span>@{{ merchantProfile.nudger_id }}</span>
          <small>{{ merchantProfile.profile_type }}</small>
        </div>
      </div>

      <p class="status-card__note" role="status">We’ll make your sending workspace available as soon as your profile becomes active.</p>
    </section>
  </WorkspaceShell>
</template>

<style scoped>
.status-card {
  width: min(100%, 760px);
  padding: clamp(28px, 6vw, 64px);
  border: 1px solid #f59e0b;
  border-radius: 32px;
  background: #fff7ed;
  box-shadow: var(--shadow-soft);
}

.status-card__icon {
  display: grid;
  width: 60px;
  height: 60px;
  place-items: center;
  border-radius: 19px;
  color: #9a3412;
  background: #fed7aa;
}

.status-card__icon .icon-glyph {
  width: 28px;
  height: 28px;
}

.status-card .eyebrow {
  margin-top: 28px;
  color: #9a3412;
}

.status-card h1 {
  max-width: 640px;
  margin: 12px 0 0;
  color: #7c2d12;
  font-size: clamp(2.4rem, 6vw, 5rem);
  font-weight: 850;
  letter-spacing: -0.07em;
  line-height: 0.98;
  text-wrap: balance;
}

.status-card__copy {
  max-width: 600px;
  margin: 22px 0 0;
  color: #9a3412;
  font-size: 16px;
  line-height: 1.65;
}

.status-card__profile {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 36px;
  padding: 14px;
  border: 1px solid rgba(154, 52, 18, 0.22);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.52);
}

.status-card__image {
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  border-radius: 18px;
  object-fit: cover;
}

.status-card__profile div {
  display: grid;
  gap: 3px;
}

.status-card__profile strong {
  color: #7c2d12;
  font-size: 16px;
}

.status-card__profile span,
.status-card__profile small {
  color: #9a3412;
  font-size: 12px;
}

.status-card__profile small {
  text-transform: capitalize;
}

.status-card__note {
  margin: 22px 0 0;
  color: #7c2d12;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.55;
}

@media (max-width: 520px) {
  .status-card__profile {
    align-items: flex-start;
  }
}
</style>
