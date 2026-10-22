import { apiClient as api } from '@/api';
import type { TrackingData } from '~/types/activity';
import { useLocalStorage } from '@vueuse/core';

// Tracks a course's lessons for progress calculation.
// Stored in localStorage to enable offline progress display
// without requiring API calls to fetch course structure.
interface CourseProgressMeta {
  // All lesson UIDs in the course (needed to calculate completion %)
  lessonUids: string[];
  // Timestamp of last user visit to this course
  lastVisitedAt?: string;
}

export const useProgressStore = defineStore('progress', () => {
  // Maps lesson UID → completion timestamp.
  // Source of truth for what the user has completed.
  const completedLessons = useLocalStorage<Record<string, string>>(
    'lx-completed-lessons',
    {},
  );

  // Maps course UID → progress metadata.
  // Enables calculating per-course completion % without API calls.
  const courseProgressMeta = useLocalStorage<
    Record<string, CourseProgressMeta>
  >('lx-course-progress', {});

  // Helper to calculate completion percentage from a list of lesson UIDs
  const calcCompletion = (uids: string[], emptyDefault = 100): number => {
    if (uids.length === 0) return emptyDefault;
    const completed = uids.filter(
      (uid) => !!completedLessons.value[uid],
    ).length;
    return Math.round((completed / uids.length) * 100);
  };

  const isLessonCompleted = (uid: string): boolean => {
    return !!completedLessons.value[uid];
  };

  /**
   * Record a completion activity to the API
   * Accepts optional tracking data from useActivityTracking for rich context
   */
  const trackComplete = async (nodeId: string, trackingData?: TrackingData) => {
    try {
      await api.learning.recordActivity({
        body: {
          nodeId,
          action: 'complete',
          duration: trackingData?.duration,
          context: trackingData?.context,
          engagement: trackingData?.engagement,
          device: trackingData?.device,
        },
      });
    } catch (error) {
      console.error('Failed to track completion:', error);
    }
  };

  /**
   * Mark a lesson as visited/completed.
   * Called when user enters/views a lesson.
   * Updates last visited timestamp on every visit.
   * Only sends API tracking on first visit.
   */
  const markLessonCompleted = (
    lessonUid: string,
    trackingData?: TrackingData,
  ): void => {
    const isFirstVisit = !completedLessons.value[lessonUid];
    // Always update last visited timestamp
    completedLessons.value[lessonUid] = new Date().toISOString();
    // Only track completion on first visit
    if (isFirstVisit) {
      trackComplete(lessonUid, trackingData);
    }
  };

  /**
   * Get the most recently viewed lesson from a list of lesson UIDs.
   * Returns undefined if none of the lessons have been viewed.
   */
  const getLastViewedLesson = (lessonUids: string[]): string | undefined => {
    let lastUid: string | undefined;
    let lastTime = 0;
    for (const uid of lessonUids) {
      const timestamp = completedLessons.value[uid];
      if (timestamp) {
        const time = new Date(timestamp).getTime();
        if (time > lastTime) {
          lastTime = time;
          lastUid = uid;
        }
      }
    }
    return lastUid;
  };

  // For backward compatibility - returns 100 if completed, 0 if not
  const getLessonCompletion = (uid: string): number => {
    return isLessonCompleted(uid) ? 100 : 0;
  };

  const completedLessonsCount = computed(() => {
    return Object.keys(completedLessons.value).length;
  });

  // Register a course's lessons for progress tracking.
  // Call this when a course is loaded to enable per-course progress calculation.
  const trackCourse = (
    courseUid: string,
    lessonUids: string[],
    visited = false,
  ): void => {
    const existing = courseProgressMeta.value[courseUid];
    courseProgressMeta.value[courseUid] = {
      lessonUids,
      lastVisitedAt: visited
        ? new Date().toISOString()
        : existing?.lastVisitedAt,
    };
  };

  const getLastVisited = (courseUid: string): string | undefined => {
    return courseProgressMeta.value[courseUid]?.lastVisitedAt;
  };

  const lastVisitedCourseUid = computed<string | null>(() => {
    const entries = Object.entries(courseProgressMeta.value);
    if (entries.length === 0) return null;

    const sorted = entries
      .filter(([, meta]) => meta.lastVisitedAt)
      .sort(
        ([, a], [, b]) =>
          new Date(b.lastVisitedAt!).getTime() -
          new Date(a.lastVisitedAt!).getTime(),
      );

    return sorted[0]?.[0] ?? null;
  });

  const getCourseCompletion = (courseUid: string): number => {
    const meta = courseProgressMeta.value[courseUid];
    return meta ? calcCompletion(meta.lessonUids, 0) : 0;
  };

  const isCourseTracked = (courseUid: string): boolean => {
    return !!courseProgressMeta.value[courseUid];
  };

  const totalTrackedLessons = computed(() => {
    return Object.values(courseProgressMeta.value).reduce(
      (sum, r) => sum + r.lessonUids.length,
      0,
    );
  });

  // Overall progress across all tracked courses
  const globalProgress = computed(() => {
    if (totalTrackedLessons.value === 0) return 0;
    const allUids = Object.values(courseProgressMeta.value).flatMap(
      (r) => r.lessonUids,
    );
    return calcCompletion(allUids, 0);
  });

  /**
   * Clear local storage only (no API call)
   * Used when admin resets their own profile via admin endpoint
   */
  const clearLocal = (): void => {
    completedLessons.value = {};
    courseProgressMeta.value = {};
  };

  // Check if there's any local progress data
  const hasLocalData = computed(
    () =>
      Object.keys(completedLessons.value).length > 0 ||
      Object.keys(courseProgressMeta.value).length > 0,
  );

  /**
   * Sync localStorage with backend state using pre-fetched activity data
   * If backend says progress is NOT available, clear localStorage
   */
  const sync = (activity: any | null): void => {
    const hasBackendProgress =
      !!activity?.visitHistory?.length || !!activity?.affinities;
    if (!hasBackendProgress && hasLocalData.value) {
      clearLocal();
    }
  };

  return {
    // Lesson-level
    isLessonCompleted,
    markLessonCompleted,
    getLessonCompletion,
    getLastViewedLesson,
    completedLessonsCount,
    // Cross-course progress (works offline via localStorage)
    trackCourse,
    getCourseCompletion,
    isCourseTracked,
    getLastVisited,
    lastVisitedCourseUid,
    globalProgress,
    totalTrackedLessons,
    hasLocalData,
    // Utility
    clearLocal,
    sync,
  };
});
