<script setup lang="ts">
import { computed } from 'vue'

import { useAuth } from '../composables/useAuth'
import AudienceOverview from './AudienceOverview.vue'
import DashboardShell from './DashboardShell.vue'

const { state } = useAuth()

const merchantProfile = computed(() => state.merchantProfile)

const firstName = computed(() => {
  const name = state.user?.name?.trim()
  return name?.split(/\s+/)[0] || 'there'
})
</script>

<template>
  <DashboardShell>
    <section class="dashboard-overview" aria-labelledby="dashboard-heading">
      <div class="dashboard-overview__heading">
        <div>
          <p class="eyebrow"><span class="eyebrow__dot"></span> Workspace overview</p>
          <h1 id="dashboard-heading">Welcome, {{ firstName }}.</h1>
          <p>See how your notification workspace is shaping up. Your first sending tools are coming next.</p>
        </div>

        <div v-if="merchantProfile" class="dashboard-profile-chip">
          <img :src="merchantProfile.profile_image_url" :alt="`${merchantProfile.display_name} profile picture`" />
          <span>
            <strong>{{ merchantProfile.display_name }}</strong>
            <small>@{{ merchantProfile.nudger_id }} · {{ merchantProfile.profile_type }}</small>
          </span>
        </div>
      </div>

      <AudienceOverview />
    </section>
  </DashboardShell>
</template>

<style scoped>
.dashboard-overview {
  display: grid;
  gap: 34px;
}

.dashboard-overview__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
}

.dashboard-overview__heading > div:first-child {
  max-width: 760px;
}

.dashboard-overview h1 {
  max-width: 720px;
  margin: 0;
  color: var(--color-text);
  font-size: clamp(2.8rem, 6vw, 5.2rem);
  font-weight: 850;
  letter-spacing: -0.075em;
  line-height: 0.96;
  text-wrap: balance;
}

.dashboard-overview__heading > div:first-child > p:last-child {
  max-width: 580px;
  margin: 24px 0 0;
  color: var(--color-text-muted);
  font-size: 16px;
  line-height: 1.6;
}

.dashboard-profile-chip {
  display: flex;
  max-width: 260px;
  align-items: center;
  gap: 12px;
  padding: 10px 13px 10px 10px;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface-strong);
}

.dashboard-profile-chip img {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 14px;
  object-fit: cover;
}

.dashboard-profile-chip span {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.dashboard-profile-chip strong,
.dashboard-profile-chip small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-profile-chip strong {
  color: var(--color-text);
  font-size: 12px;
}

.dashboard-profile-chip small {
  color: var(--color-text-muted);
  font-size: 10px;
  text-transform: capitalize;
}

@media (max-width: 900px) {
  .dashboard-overview__heading {
    display: grid;
  }

  .dashboard-profile-chip {
    max-width: 360px;
  }

}

@media (prefers-reduced-motion: reduce) {
  .dashboard-overview {
    scroll-behavior: auto;
  }
}
</style>
