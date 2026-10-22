<template>
  <AnalyticsCard class="device-stats-card">
    <div class="analytics-header">
      <span class="analytics-icon">📱</span>
      <span class="analytics-title">Devices</span>
    </div>

    <div class="device-grid">
      <div v-for="device in devices" :key="device.type" class="device-item">
        <span class="device-icon">{{ device.icon }}</span>
        <span class="device-percent">{{ device.percent }}%</span>
        <span class="device-label">{{ device.label }}</span>
      </div>
    </div>
  </AnalyticsCard>
</template>

<script lang="ts" setup>
import type { DeviceStat } from '../types';
import AnalyticsCard from '../shared/AnalyticsCard.vue';

export interface Props {
  devices: DeviceStat[];
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.analytics-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1.25rem;
}

.analytics-icon {
  font-size: 1.25rem;
}

.analytics-title {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text-primary, #1a1a1a);
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.device-item {
  text-align: center;
  padding: 1rem 0.5rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-md, 0.625rem);
}

.device-icon {
  display: block;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.device-percent {
  display: block;
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
}

.device-label {
  display: block;
  font-size: 0.6875rem;
  color: var(--text-muted, #8c8c8c);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
