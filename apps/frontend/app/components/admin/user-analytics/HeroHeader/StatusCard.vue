<template>
  <div class="status-card" :class="[`${type}-card`, stageClass]">
    <div class="status-card-icon">
      <span v-if="type === 'journey'" class="journey-indicator" />
      <VIcon v-else icon="mdi-chart-bar" size="20" />
    </div>
    <div class="status-card-content">
      <span class="status-card-label">{{ title }}</span>
      <span class="status-card-value">{{ info.label }}</span>
      <span class="status-card-desc">{{ info.description }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { StatusCardInfo } from '../types';

export interface Props {
  type: 'journey' | 'level';
  title: string;
  info: StatusCardInfo;
}

const props = defineProps<Props>();

const stageClass = computed(() =>
  props.type === 'journey' ? `stage-${props.info.stage}` : `level-${props.info.stage}`,
);
</script>

<style lang="scss" scoped>
.status-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1.125rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(0.75rem);
  border-radius: var(--radius-lg, 1rem);
  border: 0.0625rem solid rgba(255, 255, 255, 0.15);
  min-width: 11.25rem;
  transition: all var(--transition-base, 250ms cubic-bezier(0.4, 0, 0.2, 1));

  &:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-0.125rem);
  }

  @media (max-width: 600px) {
    min-width: auto;
    width: 100%;
  }
}

.status-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-md, 0.625rem);
  background: rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

.journey-indicator {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: var(--radius-full, 9999px);
  background: var(--accent-gold-light, #e9c46a);
  animation: pulse-glow 2s ease-in-out infinite;
  box-shadow: 0 0 0.75rem rgba(212, 175, 55, 0.5);
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0.75rem rgba(212, 175, 55, 0.5);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.9);
    box-shadow: 0 0 0.5rem rgba(212, 175, 55, 0.3);
  }
}

.journey-card {
  &.stage-browse .journey-indicator {
    background: #9ca3af;
    box-shadow: 0 0 0.75rem rgba(156, 163, 175, 0.5);
  }

  &.stage-explore .journey-indicator {
    background: var(--accent-teal, #0d7377);
    box-shadow: 0 0 0.75rem rgba(13, 115, 119, 0.5);
  }

  &.stage-targeted .journey-indicator {
    background: var(--accent-coral, #e07a5f);
    box-shadow: 0 0 0.75rem rgba(232, 121, 121, 0.5);
  }

  &.stage-flow .journey-indicator {
    background: var(--accent-gold, #d4a373);
    box-shadow: 0 0 0.75rem rgba(212, 175, 55, 0.6);
  }
}

.status-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.status-card-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03125rem;
  color: #ffffff;
}

.status-card-value {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.status-card-desc {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.3;
  margin-top: 0.125rem;
}

.level-card {
  &.level-beginner .status-card-icon {
    background: rgba(74, 222, 128, 0.5);
    color: #86efac;
  }

  &.level-intermediate .status-card-icon {
    background: rgba(20, 184, 166, 0.5);
    color: #5eead4;
  }

  &.level-advanced .status-card-icon {
    background: rgba(167, 139, 250, 0.5);
    color: #c4b5fd;
  }
}
</style>
