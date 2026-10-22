<template>
  <section class="section courses-section" :class="{ 'is-visible': isVisible }">
    <div class="section-header mb-10">
      <div class="section-icon gradient-coral">
        <VIcon icon="mdi-book-outline" size="20" />
      </div>
      <div>
        <h2 class="section-title">Course Progress</h2>
        <p class="section-subtitle">
          {{ courseStats.total }} courses engaged, {{ courseStats.completed }}
          completed
        </p>
      </div>
    </div>
    <div v-if="courses.length" class="courses-grid">
      <CourseCard
        v-for="(course, idx) in courses"
        :key="course.repositoryId"
        :course="course"
        :delay="idx * 60"
      />
    </div>
    <EmptyState
      v-else
      message="No courses started yet"
      icon="mdi-book-open-page-variant"
    />
  </section>
</template>

<script lang="ts" setup>
import type { CourseProgressItem } from '../types';
import CourseCard from './CourseCard.vue';
import EmptyState from '../shared/EmptyState.vue';

export interface Props {
  isVisible: boolean;
  courses: CourseProgressItem[];
  courseStats: { total: number; completed: number };
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.section {
  padding: 2.5rem 3.5rem;
  opacity: 0;
  transform: translateY(30px);
  transition: all var(--transition-slow, 400ms cubic-bezier(0.4, 0, 0.2, 1));
}

.section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.section-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-lg, 1rem);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse, #ffffff);
  flex-shrink: 0;
}

.gradient-coral {
  background: linear-gradient(
    135deg,
    var(--accent-coral, #e07a5f),
    var(--accent-coral-light, #f2cc8f)
  );
}

.section-title {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 2px 0;
  color: var(--text-primary, #1a1a1a);
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted, #8c8c8c);
  margin: 0;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

/* When only 1-2 courses, limit max width */
.courses-grid:has(.course-card:only-child),
.courses-grid:has(.course-card:nth-child(2):last-child) {
  grid-template-columns: repeat(auto-fill, minmax(320px, 400px));
}

@media (max-width: 768px) {
  .section {
    padding: 1.75rem 1.5rem;
  }

  .section-title {
    font-size: 1.25rem;
  }
}
</style>
