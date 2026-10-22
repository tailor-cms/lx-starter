<template>
  <section
    :class="{ 'is-visible': isVisible }"
    class="section onboarding-section"
  >
    <div class="section-header">
      <div class="section-icon gradient-sage">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      </div>
      <div>
        <h2 class="section-title">Onboarding Profile</h2>
        <p class="section-subtitle">Initial setup and declared interests</p>
      </div>
    </div>
    <div class="onboarding-layout">
      <div class="onboarding-left">
        <OnboardingStatusCard
          :is-completed="completed"
          :completed-at="completedAt"
        />
        <GoalsCard :goals="goals" />
      </div>
      <div class="onboarding-right">
        <SurveyAnswersCard
          :answers="formattedAnswers"
          :loading="questionsLoading"
        />
      </div>
    </div>
    <InitialInterestsGrid
      v-if="onboardingAffinities.length"
      :interests="onboardingAffinities"
    />
  </section>
</template>

<script lang="ts" setup>
import type { FormattedAnswer, OnboardingAffinity } from '../types';
import OnboardingStatusCard from './OnboardingStatusCard.vue';
import GoalsCard from './GoalsCard.vue';
import SurveyAnswersCard from './SurveyAnswersCard.vue';
import InitialInterestsGrid from './InitialInterestsGrid.vue';

export interface Props {
  isVisible: boolean;
  completed: boolean;
  completedAt?: string;
  goals: string[];
  formattedAnswers: FormattedAnswer[];
  questionsLoading: boolean;
  onboardingAffinities: OnboardingAffinity[];
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
}

.gradient-sage {
  background: linear-gradient(
    135deg,
    var(--accent-sage, #81b29a),
    var(--accent-teal-light, #14919b)
  );
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

.onboarding-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.onboarding-left {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
