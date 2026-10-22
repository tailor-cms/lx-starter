<template>
  <div class="onboarding-card status-card">
    <div class="onboarding-status" :class="{ completed: isCompleted }">
      <div class="status-icon">
        {{ isCompleted ? '✓' : '⏳' }}
      </div>
      <div class="status-text">
        <span class="status-label">
          {{ isCompleted ? 'Completed' : 'Incomplete' }}
        </span>
        <span v-if="completedAt" class="status-date">{{ completedAt }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface Props {
  isCompleted: boolean;
  completedAt?: string;
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

.onboarding-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-md, 0.625rem);
  background: var(--bg-subtle, #f5f5f3);
  width: 100%;

  &.completed {
    background: #d1fae5;
  }
}

.status-icon {
  font-size: 1.5rem;
}

.status-text {
  display: flex;
  flex-direction: column;
}

.status-label {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text-primary, #1a1a1a);
}

.status-date {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
  display: block;
}
</style>
