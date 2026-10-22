<template>
  <div class="gauge-wrapper">
    <svg class="gauge-svg" :viewBox="`0 0 ${size} ${size}`">
      <defs>
        <linearGradient
          :id="gradientId"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%">
          <stop offset="0%" :stop-color="startColor" />
          <stop offset="100%" :stop-color="endColor" />
        </linearGradient>
      </defs>
      <circle
        class="gauge-track"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
      />
      <circle
        class="gauge-fill"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke="`url(#${gradientId})`"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeOffset"
      />
    </svg>
    <div class="gauge-value">
      <slot>
        <span class="gauge-number">{{ value }}</span>
        <span v-if="suffix" class="gauge-suffix">{{ suffix }}</span>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import uniqueId from 'lodash/uniqueId';

export interface Props {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  startColor?: string;
  endColor?: string;
  suffix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  max: 100,
  size: 120,
  strokeWidth: 8,
  startColor: '#0D7377',
  endColor: '#14919B',
  suffix: '',
});

const gradientId = uniqueId('gauge-gradient-');

const center = computed(() => props.size / 2);
const radius = computed(() => (props.size - props.strokeWidth) / 2 - 4);
const circumference = computed(() => 2 * Math.PI * radius.value);

const strokeOffset = computed(() => {
  const percent = Math.min(props.value / props.max, 1);
  return circumference.value - percent * circumference.value;
});
</script>

<style lang="scss" scoped>
.gauge-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.gauge-svg {
  transform: rotate(-90deg);
}

.gauge-track {
  fill: none;
  stroke: rgba(13, 115, 119, 0.1);
}

.gauge-fill {
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s ease-out;
}

.gauge-value {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gauge-number {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-teal, #0d7377);
}

.gauge-suffix {
  font-size: 0.875rem;
  color: var(--text-muted, #8c8c8c);
}
</style>
