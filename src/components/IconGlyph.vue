<script setup lang="ts">
type IconName =
  | 'arrow-up-right'
  | 'bell'
  | 'check'
  | 'close'
  | 'device'
  | 'copy'
  | 'eye'
  | 'eye-off'
  | 'globe'
  | 'google'
  | 'key'
  | 'layers'
  | 'link'
  | 'login'
  | 'logout'
  | 'menu'
  | 'moon'
  | 'play'
  | 'send'
  | 'sparkles'
  | 'store'
  | 'sun'
  | 'users'

interface IconGlyphProps {
  name: IconName
}

defineProps<IconGlyphProps>()
</script>

<template>
  <svg class="icon-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path v-if="name === 'arrow-up-right'" d="M7 17 17 7M8 7h9v9" />
    <template v-else-if="name === 'bell'">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </template>
    <path v-else-if="name === 'check'" d="m5 12 4 4L19 6" />
    <path v-else-if="name === 'close'" d="m6 6 12 12M18 6 6 18" />
    <template v-else-if="name === 'device'">
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M10 18h4" />
    </template>
    <template v-else-if="name === 'copy'">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </template>
    <template v-else-if="name === 'eye'">
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.5" />
    </template>
    <template v-else-if="name === 'eye-off'">
      <path d="m3 3 18 18M10.6 10.6A2 2 0 0 0 13.4 13.4M9.9 5.3A10.7 10.7 0 0 1 12 5c6 0 9.5 7 9.5 7a16.8 16.8 0 0 1-3.1 3.8M6.6 6.6C3.9 8.5 2.5 12 2.5 12s3.5 7 9.5 7c1.2 0 2.3-.2 3.3-.6" />
    </template>
    <template v-else-if="name === 'globe'">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3Z" />
    </template>
    <template v-else-if="name === 'google'">
      <path fill="#4285F4" stroke="none" d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z" />
      <path fill="#34A853" stroke="none" d="M12 21.6c2.63 0 4.84-.87 6.45-2.37l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.48-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.6Z" />
      <path fill="#FBBC05" stroke="none" d="M6.52 13.67A5.86 5.86 0 0 1 6.21 12c0-.58.11-1.14.31-1.67V7.8H3.28A9.62 9.62 0 0 0 2.25 12c0 1.52.36 2.95 1.03 4.2l3.24-2.53Z" />
      <path fill="#EA4335" stroke="none" d="M12 6.3c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.39 14.63 2.4 12 2.4a9.75 9.75 0 0 0-8.72 5.4l3.24 2.53C7.3 8.02 9.46 6.3 12 6.3Z" />
    </template>
    <template v-else-if="name === 'key'">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M15 6l3 3M17 4l3 3" />
    </template>
    <template v-else-if="name === 'layers'">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </template>
    <path v-else-if="name === 'link'" d="M10 13a5 5 0 0 0 7.5.5l1.5-1.5a5 5 0 0 0-7.1-7.1L11 5.8M14 11a5 5 0 0 0-7.5-.5L5 12a5 5 0 0 0 7.1 7.1l.9-.9" />
    <template v-else-if="name === 'login'">
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M13 8l4 4-4 4M9 12h8" />
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h9" />
    </template>
    <template v-else-if="name === 'menu'">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" />
    </template>
    <template v-else-if="name === 'play'">
      <path d="m9 6 9 6-9 6V6Z" />
    </template>
    <template v-else-if="name === 'send'">
      <path d="m21 3-7.2 18-3.3-7.5L3 10.2 21 3Z" />
      <path d="M10.5 13.5 21 3" />
    </template>
    <template v-else-if="name === 'sparkles'">
      <path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3ZM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14ZM5 15l.6 1.9L7.5 17l-1.9.6L5 19.5l-.6-1.9L2.5 17l1.9-.6L5 15Z" />
    </template>
    <template v-else-if="name === 'store'">
      <path d="M4 10h16v10H4zM3 10l2-6h14l2 6M8 20v-5h8v5M7 10a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </template>
    <template v-else-if="name === 'users'">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M18 14a4.5 4.5 0 0 1 3 4" />
    </template>
  </svg>
</template>

<style scoped>
.icon-glyph {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  flex: 0 0 auto;
}
</style>
