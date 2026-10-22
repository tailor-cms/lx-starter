<template>
  <section
    :class="{ 'is-visible': isVisible }"
    class="section timeline-section"
  >
    <div class="section-header">
      <div class="section-icon gradient-gold">
        <VIcon icon="mdi-chart-line-variant" size="20" />
      </div>
      <div>
        <h2 class="section-title">Activity Timeline</h2>
        <p class="section-subtitle">Recent learning activity grouped by day</p>
      </div>
    </div>
    <div v-if="groupedTimeline.length" class="timeline-vertical">
      <TimelineDay
        v-for="(group, gIdx) in groupedTimeline"
        :key="group.date"
        :group="group"
        :delay="gIdx * 100"
      />
      <VBtn
        v-if="totalItems > maxItems"
        variant="outlined"
        color="grey-darken-1"
        rounded="lg"
        class="show-more-btn"
        @click="$emit('toggle-show-all')"
      >
        {{ showAll ? 'Show Less' : `Show ${totalItems - maxItems} More` }}
      </VBtn>
    </div>
    <EmptyState
      v-else
      message="No activity recorded yet"
      icon="mdi-clock-outline"
    />
  </section>
</template>

<script lang="ts" setup>
import EmptyState from '../shared/EmptyState.vue';
import TimelineDay from './TimelineDay.vue';
import type { TimelineGroup } from '../types';

export interface Props {
  isVisible: boolean;
  groupedTimeline: TimelineGroup[];
  totalItems: number;
  maxItems: number;
  showAll: boolean;
}

defineProps<Props>();

defineEmits<{
  'toggle-show-all': [];
}>();
</script>

<style lang="scss" scoped>
.section {
  padding: 2.5rem 3.5rem;
  opacity: 0;
  transform: translateY(1.875rem);
  transition: all var(--transition-slow, 400ms cubic-bezier(0.4, 0, 0.2, 1));

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 1.75rem 1.5rem;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.section-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-lg, 1rem);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse, #ffffff);
  flex-shrink: 0;

  &.gradient-gold {
    background: linear-gradient(
      135deg,
      var(--accent-gold, #d4a373),
      var(--accent-gold-light, #e9c46a)
    );
  }
}

.section-title {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.125rem 0;
  color: var(--text-primary, #1a1a1a);

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted, #8c8c8c);
  margin: 0;
}

.timeline-vertical {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.show-more-btn {
  align-self: center;
  text-transform: none;
  font-weight: 500;
}
</style>
