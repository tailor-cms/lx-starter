<template>
  <Teleport to="body">
    <Transition name="dashboard-fade">
      <div v-if="isVisible" class="dashboard-overlay" @click.self="close">
        <div ref="containerRef" class="dashboard-container">
          <VBtn
            aria-label="Close dashboard"
            class="close-btn"
            color="white"
            icon="mdi-close"
            rounded="xl"
            variant="elevated"
            @click="close"
          />
          <div class="dashboard-scroll">
            <HeroHeader
              :is-visible="sectionsVisible.header"
              :initials="userInitials"
              :email="user?.email || 'Unknown User'"
              :member-since="formatDate(profileData?.createdAt)"
              :last-active-text="lastActiveText"
              :journey-info="journeyInfo"
              :experience-info="experienceInfo"
            />
            <EngagementHealth
              :is-visible="sectionsVisible.engagement"
              :velocity="velocity"
              :velocity-description="velocityDescription"
              :streak-days="streakDays"
              :streak-description="streakDescription"
              :formatted-learning-time="formattedLearningTime"
              :sessions-count="sessionsCount"
              :total-interactions="totalInteractions"
              :completions-count="completionsCount"
            />
            <OnboardingProfile
              :is-visible="sectionsVisible.onboarding"
              :completed="onboardingCompleted"
              :completed-at="
                onboardingCompletedAt
                  ? formatDate(onboardingCompletedAt)
                  : undefined
              "
              :goals="userGoals"
              :formatted-answers="formattedAnswers"
              :questions-loading="questionsLoading"
              :onboarding-affinities="onboardingAffinities"
            />
            <CourseProgress
              :is-visible="sectionsVisible.courses"
              :courses="courseProgress"
              :course-stats="courseStats"
            />
            <InterestProfile
              :is-visible="sectionsVisible.affinities"
              :affinity-count="user?.affinityCount || 0"
              :active-dimensions-count="activeDimensionsCount"
              :top-affinities="topAffinitiesWithDetails"
              :trending-interests="trendingInterests"
              :get-dimension-count="getDimensionCount"
              :get-dimension-strength="getDimensionStrength"
              :get-top-tags-for-dimension="getTopTagsForDimension"
            />
            <ActivityTimeline
              :is-visible="sectionsVisible.timeline"
              :grouped-timeline="groupedTimeline"
              :total-items="visitHistory.length"
              :max-items="MAX_TIMELINE_ITEMS"
              :show-all="showAllTimeline"
              @toggle-show-all="showAllTimeline = !showAllTimeline"
            />
            <ContentAnalytics
              :is-visible="sectionsVisible.analytics"
              :avg-video-completion="avgVideoCompletion"
              :quiz-accuracy="quizAccuracy"
              :quiz-breakdown="quizBreakdown"
              :entry-point-stats="entryPointStats"
              :device-stats="deviceStats"
            />
            <RawData :is-visible="sectionsVisible.raw" :data="profileData" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { formatDate, useProfileData } from '~/composables/useProfileData';
import { apiClient as api } from '~/api';
import { MAX_TIMELINE_ITEMS } from './constants';
import type { ProfileQuestionDto } from 'app-api-client';
import type { ProcessedUser } from './types';

// Section Components
import HeroHeader from './HeroHeader/index.vue';
import EngagementHealth from './EngagementHealth/index.vue';
import OnboardingProfile from './OnboardingProfile/index.vue';
import CourseProgress from './CourseProgress/index.vue';
import InterestProfile from './InterestProfile/index.vue';
import ActivityTimeline from './ActivityTimeline/index.vue';
import ContentAnalytics from './ContentAnalytics/index.vue';
import RawData from './RawData/index.vue';

const props = defineProps<{
  visible: boolean;
  user: ProcessedUser | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const containerRef = ref<HTMLElement | null>(null);
const showAllTimeline = ref(false);

// Profile questions for survey response display
const profileQuestions = ref<ProfileQuestionDto[]>([]);
const questionsLoading = ref(false);

// Use the composable
const userRef = toRef(props, 'user');
const {
  profileData,
  visitHistory,
  userInitials,
  experienceInfo,
  journeyInfo,
  lastActiveText,
  velocity,
  velocityDescription,
  streakDays,
  streakDescription,
  formattedLearningTime,
  sessionsCount,
  totalInteractions,
  completionsCount,
  onboardingCompleted,
  onboardingCompletedAt,
  userGoals,
  getFormattedAnswers,
  onboardingAffinities,
  courseProgress,
  courseStats,
  activeDimensionsCount,
  getDimensionCount,
  getDimensionStrength,
  getTopTagsForDimension,
  topAffinitiesWithDetails,
  trendingInterests,
  getGroupedTimeline,
  avgVideoCompletion,
  quizBreakdown,
  quizAccuracy,
  entryPointStats,
  deviceStats,
} = useProfileData(userRef);

// Formatted answers with profile questions
const formattedAnswers = computed(() =>
  getFormattedAnswers(profileQuestions.value),
);

// Grouped timeline
const groupedTimeline = computed(() =>
  getGroupedTimeline(showAllTimeline.value),
);

// Section visibility state
const sectionsVisible = reactive({
  header: false,
  engagement: false,
  onboarding: false,
  courses: false,
  affinities: false,
  timeline: false,
  analytics: false,
  raw: false,
});

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

async function loadProfileQuestions() {
  if (profileQuestions.value.length > 0) return;
  questionsLoading.value = true;
  try {
    const res = await api.content.getAnalysis();
    profileQuestions.value = res.data?.profilingQuestions || [];
  } catch (e) {
    console.error('Failed to load profile questions:', e);
  } finally {
    questionsLoading.value = false;
  }
}

function close() {
  isVisible.value = false;
}

// Stagger section visibility on mount
watch(isVisible, (visible) => {
  if (visible) {
    loadProfileQuestions();
    const delays = [100, 200, 350, 500, 650, 800, 950, 1100];
    const sections = [
      'header',
      'engagement',
      'onboarding',
      'courses',
      'affinities',
      'timeline',
      'analytics',
      'raw',
    ] as const;

    sections.forEach((section, i) => {
      setTimeout(() => {
        sectionsVisible[section] = true;
      }, delays[i]);
    });
  } else {
    Object.keys(sectionsVisible).forEach((key) => {
      sectionsVisible[key as keyof typeof sectionsVisible] = false;
    });
    showAllTimeline.value = false;
  }
});

// Close on escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible.value) close();
  };
  document.addEventListener('keydown', handleEscape);
  onUnmounted(() => document.removeEventListener('keydown', handleEscape));
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.dashboard-overlay {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;

  --bg-page: #fafaf8;
  --bg-card: #ffffff;
  --bg-subtle: #f5f5f3;
  --bg-muted: #edede9;

  --text-primary: #1a1a1a;
  --text-secondary: #5c5c5c;
  --text-muted: #6b6b6b;
  --text-inverse: #ffffff;

  --accent-teal: #0d7377;
  --accent-teal-light: #14919b;
  --accent-coral: #e07a5f;
  --accent-coral-light: #f2cc8f;
  --accent-gold: #d4a373;
  --accent-gold-light: #e9c46a;
  --accent-purple: #7209b7;
  --accent-sage: #81b29a;
  --accent-blue: #3d5a80;

  --success: #2d6a4f;
  --warning: #bc6c25;
  --danger: #9b2226;

  --shadow-sm: 0 1px 3px rgba(26, 26, 26, 0.04);
  --shadow-md: 0 4px 12px rgba(26, 26, 26, 0.06);
  --shadow-lg: 0 8px 24px rgba(26, 26, 26, 0.08);
  --shadow-xl: 0 16px 48px rgba(26, 26, 26, 0.12);

  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;

  --transition-fast: 150ms ease;
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);

  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(26, 26, 26, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

.dashboard-container {
  position: relative;
  width: 100%;
  max-width: 1400px;
  max-height: calc(100vh - 3rem);
  background: var(--bg-page);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.dashboard-scroll {
  height: calc(100vh - 3rem);
  max-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.dashboard-scroll::-webkit-scrollbar {
  width: 0.5rem;
}

.dashboard-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.dashboard-scroll::-webkit-scrollbar-thumb {
  background: var(--bg-muted);
  border-radius: var(--radius-full);
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 1.125rem;
  z-index: 100;
}

/* ============================================================================
   TRANSITIONS
   ============================================================================ */
.dashboard-fade-enter-active {
  transition: opacity 0.3s ease;
}

.dashboard-fade-enter-active .dashboard-container {
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.dashboard-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dashboard-fade-leave-active .dashboard-container {
  transition:
    transform 0.25s ease,
    opacity 0.2s ease;
}

.dashboard-fade-enter-from,
.dashboard-fade-leave-to {
  opacity: 0;
}

.dashboard-fade-enter-from .dashboard-container {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.dashboard-fade-leave-to .dashboard-container {
  opacity: 0;
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .dashboard-overlay {
    padding: 0;
  }

  .dashboard-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .dashboard-scroll {
    height: 100vh;
  }

  .close-btn {
    top: 0.75rem;
    right: 0.75rem;
  }
}
</style>
