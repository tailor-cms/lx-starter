import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  startOfDay,
} from 'date-fns';

import {
  DIMENSIONS,
  EXPERIENCE_LEVEL_LABELS,
  EXPERIENCE_LEVEL_DESCRIPTIONS,
  ENTRY_POINT_COLORS,
  ENTRY_POINT_LABELS,
  JOURNEY_STAGE_LABELS,
  JOURNEY_STAGE_DESCRIPTIONS,
  MAX_TIMELINE_ITEMS,
} from '~/components/admin/user-analytics/constants';
import type {
  CourseProgressItem,
  DimensionTag,
  DeviceStat,
  EntryPointStat,
  FormattedAnswer,
  OnboardingAffinity,
  ProfileData,
  ProcessedUser,
  StatusCardInfo,
  TopAffinity,
  TrendingInterest,
  TimelineGroup,
  VisitHistoryItem,
} from '~/components/admin/user-analytics/types';
import type { ProfileQuestionDto } from 'app-api-client';

type AffinitySource = 'behavioral' | 'onboarding' | 'explicit';

function getPrimarySource(
  sources: Record<string, number> = {},
): AffinitySource {
  const { explicit = 0, onboarding = 0, behavioral = 0 } = sources;
  if (explicit > 0 && explicit >= Math.max(onboarding, behavioral))
    return 'explicit';
  if (onboarding > behavioral) return 'onboarding';
  return 'behavioral';
}

export function useProfileData(user: Ref<ProcessedUser | null>) {
  const profileData = computed<ProfileData>(() => user.value?.activity || {});
  const engagement = computed(() => profileData.value?.engagement || {});
  const affinities = computed(() => profileData.value?.affinities || {});
  const visitHistory = computed<VisitHistoryItem[]>(
    () => profileData.value?.visitHistory || [],
  );

  const userInitials = computed(() => {
    const email = user.value?.email || '';
    return email.substring(0, 2).toUpperCase();
  });

  const experienceInfo = computed<StatusCardInfo>(() => {
    const stage = profileData.value?.experienceLevel || 'beginner';
    return {
      stage,
      label: EXPERIENCE_LEVEL_LABELS[stage] ?? 'Beginner',
      description:
        EXPERIENCE_LEVEL_DESCRIPTIONS[stage] ?? 'New to the subject matter',
    };
  });

  const journeyInfo = computed<StatusCardInfo>(() => {
    const stage = engagement.value?.journeyStage || 'browse';
    return {
      stage,
      label: JOURNEY_STAGE_LABELS[stage] ?? 'Browsing',
      description:
        JOURNEY_STAGE_DESCRIPTIONS[stage] ??
        'Casually looking around the platform',
    };
  });

  const lastActiveText = computed(() => {
    const lastActive = engagement.value?.lastActiveAt;
    if (!lastActive) return 'Never active';
    try {
      return `Active ${formatDistanceToNow(new Date(lastActive), { addSuffix: true })}`;
    } catch {
      return 'Recently active';
    }
  });

  const velocity = computed(() => engagement.value?.velocity || 0);
  const velocityDescription = computed(() => {
    if (velocity.value >= 90) return 'Exceptional momentum!';
    if (velocity.value >= 70) return 'Strong engagement';
    if (velocity.value >= 40) return 'Building momentum';
    return 'Getting started';
  });

  const streakDays = computed(() => engagement.value?.streakDays || 0);
  const streakDescription = computed(() => {
    if (streakDays.value === 0) return 'Start your streak!';
    if (streakDays.value === 1) return 'Keep it going!';
    if (streakDays.value >= 7) return 'On fire!';
    return 'consecutive days';
  });

  const totalTimeSpent = computed(() => engagement.value?.totalTimeSpent || 0);
  const formattedLearningTime = computed(() => formatMs(totalTimeSpent.value));

  const sessionsCount = computed(() => {
    const sessions = new Set(
      visitHistory.value.map((v) => v.context?.sessionId),
    );
    return sessions.size;
  });

  const totalInteractions = computed(
    () => engagement.value?.totalInteractions || 0,
  );

  const completionsCount = computed(
    () => visitHistory.value.filter((v) => v.action === 'complete').length,
  );

  const onboardingData = computed(() => profileData.value?.onboarding || {});
  const onboardingCompleted = computed(
    () => !!onboardingData.value?.completedAt,
  );
  const onboardingCompletedAt = computed(
    () => onboardingData.value?.completedAt,
  );
  const userGoals = computed(() => profileData.value?.goals || []);

  function getFormattedAnswers(
    profileQuestions: ProfileQuestionDto[],
  ): FormattedAnswer[] {
    const survey = onboardingData.value?.survey || [];
    return survey
      .map((item) => {
        const question = profileQuestions.find((q) => q.id === item.questionId);
        return {
          questionId: item.questionId,
          question:
            question?.question ||
            item.questionId
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase()),
          selectedLabels: item.selectedValues || [],
        };
      })
      .filter((item) => item.selectedLabels.length > 0);
  }

  const onboardingAffinities = computed<OnboardingAffinity[]>(() => {
    const result: OnboardingAffinity[] = [];
    for (const [dimension, tags] of Object.entries(affinities.value || {})) {
      for (const [tag, score] of Object.entries(tags as Record<string, any>)) {
        if (score?.sources?.onboarding > 0) {
          result.push({ tag, dimension });
        }
      }
    }
    return result.slice(0, 10);
  });

  const courseProgress = computed<CourseProgressItem[]>(() => {
    const courseMap = new Map<string, CourseProgressItem>();
    for (const visit of visitHistory.value) {
      const repoId = visit.repositoryId;
      if (!repoId) continue;

      const visitDate = new Date(visit.timestamp);
      const existing = courseMap.get(repoId);

      if (existing) {
        existing.totalTimeSpent += visit.duration || 0;
        existing.visitCount += 1;
        if (visit.action === 'complete') {
          existing.completed = true;
          existing.completedAt = visitDate;
          existing.progress = 100;
        } else if (!existing.completed) {
          existing.progress = Math.max(
            existing.progress,
            visit.engagement?.scrollDepth || 0,
          );
        }
        if (visitDate > existing.lastVisitedAt) {
          existing.lastVisitedAt = visitDate;
        }
      } else {
        const isCompleted = visit.action === 'complete';
        courseMap.set(repoId, {
          repositoryId: repoId,
          title: visit.content?.title || 'Untitled Course',
          tags: visit.content?.tags || [],
          completed: isCompleted,
          completedAt: isCompleted ? visitDate : undefined,
          totalTimeSpent: visit.duration || 0,
          visitCount: 1,
          progress: isCompleted ? 100 : visit.engagement?.scrollDepth || 0,
          lastVisitedAt: visitDate,
        });
      }
    }

    return Array.from(courseMap.values()).sort(
      (a, b) => b.lastVisitedAt.getTime() - a.lastVisitedAt.getTime(),
    );
  });

  const courseStats = computed(() => ({
    total: courseProgress.value.length,
    completed: courseProgress.value.filter((c) => c.completed).length,
  }));

  const activeDimensionsCount = computed(
    () => DIMENSIONS.filter((dim) => getDimensionCount(dim.key) > 0).length,
  );

  function getDimensionCount(dimKey: string): number {
    const dim = affinities.value[dimKey];
    return dim ? Object.keys(dim).length : 0;
  }

  function getDimensionStrength(dimKey: string): number {
    const dim = affinities.value[dimKey];
    if (!dim || Object.keys(dim).length === 0) return 0;
    const values = Object.values(dim).map((s: any) => s?.value || 0);
    return Math.round(Math.max(...values) * 100);
  }

  function getTopTagsForDimension(dimKey: string): DimensionTag[] {
    const dim = affinities.value[dimKey];
    if (!dim) return [];
    return Object.entries(dim)
      .map(([name, score]: [string, any]) => ({
        name,
        value: score?.value || 0,
        confidence: score?.confidence || 0,
        source: getPrimarySource(score?.sources),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  const topAffinitiesWithDetails = computed<TopAffinity[]>(() => {
    const result: TopAffinity[] = [];
    for (const [dimension, tags] of Object.entries(affinities.value || {})) {
      for (const [tag, score] of Object.entries(tags as Record<string, any>)) {
        result.push({
          tag,
          value: score?.value || 0,
          confidence: score?.confidence || 0,
          dimension,
          source: getPrimarySource(score?.sources),
        });
      }
    }
    return result.sort((a, b) => b.value - a.value).slice(0, 8);
  });

  const trendingInterests = computed<TrendingInterest[]>(() => {
    const recentChanges: TrendingInterest[] = [];
    for (const visit of visitHistory.value.slice(0, 20)) {
      for (const change of visit.affinityChanges || []) {
        if (change.delta <= 0) continue;
        const existing = recentChanges.find((c) => c.tag === change.tag);
        if (existing) {
          existing.recentDelta += change.delta;
        } else {
          recentChanges.push({
            tag: change.tag,
            dimension: change.dimension,
            recentDelta: change.delta,
          });
        }
      }
    }

    return recentChanges
      .sort((a, b) => b.recentDelta - a.recentDelta)
      .slice(0, 5);
  });

  function getGroupedTimeline(showAll: boolean): TimelineGroup[] {
    const limit = showAll ? visitHistory.value.length : MAX_TIMELINE_ITEMS;
    const visits = visitHistory.value.slice(0, limit);
    const groups = new Map<string, TimelineGroup>();

    for (const visit of visits) {
      const date = new Date(visit.timestamp);
      const dayKey = startOfDay(date).toISOString();

      let label: string;
      if (isToday(date)) label = 'Today';
      else if (isYesterday(date)) label = 'Yesterday';
      else label = format(date, 'EEEE, MMM d');

      const group = groups.get(dayKey);
      if (group) {
        group.items.push(visit);
      } else {
        groups.set(dayKey, { date: dayKey, label, items: [visit] });
      }
    }

    return Array.from(groups.values());
  }

  const entryPointStats = computed<EntryPointStat[]>(() => {
    // Initialize all known entry points with 0
    const counts: Record<string, number> = Object.keys(ENTRY_POINT_LABELS).reduce(
      (acc, key) => ({ ...acc, [key]: 0 }),
      {},
    );

    for (const v of visitHistory.value) {
      const entry = v.context?.entryPoint || 'direct';
      counts[entry] = (counts[entry] || 0) + 1;
    }

    const total = visitHistory.value.length || 1;
    return Object.entries(counts)
      .map(([type, count]) => ({
        type,
        count,
        percent: Math.round((count / total) * 100),
        color: ENTRY_POINT_COLORS[type] || '#94A3B8',
        label: ENTRY_POINT_LABELS[type] || type,
      }))
      .sort((a, b) => b.count - a.count);
  });

  const deviceStats = computed<DeviceStat[]>(() => {
    const counts = { desktop: 0, mobile: 0, tablet: 0 };
    for (const v of visitHistory.value) {
      const device = v.device?.type || 'desktop';
      if (device in counts) counts[device as keyof typeof counts] += 1;
    }

    const total = visitHistory.value.length || 1;
    return [
      {
        type: 'desktop',
        icon: '💻',
        label: 'Desktop',
        percent: Math.round((counts.desktop / total) * 100),
      },
      {
        type: 'mobile',
        icon: '📱',
        label: 'Mobile',
        percent: Math.round((counts.mobile / total) * 100),
      },
      {
        type: 'tablet',
        icon: '📲',
        label: 'Tablet',
        percent: Math.round((counts.tablet / total) * 100),
      },
    ];
  });

  return {
    profileData,
    engagement,
    affinities,
    visitHistory,
    userInitials,
    experienceInfo,
    journeyInfo,
    lastActiveText,
    velocity,
    velocityDescription,
    streakDays,
    streakDescription,
    totalTimeSpent,
    formattedLearningTime,
    sessionsCount,
    totalInteractions,
    completionsCount,
    onboardingData,
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
    entryPointStats,
    deviceStats,
  };
}

export function formatTagName(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return 'Unknown';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return 'Unknown';
  }
}

export function formatTime(timestamp: string | Date): string {
  try {
    return format(new Date(timestamp), 'h:mm a');
  } catch {
    return '';
  }
}

export function formatDurationMs(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return '<1m';
  return `${minutes}m`;
}

export function formatMs(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return '<1m';
}

export function formatRelativeDate(date: Date | string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function getDimensionIcon(dimKey: string): string {
  const dim = DIMENSIONS.find((d) => d.key === dimKey);
  return dim?.icon || '•';
}
