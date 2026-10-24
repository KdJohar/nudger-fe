<script setup lang="ts">
withDefaults(defineProps<{ name?: string }>(), { name: 'bell' })
const paths: Record<string, string> = {
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3',
  code: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 20',
  check: 'm5 12 4 4L19 6', arrow: 'M4 12h16m-6-6 6 6-6 6',
  play: 'm8 4 13 8-13 8z', spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z',
}
</script>
<template><svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true"><path :d="paths[name] || paths.bell" /></svg></template>
