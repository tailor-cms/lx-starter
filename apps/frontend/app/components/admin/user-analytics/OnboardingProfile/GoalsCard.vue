<template>
  <div class="onboarding-card goals-card">
    <h4 class="onboarding-card-title">
      <VIcon class="title-icon" icon="mdi-bullseye-arrow" size="16" />
      Learning Goals
    </h4>
    <div v-if="goals.length" class="goals-list">
      <div v-for="goal in goals" :key="goal" class="goal-item">
        <span class="goal-bullet">→</span>
        <span>{{ goal }}</span>
      </div>
    </div>
    <div v-else class="empty-mini">No goals declared</div>
  </div>
</template>

<script lang="ts" setup>
export interface Props {
  goals: string[];
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.onboarding-card {
  background: var(--bg-card, #ffffff);
  border-radius: var(--radius-lg, 1rem);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm, 0 0.0625rem 0.1875rem rgba(26, 26, 26, 0.04));
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
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.goal-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--text-primary, #1a1a1a);
}

.goal-bullet {
  color: var(--accent-teal, #0d7377);
  font-weight: 700;
}

.empty-mini {
  font-size: 0.8125rem;
  color: var(--text-muted, #8c8c8c);
  font-style: italic;
}
</style>
