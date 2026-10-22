<template>
  <div class="activity-item my-1" :class="`action-${item.action}`">
    <div class="activity-icon" :class="`icon-${item.action}`">
      {{ actionIcon }}
    </div>
    <div class="activity-content">
      <div class="activity-header">
        <span class="activity-time">{{ formattedTime }}</span>
        <span class="action-badge" :class="`badge-${item.action}`">
          {{ item.action }}
        </span>
      </div>
      <h4 class="activity-title">
        {{ item.content?.title || 'Untitled' }}
      </h4>
      <div v-if="hasMetaInfo" class="activity-meta">
        <span v-if="item.duration">{{ formattedDuration }}</span>
        <span v-if="item.engagement?.scrollDepth">
          {{ item.engagement.scrollDepth }}% scrolled
        </span>
        <span v-if="item.nodeType" class="text-capitalize text-orange-accent-4">
          {{ item.nodeType }}
        </span>
      </div>
      <div v-if="item.content?.tags?.length" class="activity-tags">
        <span
          v-for="tag in item.content.tags.slice(0, 8)"
          :key="tag"
          class="activity-tag"
        >
          {{ formatTagName(tag) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  formatTagName,
  formatTime,
  formatDurationMs,
} from '~/composables/useProfileData';
import { ACTION_ICONS } from '../constants';
import type { VisitHistoryItem } from '../types';

export interface Props {
  item: VisitHistoryItem;
}

const props = defineProps<Props>();

const actionIcon = computed(() => ACTION_ICONS[props.item.action] || '•');
const formattedTime = computed(() => formatTime(props.item.timestamp));
const formattedDuration = computed(() =>
  props.item.duration ? formatDurationMs(props.item.duration) : '',
);

const hasMetaInfo = computed(
  () =>
    props.item.duration ||
    props.item.engagement?.scrollDepth ||
    props.item.nodeType,
);
</script>

<style lang="scss" scoped>
.activity-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-radius: var(--radius-md, 0.625rem);
  border: 0.0625rem solid var(--bg-muted, #edede9);
  transition: all var(--transition-base, 250ms cubic-bezier(0.4, 0, 0.2, 1));

  &:hover {
    border-color: var(--accent-teal, #0d7377);
    box-shadow: var(--shadow-sm, 0 0.0625rem 0.1875rem rgba(26, 26, 26, 0.04));
  }
}

.activity-icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm, 0.375rem);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  flex-shrink: 0;

  &.icon-complete {
    background: #d1fae5;
    color: var(--success, #2d6a4f);
  }

  &.icon-view {
    background: rgba(13, 115, 119, 0.1);
    color: var(--accent-teal, #0d7377);
  }

  &.icon-bookmark {
    background: #fef3c7;
    color: var(--warning, #bc6c25);
  }

  &.icon-skip {
    background: var(--bg-subtle, #f5f5f3);
    color: var(--text-muted, #8c8c8c);
  }
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
}

.action-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  &.badge-complete {
    background: #d1fae5;
    color: var(--success, #2d6a4f);
  }

  &.badge-view {
    background: rgba(13, 115, 119, 0.1);
    color: var(--accent-teal, #0d7377);
  }

  &.badge-bookmark {
    background: #fef3c7;
    color: var(--warning, #bc6c25);
  }

  &.badge-skip {
    background: var(--bg-subtle, #f5f5f3);
    color: var(--text-muted, #8c8c8c);
  }
}

.activity-title {
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.3;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary, #1a1a1a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
}

.activity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}

.activity-tag {
  padding: 0.125rem 0.5rem;
  background: rgba(13, 115, 119, 0.1);
  border-radius: var(--radius-sm, 0.375rem);
  font-size: 0.6875rem;
  color: var(--accent-teal, #0d7377);
}
</style>
