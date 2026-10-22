<template>
  <AnalyticsCard hoverable centered padding="lg" class="streak-card">
    <div class="streak-icon" :class="{ 'has-streak': days > 0 }">
      <span class="flame">🔥</span>
    </div>
    <div class="stat-value">{{ days }}</div>
    <div class="stat-label">Day Streak</div>
    <div class="stat-sublabel">{{ description }}</div>
  </AnalyticsCard>
</template>

<script lang="ts" setup>
import AnalyticsCard from '../shared/AnalyticsCard.vue';

export interface Props {
  days: number;
  description: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.streak-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 0.75rem;
  border-radius: var(--radius-lg, 1rem);
  background: var(--bg-subtle, #f5f5f3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base, 250ms cubic-bezier(0.4, 0, 0.2, 1));

  &.has-streak {
    background: linear-gradient(135deg, #fef3c7, #fde68a);

    .flame {
      animation: flame-dance 1s ease-in-out infinite;
    }
  }
}

.flame {
  font-size: 2rem;
}

@keyframes flame-dance {
  0%,
  100% {
    transform: scale(1) rotate(-3deg);
  }
  50% {
    transform: scale(1.1) rotate(3deg);
  }
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
