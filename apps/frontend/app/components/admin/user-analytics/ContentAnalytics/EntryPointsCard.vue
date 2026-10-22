<template>
  <AnalyticsCard class="entry-points-card">
    <div class="analytics-header">
      <span class="analytics-icon">🚀</span>
      <span class="analytics-title">Discovery Channels</span>
    </div>

    <div class="entry-points">
      <div v-for="entry in entries" :key="entry.type" class="entry-item">
        <div class="entry-dot" :style="{ background: entry.color }" />
        <div class="entry-label-group">
          <span class="entry-label">{{ entry.label }}</span>
          <span class="entry-description">{{ getDescription(entry.type) }}</span>
        </div>
        <div class="entry-bar-wrapper">
          <div
            class="entry-bar"
            :style="{ width: `${entry.percent}%`, background: entry.color }"
          />
        </div>
        <span class="entry-value">{{ entry.count }}</span>
        <span class="entry-percent">{{ entry.percent }}%</span>
      </div>
    </div>
  </AnalyticsCard>
</template>

<script lang="ts" setup>
import type { EntryPointStat } from '../types';
import AnalyticsCard from '../shared/AnalyticsCard.vue';

export interface Props {
  entries: EntryPointStat[];
}

defineProps<Props>();

const ENTRY_POINT_DESCRIPTIONS: Record<string, string> = {
  direct: 'Navigated directly via URL or course outline',
  browse: 'Found by exploring the content catalog',
  recommendation: 'Clicked on personalized recommendations',
  search: 'Found via search',
  pathway: 'Accessed through a learning path',
  continue: 'Resumed from continue learning section',
};

const getDescription = (type: string) =>
  ENTRY_POINT_DESCRIPTIONS[type] || 'Content access method';
</script>

<style lang="scss" scoped>
.entry-points-card {
  grid-column: span 2;

  @media (max-width: 600px) {
    grid-column: span 1;
  }
}

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

.entry-points {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.entry-item {
  display: grid;
  grid-template-columns: 0.75rem minmax(14rem, 18rem) 1fr 2.5rem 3.125rem;
  align-items: center;
  gap: 0.75rem;
}

.entry-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: var(--radius-full, 9999px);
}

.entry-label-group {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.entry-label {
  font-size: 0.875rem;
  color: var(--text-primary, #1a1a1a);
}

.entry-description {
  font-size: 0.6875rem;
  color: var(--text-muted, #8c8c8c);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-bar-wrapper {
  height: 0.5rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
}

.entry-bar {
  height: 100%;
  border-radius: var(--radius-full, 9999px);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.entry-value {
  font-weight: 600;
  text-align: right;
  font-size: 0.875rem;
  color: var(--text-primary, #1a1a1a);
}

.entry-percent {
  font-size: 0.8125rem;
  color: var(--text-muted, #8c8c8c);
  text-align: right;
}
</style>
