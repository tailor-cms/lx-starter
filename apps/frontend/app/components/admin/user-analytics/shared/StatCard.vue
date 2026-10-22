<template>
  <div class="stat-card">
    <slot name="visual">
      <div v-if="icon" class="stat-icon-wrapper" :class="`color-${color}`">
        <slot name="icon">
          <svg
            v-if="icon === 'mdi-speedometer'"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 10" />
          </svg>
          <svg
            v-else
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </slot>
      </div>
    </slot>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-label">{{ label }}</div>
    <div v-if="sublabel" class="stat-sublabel">{{ sublabel }}</div>
  </div>
</template>

<script lang="ts" setup>
export interface Props {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: string;
  color?: string;
}

withDefaults(defineProps<Props>(), {
  sublabel: '',
  color: 'primary',
});
</script>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  background: var(--bg-card, #ffffff);
  border-radius: var(--radius-lg, 1rem);
  box-shadow: var(--shadow-sm, 0 0.0625rem 0.1875rem rgba(26, 26, 26, 0.04));
  height: 100%;
  transition: all var(--transition-base, 250ms cubic-bezier(0.4, 0, 0.2, 1));

  &:hover {
    box-shadow: var(--shadow-md, 0 0.25rem 0.75rem rgba(26, 26, 26, 0.06));
  }
}

.stat-icon-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;

  &.color-primary {
    background: rgba(13, 115, 119, 0.1);
    color: var(--accent-teal, #0d7377);
  }

  &.color-success {
    background: #d1fae5;
    color: var(--success, #2d6a4f);
  }

  &.color-warning {
    background: #fef3c7;
    color: var(--warning, #bc6c25);
  }

  &.color-info {
    background: #dbeafe;
    color: #1d4ed8;
  }

  &.color-purple {
    background: #ede9fe;
    color: #7c3aed;
  }
}

.stat-value {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.stat-sublabel {
  font-size: 0.875rem;
  color: var(--text-muted, #8c8c8c);
  margin-top: 0.25rem;
}
</style>
