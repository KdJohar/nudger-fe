<script setup lang="ts">
import { computed, provide, toRef, useId } from 'vue'
import { createPageLayoutState, pageLayoutKey } from '../../composables/usePageLayout'
import type { PageDefinition } from '../../types/pageLayout'
import PageHeader from './PageHeader.vue'

const props = defineProps<{ pageKey: string; definition: PageDefinition }>()
const layoutId = useId()
const headingId = `${layoutId}-heading`
const panelId = `${layoutId}-panel`
const tabsId = `${layoutId}-tabs`
const layout = createPageLayoutState(toRef(props, 'pageKey'))
provide(pageLayoutKey, layout)
const { presentation } = layout
const panelLabelId = computed(() => presentation.value.filter
  ? `${tabsId}-${presentation.value.filter.modelValue}-tab` : headingId)
</script>

<template>
  <section class="page-layout" :aria-labelledby="headingId">
    <PageHeader
      :definition="definition"
      :presentation="presentation"
      :heading-id="headingId"
      :panel-id="panelId"
      :tabs-id="tabsId"
      @select="layout.selectFilter"
    />
    <!-- This window and its container stay mounted; only the routed slot changes. -->
    <v-window class="page-layout__window" model-value="content" :touch="false">
      <v-window-item
        :id="panelId"
        value="content"
        :role="presentation.filter ? 'tabpanel' : 'region'"
        :aria-labelledby="panelLabelId"
        tabindex="0"
        :transition="false"
        :reverse-transition="false"
      >
        <slot />
      </v-window-item>
    </v-window>
  </section>
</template>
