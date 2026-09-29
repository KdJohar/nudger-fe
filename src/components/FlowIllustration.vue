<script setup lang="ts">
type FlowKind = 'creator' | 'platform'

interface FlowIllustrationProps {
  kind: FlowKind
}

defineProps<FlowIllustrationProps>()
</script>

<template>
  <div class="flow-illustration" :class="`flow-illustration--${kind}`">
    <svg v-if="kind === 'creator'" viewBox="0 0 640 320" role="img" aria-label="A creator schedules a 3:15 PM livestream and Nudgee shows that the live stream has started">
      <defs>
        <linearGradient id="creator-panel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#2d3765" />
          <stop offset="1" stop-color="#18243a" />
        </linearGradient>
        <linearGradient id="creator-phone" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#ff8064" />
          <stop offset="1" stop-color="#4f46e5" />
        </linearGradient>
      </defs>
      <rect class="flow-illustration__backdrop" x="1" y="1" width="638" height="318" rx="28" />
      <circle class="flow-illustration__halo" cx="475" cy="158" r="120" />
      <rect class="flow-illustration__window" x="26" y="34" width="286" height="252" rx="20" fill="url(#creator-panel)" />
      <circle cx="49" cy="57" r="5" fill="#ff8064" />
      <circle cx="66" cy="57" r="5" fill="#f4c86d" />
      <circle cx="83" cy="57" r="5" fill="#71d8ae" />
      <text class="flow-illustration__kicker" x="50" y="92">CREATOR STUDIO</text>
      <text class="flow-illustration__heading" x="50" y="122">The next moment</text>
      <text class="flow-illustration__subtext" x="50" y="143">reaches the right tier.</text>
      <rect class="flow-illustration__event" x="50" y="169" width="238" height="88" rx="15" />
      <circle cx="76" cy="199" r="17" fill="#ff6b4a" opacity="0.2" />
      <path d="M70 199h12M76 193v12" stroke="#ffad9b" stroke-width="2" stroke-linecap="round" />
      <text class="flow-illustration__event-label" x="104" y="194">GOLD TIER</text>
      <text class="flow-illustration__event-title" x="104" y="216">Live stream at 3:15 PM</text>
      <circle class="flow-illustration__pulse" cx="76" cy="239" r="4" fill="#69d4a8" />
      <text class="flow-illustration__event-status" x="88" y="243">scheduled</text>
      <path class="flow-illustration__path" d="M312 160 C350 160 356 120 394 120" />
      <circle class="flow-illustration__traveller" cx="330" cy="154" r="6" />
      <rect class="flow-illustration__phone" x="414" y="34" width="166" height="252" rx="28" fill="#10192b" />
      <rect x="426" y="58" width="142" height="205" rx="18" fill="#f7f8fc" />
      <rect x="474" y="45" width="46" height="7" rx="3.5" fill="#29344c" />
      <text class="flow-illustration__phone-label" x="443" y="84">NUDGEE</text>
      <circle cx="449" cy="111" r="17" fill="url(#creator-phone)" />
      <path d="M442 111h14M449 104v14" stroke="#fff" stroke-width="2" stroke-linecap="round" />
      <text class="flow-illustration__phone-status" x="475" y="106">LIVE NOW</text>
      <text class="flow-illustration__phone-title" x="443" y="145">Live stream</text>
      <text class="flow-illustration__phone-title" x="443" y="163">started</text>
      <text class="flow-illustration__phone-copy" x="443" y="192">Gold tier is live.</text>
      <rect x="443" y="214" width="84" height="25" rx="12.5" fill="#ff6b4a" />
      <text class="flow-illustration__phone-button" x="460" y="231">Join now</text>
    </svg>

    <svg v-else viewBox="0 0 640 320" role="img" aria-label="A platform sends a transactional update through Plug and Nudge to a person's phone without needing its own mobile app">
      <defs>
        <linearGradient id="platform-panel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#eef0ff" />
          <stop offset="1" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect class="flow-illustration__backdrop" x="1" y="1" width="638" height="318" rx="28" />
      <rect class="flow-illustration__platform-window" x="28" y="55" width="218" height="210" rx="20" fill="url(#platform-panel)" />
      <circle cx="51" cy="78" r="5" fill="#4f46e5" />
      <circle cx="68" cy="78" r="5" fill="#cbd1df" />
      <circle cx="85" cy="78" r="5" fill="#cbd1df" />
      <text class="flow-illustration__dark-kicker" x="52" y="113">YOUR PLATFORM</text>
      <text class="flow-illustration__dark-heading" x="52" y="145">Order confirmed</text>
      <text class="flow-illustration__dark-subtext" x="52" y="168">A useful event happens.</text>
      <rect x="52" y="193" width="170" height="42" rx="13" fill="#4f46e5" opacity="0.11" />
      <circle cx="74" cy="214" r="12" fill="#4f46e5" opacity="0.2" />
      <path d="m68 214 4 4 8-9" stroke="#4f46e5" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <text class="flow-illustration__dark-event" x="96" y="218">Send a nudge</text>
      <path class="flow-illustration__path flow-illustration__path--indigo" d="M246 160 C296 160 312 116 360 116" />
      <circle class="flow-illustration__traveller flow-illustration__traveller--indigo" cx="270" cy="151" r="6" />
      <g transform="translate(338 80)">
        <rect class="flow-illustration__hub" width="96" height="96" rx="26" />
        <path d="m25 49 25-18 25 18-25 18-25-18Z" fill="none" stroke="#ff9b85" stroke-width="3" />
        <path d="m25 61 25 18 25-18M25 49l25 18 25-18" fill="none" stroke="#ff6b4a" stroke-width="3" opacity="0.75" />
        <text class="flow-illustration__hub-label" x="20" y="116">PLUG &amp; NUDGE</text>
      </g>
      <path class="flow-illustration__path flow-illustration__path--indigo" d="M434 176 C474 176 480 210 518 210" />
      <circle class="flow-illustration__traveller flow-illustration__traveller--indigo" cx="468" cy="186" r="6" />
      <rect class="flow-illustration__phone" x="504" y="48" width="108" height="220" rx="24" fill="#10192b" />
      <rect x="513" y="72" width="90" height="176" rx="15" fill="#f7f8fc" />
      <rect x="543" y="58" width="30" height="5" rx="2.5" fill="#29344c" />
      <circle cx="534" cy="102" r="14" fill="#4f46e5" opacity="0.15" />
      <path d="m528 102 4 4 8-9" stroke="#4f46e5" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <text class="flow-illustration__phone-label flow-illustration__phone-label--platform" x="526" y="131">NUDGEE</text>
      <text class="flow-illustration__phone-title flow-illustration__phone-title--platform" x="526" y="160">Order</text>
      <text class="flow-illustration__phone-title flow-illustration__phone-title--platform" x="526" y="178">confirmed</text>
      <text class="flow-illustration__phone-copy flow-illustration__phone-copy--platform" x="526" y="204">Arriving Tuesday.</text>
      <text class="flow-illustration__no-app" x="321" y="286">No dedicated mobile app required</text>
    </svg>
  </div>
</template>

<style scoped>
.flow-illustration {
  width: 100%;
  margin-top: 28px;
  overflow: hidden;
  border-radius: 22px;
}

.flow-illustration svg {
  display: block;
  width: 100%;
  height: auto;
}

.flow-illustration__backdrop {
  fill: #111a2c;
  stroke: rgba(255, 255, 255, 0.12);
}

.flow-illustration__halo {
  fill: rgba(255, 107, 74, 0.08);
}

.flow-illustration__window,
.flow-illustration__phone,
.flow-illustration__platform-window,
.flow-illustration__hub {
  stroke: rgba(255, 255, 255, 0.14);
}

.flow-illustration__kicker,
.flow-illustration__dark-kicker,
.flow-illustration__phone-label {
  fill: #a7b0c2;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.flow-illustration__heading,
.flow-illustration__dark-heading {
  fill: #ffffff;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 18px;
  font-weight: 800;
}

.flow-illustration__subtext,
.flow-illustration__dark-subtext,
.flow-illustration__phone-copy {
  fill: #9ba6bb;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
}

.flow-illustration__event {
  fill: rgba(255, 255, 255, 0.08);
  stroke: rgba(255, 255, 255, 0.1);
}

.flow-illustration__event-label,
.flow-illustration__event-status,
.flow-illustration__phone-status,
.flow-illustration__dark-event,
.flow-illustration__hub-label,
.flow-illustration__no-app {
  fill: #ffad9b;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.8px;
}

.flow-illustration__event-title {
  fill: #ffffff;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 12px;
  font-weight: 700;
}

.flow-illustration__phone-label {
  fill: #7f899b;
}

.flow-illustration__phone-title {
  fill: #1b2538;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 15px;
  font-weight: 850;
}

.flow-illustration__phone-button {
  fill: #111827;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 9px;
  font-weight: 800;
}

.flow-illustration__path {
  fill: none;
  stroke: #ff947c;
  stroke-dasharray: 7 12;
  stroke-linecap: round;
  stroke-width: 2.5;
  animation: flow-dash 2.4s linear infinite;
}

.flow-illustration__path--indigo {
  stroke: #7370ed;
}

.flow-illustration__traveller {
  fill: #ffb4a3;
  filter: drop-shadow(0 0 7px rgba(255, 107, 74, 0.7));
  animation: flow-travel 2.4s ease-in-out infinite;
}

.flow-illustration__traveller--indigo {
  fill: #9ea5ff;
  filter: drop-shadow(0 0 7px rgba(79, 70, 229, 0.8));
}

.flow-illustration__pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: flow-pulse 1.8s ease-in-out infinite;
}

.flow-illustration__dark-kicker,
.flow-illustration__dark-subtext,
.flow-illustration__dark-event,
.flow-illustration__phone-title--platform,
.flow-illustration__phone-copy--platform {
  fill: #59657b;
}

.flow-illustration__dark-heading,
.flow-illustration__phone-title--platform {
  fill: #111827;
}

.flow-illustration__hub {
  fill: #1d2940;
}

.flow-illustration__hub-label,
.flow-illustration__no-app {
  fill: #79859d;
  font-size: 8px;
  text-anchor: middle;
}

.flow-illustration--platform .flow-illustration__backdrop {
  fill: #f5f7fb;
  stroke: #e2e6ef;
}

.flow-illustration--platform .flow-illustration__phone {
  stroke: #dce1eb;
}

@keyframes flow-dash {
  to {
    stroke-dashoffset: -38;
  }
}

@keyframes flow-travel {
  0%,
  100% {
    opacity: 0.45;
    transform: translateX(0);
  }
  50% {
    opacity: 1;
    transform: translateX(55px);
  }
}

@keyframes flow-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.45);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-illustration__path,
  .flow-illustration__traveller,
  .flow-illustration__pulse {
    animation: none;
  }
}
</style>
