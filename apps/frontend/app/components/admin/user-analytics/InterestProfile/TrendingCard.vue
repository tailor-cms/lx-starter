<template>
  <AnalyticsCard padding="sm" class="trending-card">
    <div class="card-header">
      <div class="header-icon trending">
        <VIcon icon="mdi-trending-up" size="16" />
      </div>
      <span class="header-title">Trending Now</span>
    </div>

    <div class="trending-list">
      <div
        v-for="(trend, idx) in trends"
        :key="trend.tag"
        class="trending-item"
        :style="{ '--delay': `${idx * 40}ms` }"
      >
        <span class="trend-name">{{ formatTagName(trend.tag) }}</span>
        <span class="trend-delta">
          +{{ Math.round(trend.recentDelta * 100) }}%
        </span>
        <span class="trend-dimension">{{ trend.dimension }}</span>
      </div>
    </div>
  </AnalyticsCard>
</template>

<script lang="ts" setup>
import { formatTagName } from '~/composables/useProfileData';
import type { TrendingInterest } from '../types';
import AnalyticsCard from '../shared/AnalyticsCard.vue';

export interface Props {
  trends: TrendingInterest[];
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.trending-card {
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

  &.trending {
    background: #d1fae5;
    color: var(--success, #2d6a4f);
  }
}

.header-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary, #1a1a1a);
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: rgba(13, 115, 119, 0.06);
  border-radius: var(--radius-md, 0.625rem);
  animation: itemFadeIn 0.3s ease-out backwards;
  animation-delay: var(--delay, 0ms);
}

@keyframes itemFadeIn {
  from {
    opacity: 0;
    transform: translateX(-0.625rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.trend-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #1a1a1a);
}

.trend-delta {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--success, #2d6a4f);
}

.trend-dimension {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
  text-transform: capitalize;
}
</style>
