<template>
  <div class="onboarding-card answers-card">
    <h4 class="onboarding-card-title">
      <VIcon class="title-icon" icon="mdi-checkbox-marked-outline" size="16" />
      Survey Responses
      <span v-if="answers.length" class="answers-count">
        {{ answers.length }} questions
      </span>
    </h4>
    <div v-if="loading" class="loading-mini">Loading questions...</div>
    <div v-else-if="answers.length" class="answers-list">
      <div
        v-for="answer in answers"
        :key="answer.questionId"
        class="answer-item"
      >
        <div class="answer-question">{{ answer.question }}</div>
        <div class="answer-values">
          <span
            v-for="(val, idx) in answer.selectedLabels"
            :key="idx"
            class="answer-chip"
          >
            {{ val }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="empty-mini">No survey responses recorded</div>
  </div>
</template>

<script lang="ts" setup>
import type { FormattedAnswer } from '../types';

defineProps<{
  answers: FormattedAnswer[];
  loading: boolean;
}>();
</script>

<style lang="scss" scoped>
.onboarding-card {
  background: var(--bg-card, #ffffff);
  border-radius: var(--radius-lg, 1rem);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm, 0 0.0625rem 0.1875rem rgba(26, 26, 26, 0.04));
  height: 100%;
  display: flex;
  flex-direction: column;
}

.onboarding-card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary, #5c5c5c);
  margin: 0 0 1rem 0;
}

.title-icon {
  color: var(--accent-teal, #0d7377);
  flex-shrink: 0;
}

.answers-count {
  margin-left: auto;
  font-size: 0.6875rem;
  padding: 0.1875rem 0.5rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-full, 9999px);
  color: var(--text-muted, #8c8c8c);
}

.loading-mini {
  font-size: 0.8125rem;
  color: var(--text-muted, #8c8c8c);
  font-style: italic;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 17.5rem;
  overflow-y: auto;
  flex: 1;
}

.answer-item {
  padding: 0.75rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-md, 0.625rem);
}

.answer-question {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.answer-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.answer-chip {
  padding: 0.25rem 0.625rem;
  background: linear-gradient(
    135deg,
    rgba(13, 115, 119, 0.1),
    rgba(129, 178, 154, 0.1)
  );
  border: 0.0625rem solid rgba(13, 115, 119, 0.2);
  border-radius: var(--radius-full, 9999px);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--accent-teal, #0d7377);
}

.empty-mini {
  font-size: 0.8125rem;
  color: var(--text-muted, #8c8c8c);
  font-style: italic;
}
</style>
