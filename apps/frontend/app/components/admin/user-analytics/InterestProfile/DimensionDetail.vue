<template>
  <Transition name="expand">
    <div v-if="dimension" class="dimension-detail">
      <div class="detail-header">
        <span class="header-icon">{{ getDimensionIcon(dimension) }}</span>
        <span class="header-title">{{ dimension }} interests</span>
        <VBtn
          icon="mdi-close"
          variant="text"
          size="small"
          class="close-btn"
          @click="$emit('close')"
        />
      </div>
      <div class="detail-divider" />
      <div class="detail-content">
        <div v-for="tag in tags" :key="tag.name" class="detail-tag">
          <span class="tag-name">{{ formatTagName(tag.name) }}</span>
          <div class="tag-bar-track">
            <div
              class="tag-bar-fill"
              :style="{ width: `${tag.value * 100}%` }"
            />
          </div>
          <span class="tag-value">{{ Math.round(tag.value * 100) }}%</span>
          <span
            v-if="tag.source !== 'behavioral'"
            class="source-badge"
            :class="tag.source === 'onboarding' ? 'survey' : 'stated'"
          >
            {{ tag.source === 'onboarding' ? 'survey' : 'stated' }}
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import type { DimensionTag } from '../types';
import { formatTagName, getDimensionIcon } from '~/composables/useProfileData';

export interface Props {
  dimension: string | null;
  tags: DimensionTag[];
}

defineProps<Props>();

defineEmits<{
  close: [];
}>();
</script>

<style lang="scss" scoped>
.dimension-detail {
  margin-top: 1rem;
  background: rgba(13, 115, 119, 0.06);
  border: 0.0625rem solid rgba(13, 115, 119, 0.15);
  border-radius: var(--radius-lg, 1rem);
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: rgba(13, 115, 119, 0.08);
}

.header-icon {
  font-size: 1.25rem;
}

.header-title {
  flex: 1;
  font-weight: 600;
  font-size: 0.9375rem;
  text-transform: capitalize;
  color: var(--accent-teal, #0d7377);
}

.close-btn {
  color: var(--text-muted, #8c8c8c) !important;
  opacity: 0.7;

  &:hover {
    opacity: 1;
    color: var(--text-primary, #1a1a1a) !important;
  }
}

.detail-divider {
  height: 0.0625rem;
  background: rgba(13, 115, 119, 0.1);
}

.detail-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-tag {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 600px) {
    flex-wrap: wrap;
  }
}

.tag-name {
  width: 7.5rem;
  flex-shrink: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #1a1a1a);

  @media (max-width: 600px) {
    width: 100%;
  }
}

.tag-bar-track {
  flex: 1;
  height: 0.375rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
}

.tag-bar-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--accent-teal, #0d7377),
    var(--accent-teal-light, #14919b)
  );
  border-radius: var(--radius-full, 9999px);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-value {
  width: 2.8125rem;
  text-align: right;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted, #8c8c8c);
}

.source-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.6875rem;
  font-weight: 600;

  &.survey {
    background: rgba(45, 106, 79, 0.12);
    color: #059669;
  }

  &.stated {
    background: rgba(124, 58, 237, 0.1);
    color: #7c3aed;
  }
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 31.25rem;
  margin-top: 1rem;
}
</style>
