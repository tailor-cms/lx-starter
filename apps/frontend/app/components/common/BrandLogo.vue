<template>
  <div
    :class="['brand-logo', `text-${color}`]"
    :style="{ height: `${height}px` }"
  >
    <component :is="logoComponent" />
  </div>
</template>

<script lang="ts" setup>
import type { Component } from 'vue';
import { useBrandingStore, type Brand } from '@/stores/branding';
import TailorLogo from '@/assets/img/branding/tailor/logo.svg';

interface Props {
  height?: number;
  color?: string;
  brand?: Brand;
}

const logos: Record<Brand, Component> = {
  'tailor': TailorLogo,
  'tailor-fire': TailorLogo,
};

const props = withDefaults(defineProps<Props>(), {
  height: 40,
  color: 'primary',
  brand: undefined,
});

const brandingStore = useBrandingStore();
const logoComponent = computed(() => logos[props.brand ?? brandingStore.brand]);
</script>

<style scoped>
.brand-logo {
  display: flex;
}

.brand-logo :deep(svg) {
  height: 100%;
  width: auto;
}
</style>
