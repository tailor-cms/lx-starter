<template>
  <AnalyticsCard hoverable centered padding="lg" class="time-card">
    <div class="time-icon">
      <VIcon icon="mdi-clock-outline" size="32" />
    </div>
    <div class="stat-value">{{ formattedTime }}</div>
    <div class="stat-label">Total Learning Time</div>
    <div class="stat-sublabel">{{ sessionsCount }} sessions</div>
  </AnalyticsCard>
</template>

<script lang="ts" setup>
import AnalyticsCard from '../shared/AnalyticsCard.vue';

export interface Props {
  formattedTime: string;
  sessionsCount: number;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.time-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 0.75rem;
  border-radius: var(--radius-lg, 1rem);
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  color: var(--accent-purple, #7209b7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  line-height: 1.1;
  margin-bottom: 0.25rem;
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
