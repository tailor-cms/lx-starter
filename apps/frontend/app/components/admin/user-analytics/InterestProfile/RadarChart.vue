<template>
  <div class="radar-section">
    <VBtn
      variant="tonal"
      color="teal-darken-2"
      block
      rounded="lg"
      class="radar-toggle"
      @click="$emit('toggle')"
    >
      <template #prepend>
        <VIcon icon="mdi-chart-donut" size="18" />
      </template>
      {{ isVisible ? 'Hide' : 'Show' }} Dimension Balance Chart
      <template #append>
        <VIcon
          :icon="isVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="18"
        />
      </template>
    </VBtn>

    <Transition name="expand">
      <div v-if="isVisible" class="radar-card">
        <div class="radar-container">
          <svg class="radar-chart" viewBox="0 0 340 340">
            <g class="radar-grid" transform="translate(170, 170)">
              <polygon
                v-for="level in [1, 0.75, 0.5, 0.25]"
                :key="level"
                :points="gridPoints(level)"
                class="grid-polygon"
              />
              <line
                v-for="i in 6"
                :key="`axis-${i}`"
                x1="0"
                y1="0"
                :x2="axisPoint(i - 1).x"
                :y2="axisPoint(i - 1).y"
                class="grid-axis"
              />
            </g>
            <polygon
              class="radar-data"
              :points="dataPoints"
              transform="translate(170, 170)"
            />
            <g transform="translate(170, 170)">
              <circle
                v-for="(point, i) in points"
                :key="`point-${i}`"
                :cx="point.x"
                :cy="point.y"
                r="5"
                class="radar-point"
              />
            </g>
            <g class="radar-labels">
              <text
                v-for="(dim, i) in dimensions"
                :key="`label-${i}`"
                :x="labelPoint(i).x + 170"
                :y="labelPoint(i).y + 170"
                class="radar-label"
                :text-anchor="labelAnchor(i)"
              >
                {{ dim.icon }} {{ dim.name }}
              </text>
            </g>
          </svg>
        </div>
        <p class="radar-hint">
          This chart shows the balance across the 6 interest dimensions. Click
          dimension pills above to explore each category.
        </p>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { DIMENSIONS, RADAR_RADIUS } from '../constants';

export interface Props {
  isVisible: boolean;
  getDimensionStrength: (key: string) => number;
}

const props = defineProps<Props>();

defineEmits<{
  toggle: [];
}>();

const dimensions = DIMENSIONS;

function axisPoint(index: number) {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return {
    x: Math.cos(angle) * RADAR_RADIUS,
    y: Math.sin(angle) * RADAR_RADIUS,
  };
}

function gridPoints(scale: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const point = axisPoint(i);
    return `${point.x * scale},${point.y * scale}`;
  }).join(' ');
}

const points = computed(() => {
  return dimensions.map((dim, i) => {
    const strength = props.getDimensionStrength(dim.key) / 100;
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    return {
      x: Math.cos(angle) * RADAR_RADIUS * strength,
      y: Math.sin(angle) * RADAR_RADIUS * strength,
    };
  });
});

const dataPoints = computed(() => {
  return points.value.map((p) => `${p.x},${p.y}`).join(' ');
});

function labelPoint(index: number) {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  const labelRadius = RADAR_RADIUS + 25;
  return {
    x: Math.cos(angle) * labelRadius,
    y: Math.sin(angle) * labelRadius,
  };
}

function labelAnchor(index: number): string {
  if (index === 0) return 'middle';
  if (index === 3) return 'middle';
  if (index < 3) return 'start';
  return 'end';
}
</script>

<style lang="scss" scoped>
.radar-section {
  margin-top: 1.25rem;
}

.radar-toggle {
  text-transform: none;
  font-weight: 500;
  padding: 0.875rem 1.125rem;
}

.radar-card {
  margin-top: 1rem;
  padding: 1.25rem;
  background: var(--bg-card, #ffffff);
  border-radius: var(--radius-lg, 1rem);
  box-shadow: var(--shadow-sm, 0 0.0625rem 0.1875rem rgba(26, 26, 26, 0.04));
}

.radar-container {
  display: flex;
  justify-content: center;
}

.radar-chart {
  width: 21.25rem;
  height: 21.25rem;
}

.grid-polygon {
  fill: none;
  stroke: var(--bg-muted, #edede9);
  stroke-width: 0.0625rem;
}

.grid-axis {
  stroke: var(--bg-muted, #edede9);
  stroke-width: 0.0625rem;
}

.radar-data {
  fill: rgba(13, 115, 119, 0.2);
  stroke: var(--accent-teal, #0d7377);
  stroke-width: 0.125rem;
}

.radar-point {
  fill: var(--accent-teal, #0d7377);
}

.radar-label {
  font-size: 0.75rem;
  fill: var(--text-muted, #8c8c8c);
}

.radar-hint {
  margin: 1rem 0 0 0;
  font-size: 0.875rem;
  color: var(--text-muted, #8c8c8c);
  text-align: center;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 31.25rem;
  margin-top: 1rem;
}
</style>
