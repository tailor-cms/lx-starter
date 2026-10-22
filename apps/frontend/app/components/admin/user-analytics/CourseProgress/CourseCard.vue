<template>
  <div
    class="course-card bg-white"
    :class="{ 'is-completed': course.completed }"
    :style="{ '--delay': `${delay}ms` }"
  >
    <div class="course-header pb-3">
      <span
        class="status-badge"
        :class="course.completed ? 'completed' : 'in-progress'"
      >
        <span v-if="course.completed">✓</span>
        {{ course.completed ? 'Completed' : 'In Progress' }}
      </span>
      <span class="course-visits">{{ course.visitCount }} visits</span>
    </div>
    <h4 class="course-title">{{ course.title }}</h4>
    <div class="course-progress-bar">
      <div
        :class="{ completed: course.completed }"
        :style="{ width: `${course.progress}%` }"
        class="course-progress-fill"
      />
    </div>
    <div class="course-meta">
      <span class="course-time">
        <VIcon icon="mdi-clock-outline" size="12" />
        {{ formattedTime }}
      </span>
      <span class="course-last-visit">Last: {{ relativeDate }}</span>
    </div>
    <div v-if="course.tags?.length" class="course-tags">
      <span
        v-for="tag in course.tags.slice(0, 3)"
        :key="tag"
        class="course-tag"
      >
        {{ formatTagName(tag) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CourseProgressItem } from '../types';
import {
  formatTagName,
  formatMs,
  formatRelativeDate,
} from '~/composables/useProfileData';

export interface Props {
  course: CourseProgressItem;
  delay: number;
}

const props = defineProps<Props>();

const formattedTime = computed(() => formatMs(props.course.totalTimeSpent));
const relativeDate = computed(() =>
  formatRelativeDate(props.course.lastVisitedAt),
);
</script>

<style lang="scss" scoped>
.course-card {
  background: var(--bg-card, #ffffff);
  border-radius: var(--radius-lg, 16px);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(26, 26, 26, 0.04));
  border-left: 4px solid var(--accent-coral, #e07a5f);
  animation: course-appear 0.4s ease forwards;
  animation-delay: var(--delay);
  opacity: 0;
  transition: all var(--transition-base, 250ms cubic-bezier(0.4, 0, 0.2, 1));
}

.course-card:hover {
  box-shadow: var(--shadow-md, 0 4px 12px rgba(26, 26, 26, 0.06));
  transform: translateY(-2px);
}

.course-card.is-completed {
  border-left-color: var(--success, #2d6a4f);
}

@keyframes course-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-badge.completed {
  background: #d1fae5;
  color: var(--success, #2d6a4f);
}

.status-badge.in-progress {
  background: #fef3c7;
  color: var(--warning, #bc6c25);
}

.course-visits {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
}

.course-title {
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.3;
  margin: 0 0 0.75rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-primary, #1a1a1a);
}

.course-progress-bar {
  height: 0.375rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-full, 9999px);
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.course-progress-fill {
  height: 100%;
  background: var(--accent-coral, #e07a5f);
  border-radius: var(--radius-full, 9999px);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.course-progress-fill.completed {
  background: var(--success, #2d6a4f);
}

.course-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
  margin-bottom: 0.75rem;
}

.course-time {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.course-last-visit {
  flex: 1;
  text-align: right;
}

.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.course-tag {
  padding: 0.125rem 0.5rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-sm, 6px);
  font-size: 0.6875rem;
  color: var(--text-secondary, #5c5c5c);
}
</style>
