<template>
  <component
    :is="tag"
    class="analytics-card"
    :class="[
      sizeClass,
      {
        'is-hoverable': hoverable,
        'has-border-accent': !!borderAccent,
        'is-centered': centered,
      },
    ]"
    :style="cardStyle"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
export interface Props {
  tag?: string;
  hoverable?: boolean;
  centered?: boolean;
  borderAccent?: 'teal' | 'coral' | 'gold' | 'purple' | 'success' | string;
  padding?: 'sm' | 'md' | 'lg';
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  hoverable: false,
  centered: false,
  padding: 'md',
});

const sizeClass = computed(() => `padding-${props.padding}`);

const cardStyle = computed(() => {
  const styles: Record<string, string> = {};
  if (props.delay) {
    styles['--animation-delay'] = `${props.delay}ms`;
  }
  if (props.borderAccent) {
    const colorMap: Record<string, string> = {
      teal: 'var(--accent-teal, #0d7377)',
      coral: 'var(--accent-coral, #e07a5f)',
      gold: 'var(--accent-gold, #d4a373)',
      purple: 'var(--accent-purple, #7209b7)',
      success: 'var(--success, #2d6a4f)',
    };
    styles['--border-accent-color'] = colorMap[props.borderAccent] || props.borderAccent;
  }
  return styles;
});
</script>

<style lang="scss" scoped>
.analytics-card {
  background: var(--bg-card, #ffffff);
  border-radius: var(--radius-lg, 1rem);
  box-shadow: var(--shadow-sm, 0 0.0625rem 0.1875rem rgba(26, 26, 26, 0.04));
  transition: all var(--transition-base, 250ms cubic-bezier(0.4, 0, 0.2, 1));

  &.padding-sm {
    padding: 1.25rem;
  }

  &.padding-md {
    padding: 1.5rem;
  }

  &.padding-lg {
    padding: 1.75rem;
  }

  &.is-hoverable:hover {
    box-shadow: var(--shadow-md, 0 0.25rem 0.75rem rgba(26, 26, 26, 0.06));
    transform: translateY(-0.125rem);
  }

  &.has-border-accent {
    border-left: 0.25rem solid var(--border-accent-color);
  }

  &.is-centered {
    text-align: center;
  }
}
</style>
