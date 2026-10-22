<template>
  <VMain class="centered-layout bg-primary d-flex flex-column align-center">
    <BrandLogo :height="50" color="white" class="mt-12 mb-8" />
    <VSheet
      class="mx-4 mb-8 pa-10"
      :max-width="maxWidth"
      width="100%"
      rounded="xl"
    >
      <h1 v-if="title" class="text-h4 text-primary font-weight-bold mb-8">
        {{ title }}
      </h1>
      <slot></slot>
    </VSheet>
  </VMain>
</template>

<script lang="ts" setup>
import BrandLogo from '@/components/common/BrandLogo.vue';

withDefaults(
  defineProps<{
    title?: string;
    maxWidth?: number | string;
  }>(),
  {
    title: '',
    maxWidth: 500,
  },
);
</script>

<style scoped>
.centered-layout {
  min-height: 100vh;
  justify-content: center;
  overflow-y: auto;
}

@media (max-height: 700px) {
  .centered-layout {
    justify-content: flex-start;
  }
}
</style>
