<template>
  <div class="timeline-day" :style="{ '--delay': `${delay}ms` }">
    <div class="day-header">
      <span class="day-date">{{ group.label }}</span>
      <span class="day-count">{{ group.items.length }} activities</span>
    </div>
    <div class="day-items">
      <ActivityItem
        v-for="(item, idx) in group.items"
        :key="item.id || idx"
        :item="item"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import ActivityItem from './ActivityItem.vue';
import type { TimelineGroup } from '../types';

export interface Props {
  group: TimelineGroup;
  delay: number;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.timeline-day {
  opacity: 0;
  animation: day-appear 0.5s ease forwards;
  animation-delay: var(--delay);
}

@keyframes day-appear {
  from {
    opacity: 0;
    transform: translateY(1.25rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  border-bottom: 0.125rem solid var(--bg-muted, #edede9);
}

.day-date {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.day-count {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
  background: var(--bg-subtle, #f5f5f3);
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full, 9999px);
}

.day-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
