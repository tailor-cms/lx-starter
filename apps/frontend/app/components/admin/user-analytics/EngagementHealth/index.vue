<template>
  <section
    class="section engagement-section"
    :class="{ 'is-visible': isVisible }"
  >
    <div class="section-header">
      <div class="section-icon gradient-teal">
        <VIcon icon="mdi-heart-pulse" size="20" />
      </div>
      <div>
        <h2 class="section-title">Engagement Health</h2>
        <p class="section-subtitle">Learning momentum and activity patterns</p>
      </div>
    </div>
    <div class="stats-grid">
      <VelocityGauge :value="velocity" :description="velocityDescription" />
      <StreakCard :days="streakDays" :description="streakDescription" />
      <TimeCard
        :formatted-time="formattedLearningTime"
        :sessions-count="sessionsCount"
      />
      <InteractionsCard
        :count="totalInteractions"
        :completions-count="completionsCount"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
import VelocityGauge from './VelocityGauge.vue';
import StreakCard from './StreakCard.vue';
import TimeCard from './TimeCard.vue';
import InteractionsCard from './InteractionsCard.vue';

export interface Props {
  isVisible: boolean;
  velocity: number;
  velocityDescription: string;
  streakDays: number;
  streakDescription: string;
  formattedLearningTime: string;
  sessionsCount: number;
  totalInteractions: number;
  completionsCount: number;
}

defineProps<Props>();
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

  &.gradient-teal {
    background: linear-gradient(
      135deg,
      var(--accent-teal, #0d7377),
      var(--accent-teal-light, #14919b)
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}
</style>
