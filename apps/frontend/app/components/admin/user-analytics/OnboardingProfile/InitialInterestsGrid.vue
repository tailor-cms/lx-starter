<template>
  <div v-if="interests.length" class="initial-interests">
    <div class="section-label">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="star-icon"
      >
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02
          12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span>Initial Interests from Survey</span>
    </div>
    <div class="interests-list">
      <span
        v-for="(interest, idx) in interests"
        :key="interest.tag"
        class="interest-chip"
        :style="{ '--delay': `${idx * 30}ms` }"
      >
        {{ formatTagName(interest.tag) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { OnboardingAffinity } from '../types';
import { formatTagName } from '~/composables/useProfileData';

export interface Props {
  interests: OnboardingAffinity[];
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.initial-interests {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 0.0625rem solid var(--bg-muted, #edede9);
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.star-icon {
  color: var(--warning, #bc6c25);
}

.interests-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.interest-chip {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: rgba(13, 115, 119, 0.1);
  border-radius: var(--radius-full, 9999px);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--accent-teal, #0d7377);
  animation: tagFadeIn 0.4s ease-out backwards;
  animation-delay: var(--delay, 0ms);
}

@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
