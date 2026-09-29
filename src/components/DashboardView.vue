<script setup lang="ts">
import { computed } from 'vue'

import { useAuth } from '../composables/useAuth'
import IconGlyph from './IconGlyph.vue'
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

      <div class="dashboard-stat-grid" aria-label="Workspace summary">
        <article class="dashboard-stat-card">
          <div class="dashboard-stat-card__icon dashboard-stat-card__icon--coral"><IconGlyph name="users" /></div>
          <p>Audience</p>
          <strong>—</strong>
          <small>Subscribers will appear here.</small>
        </article>
        <article class="dashboard-stat-card">
          <div class="dashboard-stat-card__icon dashboard-stat-card__icon--indigo"><IconGlyph name="send" /></div>
          <p>Nudges sent</p>
          <strong>—</strong>
          <small>Your first send is still ahead.</small>
        </article>
        <article class="dashboard-stat-card">
          <div class="dashboard-stat-card__icon dashboard-stat-card__icon--green"><IconGlyph name="bell" /></div>
          <p>Delivery rate</p>
          <strong>—</strong>
          <small>Delivery insights will follow.</small>
        </article>
      </div>
    </section>

    <section class="dashboard-panel-grid" aria-label="Workspace activity">
      <article class="dashboard-panel dashboard-panel--wide">
        <div class="dashboard-panel__heading">
          <div>
            <p class="panel-label">Getting started</p>
            <h2>Your workspace is ready.</h2>
          </div>
          <span class="dashboard-panel__badge"><IconGlyph name="sparkles" /> Profile active</span>
        </div>

        <div class="dashboard-steps">
          <div class="dashboard-step dashboard-step--complete">
            <span class="dashboard-step__number"><IconGlyph name="check" /></span>
            <div><strong>Create your profile</strong><small>Your identity is ready for every nudge.</small></div>
          </div>
          <div class="dashboard-step">
            <span class="dashboard-step__number">02</span>
            <div><strong>Connect your audience</strong><small>Let Nudgee subscribers choose your updates.</small></div>
          </div>
          <div class="dashboard-step">
            <span class="dashboard-step__number">03</span>
            <div><strong>Send your first nudge</strong><small>Share the moment when your sending tools arrive.</small></div>
          </div>
        </div>
      </article>

      <article class="dashboard-panel dashboard-panel--activity">
        <div class="dashboard-panel__heading">
          <div>
            <p class="panel-label">Recent activity</p>
            <h2>Nothing here yet.</h2>
          </div>
          <div class="dashboard-panel__empty-icon"><IconGlyph name="bell" /></div>
        </div>
        <p class="dashboard-panel__copy">When you send a transactional update or a creator announcement, your latest moments will show up here.</p>
        <div class="dashboard-panel__empty-state"><IconGlyph name="send" /><span>Your activity feed will appear here.</span></div>
      </article>
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

.dashboard-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.dashboard-stat-card {
  min-height: 176px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 22px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.dashboard-stat-card__icon,
.dashboard-panel__empty-icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 18px;
}

.dashboard-stat-card__icon .icon-glyph,
.dashboard-panel__empty-icon .icon-glyph {
  width: 24px;
  height: 24px;
}

.dashboard-stat-card__icon--coral {
  color: #ffad9b;
  background: rgba(255, 107, 74, 0.15);
}

.dashboard-stat-card__icon--indigo {
  color: #b9bdff;
  background: rgba(79, 70, 229, 0.18);
}

.dashboard-stat-card__icon--green {
  color: #9de4bf;
  background: rgba(74, 222, 128, 0.12);
}

.dashboard-stat-card p {
  margin: 18px 0 0;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 750;
}

.dashboard-stat-card strong {
  display: block;
  margin-top: 3px;
  color: var(--color-text);
  font-size: 30px;
  letter-spacing: -0.06em;
}

.dashboard-stat-card small {
  color: var(--color-text-muted);
  font-size: 10px;
}

.dashboard-panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
  gap: 16px;
  margin-top: 18px;
}

.dashboard-panel {
  min-width: 0;
  padding: clamp(22px, 3vw, 32px);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.dashboard-panel__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.dashboard-panel .panel-label {
  margin: 0;
  color: var(--color-coral);
}

.dashboard-panel h2 {
  margin: 8px 0 0;
  color: var(--color-text);
  font-size: clamp(1.55rem, 3vw, 2.2rem);
  letter-spacing: -0.06em;
  line-height: 1;
}

.dashboard-panel__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 8px 10px;
  border: 1px solid rgba(74, 222, 128, 0.25);
  border-radius: 999px;
  color: #73d99d;
  background: rgba(74, 222, 128, 0.1);
  font-size: 10px;
  font-weight: 800;
}

.dashboard-panel__badge .icon-glyph {
  width: 13px;
  height: 13px;
}

.dashboard-steps {
  display: grid;
  gap: 10px;
  margin-top: 28px;
}

.dashboard-step {
  display: flex;
  align-items: center;
  gap: 13px;
  min-height: 62px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
}

.dashboard-step__number {
  display: grid;
  width: 34px;
  height: 34px;
  flex: none;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: 850;
}

.dashboard-step__number .icon-glyph {
  width: 16px;
  height: 16px;
}

.dashboard-step--complete .dashboard-step__number {
  border-color: rgba(74, 222, 128, 0.3);
  color: #73d99d;
  background: rgba(74, 222, 128, 0.1);
}

.dashboard-step div {
  display: grid;
  gap: 4px;
}

.dashboard-step strong {
  color: var(--color-text);
  font-size: 12px;
}

.dashboard-step small {
  color: var(--color-text-muted);
  font-size: 10px;
  line-height: 1.4;
}

.dashboard-panel--activity {
  display: flex;
  flex-direction: column;
}

.dashboard-panel--activity .dashboard-panel__empty-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  color: #b9bdff;
  background: rgba(79, 70, 229, 0.17);
}

.dashboard-panel--activity .dashboard-panel__empty-icon .icon-glyph {
  width: 19px;
  height: 19px;
}

.dashboard-panel__copy {
  margin: 22px 0 0;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.dashboard-panel__empty-state {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: auto;
  padding-top: 34px;
  color: var(--color-text-muted);
  font-size: 11px;
}

.dashboard-panel__empty-state .icon-glyph {
  width: 16px;
  height: 16px;
  color: var(--color-coral);
}

@media (max-width: 900px) {
  .dashboard-overview__heading {
    display: grid;
  }

  .dashboard-profile-chip {
    max-width: 360px;
  }

  .dashboard-panel-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .dashboard-stat-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-stat-card {
    min-height: 142px;
  }

  .dashboard-panel__heading {
    display: grid;
  }

  .dashboard-panel__badge {
    justify-self: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-stat-card,
  .dashboard-panel {
    scroll-behavior: auto;
  }
}
</style>
