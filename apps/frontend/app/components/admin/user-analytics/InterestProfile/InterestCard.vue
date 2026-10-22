<template>
  <div
    class="interest-card"
    :class="[`rank-${rank}`]"
    :style="{ '--delay': `${delay}ms` }"
  >
    <div
      class="interest-confidence"
      :title="`Confidence: ${Math.round(interest.confidence * 100)}%`"
    >
      <span
        v-for="dot in 3"
        :key="dot"
        class="conf-dot"
        :class="{ filled: interest.confidence >= dot * 0.33 }"
      />
    </div>
    <div class="interest-rank">#{{ rank }}</div>
    <div class="interest-content">
      <span class="interest-name">{{ formatTagName(interest.tag) }}</span>
      <div class="interest-meta">
        <span class="interest-dimension">
          {{ getDimensionIcon(interest.dimension) }} {{ interest.dimension }}
        </span>
        <span class="interest-strength">
          {{ Math.round(interest.value * 100) }}%
        </span>
      </div>
    </div>
    <div
      class="interest-bar"
      :title="`Affinity strength: ${Math.round(interest.value * 100)}%`"
    >
      <div
        class="interest-fill"
        :style="{ width: `${interest.value * 100}%` }"
      />
    </div>
    <div
      v-if="interest.source !== 'behavioral'"
      class="interest-source"
      :class="`source-${interest.source}`"
    >
      {{ interest.source === 'onboarding' ? 'survey' : 'stated' }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatTagName, getDimensionIcon } from '~/composables/useProfileData';
import type { TopAffinity } from '../types';

export interface Props {
  interest: TopAffinity;
  rank: number;
  delay: number;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.interest-card {
  position: relative;
  background: var(--bg-card, #ffffff);
  border-radius: var(--radius-lg, 1rem);
  padding: 2rem 1.25rem 1.25rem;
  box-shadow: var(--shadow-sm, 0 0.0625rem 0.1875rem rgba(26, 26, 26, 0.04));
  border: 0.0625rem solid transparent;
  transition: all var(--transition-base, 250ms cubic-bezier(0.4, 0, 0.2, 1));
  opacity: 0;
  animation: interest-appear 0.5s ease forwards;
  animation-delay: var(--delay);

  &:hover {
    transform: translateY(-0.1875rem);
    box-shadow: var(--shadow-md, 0 0.25rem 0.75rem rgba(26, 26, 26, 0.06));
    border-color: var(--accent-teal, #0d7377);
  }

  &.rank-1 {
    border-left: 0.25rem solid var(--accent-teal, #0d7377);

    .interest-rank {
      color: var(--accent-teal, #0d7377);
      opacity: 1;
    }
  }

  &.rank-2 {
    border-left: 0.25rem solid var(--accent-coral, #e07a5f);

    .interest-rank {
      color: var(--accent-teal, #0d7377);
      opacity: 1;
    }
  }

  &.rank-3 {
    border-left: 0.25rem solid var(--accent-gold, #d4a373);

    .interest-rank {
      color: var(--accent-teal, #0d7377);
      opacity: 1;
    }
  }
}

@keyframes interest-appear {
  from {
    opacity: 0;
    transform: translateY(0.625rem) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.interest-rank {
  position: absolute;
  top: 0.625rem;
  right: 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted, #8c8c8c);
  opacity: 0.6;
}

.interest-confidence {
  position: absolute;
  top: 0.625rem;
  left: 1.25rem;
  display: flex;
  gap: 0.25rem;
  cursor: help;
}

.conf-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: var(--radius-full, 9999px);
  background: var(--bg-muted, #edede9);
  transition: background 0.2s ease;

  &.filled {
    background: var(--accent-teal, #0d7377);
  }
}

.interest-content {
  margin-bottom: 0.5rem;
}

.interest-name {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  display: block;
  margin-bottom: 0.375rem;
  line-height: 1.3;
}

.interest-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.625rem;
}

.interest-dimension {
  font-size: 0.6875rem;
  color: var(--text-muted, #8c8c8c);
  text-transform: capitalize;
}

.interest-strength {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--accent-teal, #0d7377);
}

.interest-bar {
  height: 0.3125rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.interest-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--accent-teal, #0d7377),
    var(--accent-teal-light, #14919b)
  );
  border-radius: var(--radius-full, 9999px);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.interest-source {
  position: absolute;
  bottom: 0.75rem;
  left: 1.25rem;
  font-size: 0.5625rem;
  padding: 0.125rem 0.375rem;
  background: var(--accent-teal, #0d7377);
  color: white;
  border-radius: var(--radius-sm, 0.375rem);
  text-transform: uppercase;
  letter-spacing: 0.03em;

  &.source-onboarding {
    background: var(--accent-teal, #0d7377);
  }

  &.source-explicit {
    background: #8b5cf6;
  }
}
</style>
