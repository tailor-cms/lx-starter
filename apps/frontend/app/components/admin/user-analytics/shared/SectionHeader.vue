<template>
  <div class="section-header">
    <div class="section-icon" :class="gradientClass">
      <slot name="icon">
        <svg
          v-if="icon === 'mdi-target'"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
        <svg
          v-else-if="icon === 'mdi-heart'"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5
          5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5
          5.5 0 0 0 0-7.78z" />
        </svg>
        <svg
          v-else-if="icon === 'mdi-book-open'"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        <svg
          v-else-if="icon === 'mdi-chart-timeline-variant'"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <svg
          v-else
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      </slot>
    </div>
    <div class="section-text">
      <h2 class="section-title">{{ title }}</h2>
      <p class="section-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface Props {
  title: string;
  subtitle: string;
  gradientClass: string;
  icon: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-md, 0.625rem);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse, #ffffff);
  flex-shrink: 0;

  &.gradient-teal {
    background: linear-gradient(135deg, #0d7377, #14919b);
  }

  &.gradient-sage {
    background: linear-gradient(135deg, #81b29a, #3d5a80);
  }

  &.gradient-coral {
    background: linear-gradient(135deg, #e07a5f, #f2cc8f);
  }

  &.gradient-purple {
    background: linear-gradient(135deg, #7209b7, #b5179e);
  }

  &.gradient-gold {
    background: linear-gradient(135deg, #d4a373, #e9c46a);
  }

  &.gradient-blue {
    background: linear-gradient(135deg, #3d5a80, #4a90a4);
  }
}

.section-title {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary, #1a1a1a);
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted, #8c8c8c);
  margin: 0;
}
</style>
