<template>
  <AnalyticsCard padding="sm" class="dimensions-card">
    <div class="card-header">
      <div class="header-icon dimensions">
        <VIcon icon="mdi-chart-pie" size="16" />
      </div>
      <span class="header-title">By Dimension</span>
    </div>

    <div class="dimension-pills">
      <VBtn
        v-for="dim in dimensions"
        :key="dim.key"
        :variant="expandedDimension === dim.key ? 'flat' : 'tonal'"
        :color="expandedDimension === dim.key ? 'teal-darken-2' : 'grey'"
        :disabled="getCount(dim.key) === 0"
        rounded="pill"
        size="small"
        class="dim-pill"
        @click="$emit('toggle', dim.key)"
      >
        <template #prepend>
          <span class="pill-icon">{{ dim.icon }}</span>
        </template>
        {{ dim.name }}
        <template #append>
          <span class="pill-count" :class="{ active: expandedDimension === dim.key }">
            {{ getCount(dim.key) }}
          </span>
        </template>
      </VBtn>
    </div>
  </AnalyticsCard>
</template>

<script lang="ts" setup>
import { DIMENSIONS } from '../constants';
import AnalyticsCard from '../shared/AnalyticsCard.vue';

export interface Props {
  expandedDimension: string | null;
  getDimensionCount: (key: string) => number;
}

const props = defineProps<Props>();

defineEmits<{
  toggle: [key: string];
}>();

const dimensions = DIMENSIONS;

function getCount(key: string): number {
  return props.getDimensionCount(key);
}
</script>

<style lang="scss" scoped>
.dimensions-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1rem;
}

.header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm, 0.375rem);
  display: flex;
  align-items: center;
  justify-content: center;

  &.dimensions {
    background: rgba(13, 115, 119, 0.1);
    color: var(--accent-teal, #0d7377);
  }
}

.header-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary, #1a1a1a);
}

.dimension-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dim-pill {
  text-transform: none;
}

.pill-icon {
  font-size: 0.875rem;
}

.pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-full, 9999px);
  font-size: 0.6875rem;
  font-weight: 600;

  &.active {
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>
