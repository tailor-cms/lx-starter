<template>
  <AnalyticsCard hoverable centered padding="lg" class="interactions-card">
    <div class="interactions-icon">
      <VIcon icon="mdi-thumb-up-outline" size="32" />
    </div>
    <div class="stat-value">{{ count }}</div>
    <div class="stat-label">Interactions</div>
    <div class="stat-sublabel">{{ completionsCount }} completions</div>
  </AnalyticsCard>
</template>

<script lang="ts" setup>
import AnalyticsCard from '../shared/AnalyticsCard.vue';

export interface Props {
  count: number;
  completionsCount: number;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.interactions-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 0.75rem;
  border-radius: var(--radius-lg, 1rem);
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  color: var(--accent-coral, #e07a5f);
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
