<template>
  <AnalyticsCard hoverable centered padding="lg" class="velocity-card">
    <div class="gauge-wrapper">
      <svg class="gauge-svg" viewBox="0 0 120 120">
        <defs>
          <linearGradient
            id="velocityGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stop-color="#0D7377" />
            <stop offset="100%" stop-color="#14919B" />
          </linearGradient>
        </defs>
        <circle class="gauge-track" cx="60" cy="60" r="52" />
        <circle
          class="gauge-fill"
          cx="60"
          cy="60"
          r="52"
          :stroke-dashoffset="velocityOffset"
        />
      </svg>
      <div class="gauge-value">
        <span class="gauge-number">{{ value }}</span>
      </div>
    </div>
    <div class="stat-label">Learning Momentum</div>
    <div class="stat-sublabel">{{ description }}</div>
  </AnalyticsCard>
</template>

<script lang="ts" setup>
import AnalyticsCard from '../shared/AnalyticsCard.vue';

export interface Props {
  value: number;
  description: string;
}

const props = defineProps<Props>();

const velocityOffset = computed(() => {
  const circumference = 2 * Math.PI * 52;
  return circumference - (props.value / 100) * circumference;
});
</script>

<style lang="scss" scoped>
.gauge-wrapper {
  position: relative;
  width: 7.5rem;
  height: 7.5rem;
  margin: 0 auto 1rem;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.gauge-track {
  fill: none;
  stroke: var(--bg-subtle, #f5f5f3);
  stroke-width: 10;
}

.gauge-fill {
  fill: none;
  stroke: url(#velocityGradient);
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: 326.7;
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.gauge-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gauge-number {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-teal, #0d7377);
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary, #5c5c5c);
  margin-bottom: 0.125rem;
}

.stat-sublabel {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
}
</style>
