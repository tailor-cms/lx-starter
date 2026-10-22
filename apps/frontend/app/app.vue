<template>
  <VApp>
    <NuxtPage />
  </VApp>
</template>

<script lang="ts" setup>
import { useConfigStore } from '@/stores/config';

useConfigStore().getConfig();
</script>

<style lang="scss">
* {
  font-family: "Avenir Next", sans-serif !important;
}

// a11y: Ensure form labels meet WCAG 2 AA contrast requirements (4.5:1)
// Default Vuetify uses opacity which results in #7a7a7a (4.29:1 contrast)
// Setting explicit color #6f6f6f achieves ~5.0:1 contrast ratio
.v-input .v-label.v-field-label {
  color: #555 !important;
  opacity: 1 !important;
}

.v-input.required {
  .v-field-label {
    padding-inline-end: 0.5rem;

    &::after {
      position: absolute;
      content: '*';
      color: rgb(var(--v-theme-primary-darken-5));
      top: 0;
      // support also RTL direction
      inset-inline-end: 0;
    }
  }
}

.v-btn--variant-outlined {
  border: 2px solid currentColor;
}

.text-h6 {
  font-weight: normal;
}

.ce-html-root {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: 1.5rem !important;
    letter-spacing: normal !important;
    font-weight: bold !important;
  }

  .text-body-2, p, li {
    font-size: 1.25rem !important;
  }
}

.embedded-container {
  .ce-html-root {
    padding: 0;
  }
}

.font-weight-semibold {
  font-weight: 600 !important;
}

.tce-mux-video-root mux-player {
  aspect-ratio: 16 / 9;
}

.section-content .question-container {
  background: rgb(var(--v-theme-primary-lighten-5)) !important;
  border: none !important;
}
</style>
