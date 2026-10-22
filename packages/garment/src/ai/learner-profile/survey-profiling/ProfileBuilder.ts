import { randomUUID } from 'node:crypto';

import type {
  AffinityDimension,
  DifficultyLevel,
  DimensionalAffinities,
  EngagementMetrics,
  LearnerProfile,
  SerializedDimensionalAffinities,
  SerializedEngagementMetrics,
  SerializedLearnerProfile,
  SerializedVisitEntry,
  VisitEntry,
} from '../../types';
import { AFFINITY_DIMENSIONS, JOURNEY_STAGES } from '../../types';
import { DIFFICULTY_LEVELS } from '../../core-settings';
import type { ResolvedSurveyAnswer, SurveyQuestionResponse } from './survey';

/**
 * Result of building a profile from onboarding survey.
 * Contains both the computed profile and audit data for what was selected.
 */
export interface ProfileBuildResult {
  profile: LearnerProfile;
  onboarding: {
    survey: ResolvedSurveyAnswer[];
    completedAt: Date;
  };
}

// Initial confidence for onboarding affinities
// (explicit but unverified by behavior)
const ONBOARDING_CONFIDENCE = 0.5;

export class ProfileBuilder {
  /**
   * Create an empty learner profile with default values
   * Use this for new users without survey data
   */
  createEmptyProfile(id?: string): LearnerProfile {
    const now = new Date();
    return {
      id: id ?? this.generateId(),
      answers: {},
      affinities: this.createEmptyAffinities(),
      experienceLevel: undefined,
      goals: [],
      recentTags: [],
      visitHistory: [],
      engagement: {
        velocity: 0,
        journeyStage: JOURNEY_STAGES[0],
        totalInteractions: 0,
        totalTimeSpent: 0,
        streakDays: 0,
        lastActiveAt: now,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Build learner profile from survey question answers
   * Creates empty profile, then populates with survey-derived data
   *
   * @param answers - Map of questionId to selected answer indexes
   * @param questions - Survey questions (SurveyQuestionResponse[])
   * @param options - Build options
   *
   * @example
   * Input questions
   * tagAffinities: per-option tag strengths (0-1)
   * weight: question importance multiplier (0-1)
   * Final affinity = tagAffinity * weight (then normalized)
   * Use weight=1.0 for core questions, lower for secondary
   * const questions = [
   *   {
   *     id: 'interests',
   *     category: 'interest',
   *     options: [
   *       { label: 'Data Science', tagAffinities: { 'data-science': 1, 'python': 0.8 } },
   *       { label: 'Web Dev', tagAffinities: { 'web-dev': 1, 'javascript': 0.8 } },
   *       { label: 'DevOps', tagAffinities: { 'devops': 1, 'docker': 0.7 } },
   *     ],
   *     weight: 1,  // Full weight - core interest question
   *   },
   *   {
   *     id: 'goals',
   *     category: 'goal',
   *     options: [
   *       { label: 'Get certified', tagAffinities: {} },
   *       { label: 'Build projects', tagAffinities: {} },
   *       { label: 'Career change', tagAffinities: {} },
   *     ],
   *     weight: 0.8,  // Slightly lower - secondary question
   *   },
   * ];
   *
   * Build profile with user's answers
   * answers param: questionId -> selected answer indexes
   *   - { interests: [0] } = index 0 selected for 'interests' question
   *     -> 'Data Science' -> applies tags { 'data-science': 1, 'python': 0.8 }
   *   - { goals: [1] } = index 1 selected for 'goals' question
   *     -> 'Build projects' (added to goals array)
   * const { profile, onboarding } = builder.build(
   *   { interests: [0], goals: [1] },
   *   questions,
   *   { trackDifficulty: true }
   * );
   *
   * Result profile:
   * {
   *   id: 'profile_abc123...',
   *   answers: { interests: [0], goals: [1] },
   *   affinities: {
   *     topic: {
   *       'data-science': {
   *         value: 1.0,
   *         confidence: 0.5,
   *         sources: { onboarding: 1.0, behavioral: 0, explicit: 0 },
   *         lastUpdated: Date,
   *         interactionCount: 1
   *       },
   *       'python': {
   *         value: 0.8,
   *         confidence: 0.5,
   *         sources: { onboarding: 0.8, behavioral: 0, explicit: 0 },
   *         lastUpdated: Date,
   *         interactionCount: 1
   *       }
   *     },
   *     skill: {},
   *     concept: {},
   *     industry: {},
   *     tool: {},
   *     goal: {}
   *   },
   *   experienceLevel: 'beginner',
   *   goals: ['Build projects'],
   *   recentTags: ['data-science', 'python'],
   *   visitHistory: [],
   *   engagement: {
   *     velocity: 0,
   *     journeyStage: 'browse',
   *     totalInteractions: 0,
   *     totalTimeSpent: 0,
   *     streakDays: 0,
   *     lastActiveAt: Date
   *   },
   *   createdAt: Date,
   *   updatedAt: Date
   * }
   *
   * Result onboarding (audit data):
   * {
   *   survey: [
   *     { questionId: 'interests', selectedValues: ['Data Science'],
   *       tagAffinities: { 'data-science': 1, 'python': 0.8 } },
   *     { questionId: 'goals', selectedValues: ['Build projects'],
   *       tagAffinities: {} }
   *   ],
   *   completedAt: Date
   * }
   */
  build(
    answers: Record<string, number[]>,
    questions: SurveyQuestionResponse[],
    options?: {
      id?: string;
      trackDifficulty?: boolean;
      tagDimensionResolver?: (tagName: string) => AffinityDimension;
    },
  ): ProfileBuildResult {
    const profile = this.createEmptyProfile(options?.id);
    const trackDifficulty = options?.trackDifficulty ?? false;
    const resolveDimension =
      options?.tagDimensionResolver ?? (() => 'topic' as AffinityDimension);
    const recentTags: string[] = [];
    const rawAffinities: Record<string, number> = {};
    const goals: string[] = [];
    const surveyAnswers: ResolvedSurveyAnswer[] = [];
    let experienceLevel: DifficultyLevel | undefined;

    // Aggregate tag affinities from selected answers
    for (const [questionId, answerIndexes] of Object.entries(answers)) {
      const question = questions.find((q) => q.id === questionId);
      if (!question) continue;

      // Build resolved answer for this question
      const selectedValues: string[] = [];
      const questionAffinities: Record<string, number> = {};

      for (const answerIndex of answerIndexes) {
        const option = question.options[answerIndex];
        if (!option) continue;

        // Collect label for audit
        selectedValues.push(option.label);

        // Accumulate weighted tag affinities
        for (const [tag, affinity] of Object.entries(option.tagAffinities)) {
          rawAffinities[tag] =
            (rawAffinities[tag] || 0) + affinity * question.weight;
          questionAffinities[tag] = (questionAffinities[tag] || 0) + affinity;
          if (!recentTags.includes(tag)) recentTags.push(tag);
        }

        // Track experience level from experience questions
        if (trackDifficulty && question.category === 'experience') {
          experienceLevel = DIFFICULTY_LEVELS[answerIndex] || 'intermediate';
        }

        // Collect goals from goal questions
        if (question.category === 'goal' && option.label) {
          goals.push(option.label);
        }
      }

      // Store resolved answer
      surveyAnswers.push({
        questionId,
        selectedValues,
        tagAffinities: questionAffinities,
      });
    }

    // Normalize raw affinities to [0, 1] range using max-normalization.
    // This ensures all affinity values are comparable regardless of how many
    // questions contributed to each tag. The highest accumulated affinity
    // becomes 1.0, and all others are scaled proportionally.
    //
    // Example:
    //   Raw affinities: { javascript: 15, python: 10, rust: 5 }
    //   maxAffinity = 15
    //   Normalized:    { javascript: 1.0, python: 0.67, rust: 0.33 }
    //
    // The minimum divisor of 1 prevents division by zero when no affinities
    // exist.
    const maxAffinity = Math.max(...Object.values(rawAffinities), 1);
    const now = profile.createdAt;
    for (const [tag, rawValue] of Object.entries(rawAffinities)) {
      const value = rawValue / maxAffinity;
      const dimension = resolveDimension(tag);
      profile.affinities[dimension][tag] = {
        value,
        confidence: ONBOARDING_CONFIDENCE,
        sources: { onboarding: value, behavioral: 0, explicit: 0 },
        lastUpdated: now,
        interactionCount: 1,
      };
    }
    // Override with survey-derived data
    profile.answers = answers;
    profile.experienceLevel = experienceLevel;
    profile.goals = goals;
    profile.recentTags = recentTags.slice(0, 10);

    return {
      profile,
      onboarding: {
        survey: surveyAnswers,
        completedAt: now,
      },
    };
  }

  /**
   * Create empty 6D affinities structure
   */
  private createEmptyAffinities(): DimensionalAffinities {
    const affinities = {} as DimensionalAffinities;
    for (const dim of AFFINITY_DIMENSIONS) {
      affinities[dim] = {};
    }
    return affinities;
  }

  /**
   * Generate unique profile ID
   */
  private generateId(): string {
    return `profile_${randomUUID()}`;
  }

  /**
   * Serialize profile for persistence (e.g., localStorage, database)
   */
  serialize(profile: LearnerProfile): SerializedLearnerProfile {
    const affinities = {} as SerializedDimensionalAffinities;
    for (const dim of AFFINITY_DIMENSIONS) {
      affinities[dim] = {};
      const dimAffinities = profile.affinities[dim];
      if (dimAffinities) {
        for (const [tag, score] of Object.entries(dimAffinities)) {
          affinities[dim][tag] = {
            ...score,
            lastUpdated: score.lastUpdated.toISOString(),
          };
        }
      }
    }

    const visitHistory: SerializedVisitEntry[] | undefined =
      profile.visitHistory?.map((v) => ({
        ...v,
        timestamp: v.timestamp.toISOString(),
      }));

    const engagement: SerializedEngagementMetrics | undefined =
      profile.engagement
        ? {
            ...profile.engagement,
            lastActiveAt: profile.engagement.lastActiveAt.toISOString(),
          }
        : undefined;

    return {
      ...profile,
      affinities,
      visitHistory,
      engagement,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  /**
   * Deserialize profile from storage
   */
  deserialize(data: SerializedLearnerProfile): LearnerProfile {
    const affinities = this.createEmptyAffinities();
    if (data.affinities) {
      for (const dim of AFFINITY_DIMENSIONS) {
        const dimAffinities = data.affinities[dim];
        if (dimAffinities) {
          for (const [tag, score] of Object.entries(dimAffinities)) {
            affinities[dim][tag] = {
              ...score,
              lastUpdated: new Date(score.lastUpdated),
            };
          }
        }
      }
    }

    const visitHistory: VisitEntry[] | undefined = data.visitHistory?.map(
      (v) => ({
        ...v,
        timestamp: new Date(v.timestamp),
      }),
    );

    const engagement: EngagementMetrics | undefined = data.engagement
      ? {
          ...data.engagement,
          lastActiveAt: new Date(data.engagement.lastActiveAt),
        }
      : undefined;

    return {
      ...data,
      affinities,
      visitHistory,
      engagement,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }
}
