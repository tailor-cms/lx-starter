/**
 * Learner Profiler
 * Orchestrates profiling questions generation and learner-content matching
 */
import type {
  AffinityDimension,
  AIProvider,
  AggregatedContentAnalysis,
  ContentMeta,
  ContinueLearningOptions,
  ContinueLearningResult,
  DimensionalAffinities,
  InterestUpdate,
  LearnerProfile,
  NavigationEvent,
  ProfileMatchOptions,
  ProfileUpdateOptions,
  RelatedContent,
  SerializedLearnerProfile,
  Tag,
  VisitContext,
  VisitEngagement,
  VisitEntry,
} from '../types';
import { defaultLogger, type GarmentLogger } from '../../garment/logger';
import {
  ProfileBuilder,
  type ProfileBuildResult,
} from './survey-profiling/ProfileBuilder';
import {
  SurveyGenerator,
  type SurveyGeneratorOptions,
  type ProfileQuestion,
  type SurveyQuestionResponse,
} from './survey-profiling/survey';
import { AFFINITY_DIMENSIONS } from '../types/activity-tracking';
import type { ContentAnalyzer } from '../content-analysis';
import { ProfileMatcher } from './ProfileMatcher';
import { ProfileUpdater } from './ProfileUpdater';
import { getContinueLearning } from './continue-learning';

// Configuration options for LearnerProfiler
// Combines settings for question generation and profile updates,
// with optional logging for debugging and monitoring.
export interface LearnerProfilerOptions
  extends SurveyGeneratorOptions, ProfileUpdateOptions {
  logger?: GarmentLogger;
}

export class LearnerProfiler {
  private logger: GarmentLogger;

  // Content
  private analyzer: ContentAnalyzer;
  private generator: SurveyGenerator;

  // Profile management
  private builder: ProfileBuilder;
  private updater: ProfileUpdater;
  private matcher: ProfileMatcher;

  /**
   * Create a LearnerProfiler
   *
   * Main functionality includes:
   * - Generating profiling questions based on content analysis
   * - Building learner profiles from question answers
   * - Matching learner profiles to content metadata
   * - Updating profiles based on content interactions
   * - suggestContent and getMoreLikeThis recommendations
   * - Decay and trending interest tracking
   *
   * aiProvider is optional - only needed for generateQuestions()
   *
   * @example Basic usage (without AI question generation)
   * const analyzer = new ContentAnalyzer(contentMeta);
   * const profiler = new LearnerProfiler(analyzer);
   *
   * @example With AI provider for question generation
   * const profiler = new LearnerProfiler(analyzer, anthropicProvider);
   *
   * @example With granular tracking via nodeResolver
   * const profiler = new LearnerProfiler(analyzer, aiProvider, {
   *   nodeResolver: (nodeId) => {
   *     const node = content.findById(nodeId);
   *     if (!node) return undefined;
   *     return { repositoryId: node.repositoryId, nodeType: node.type };
   *   },
   *   trackDifficulty: true,
   * });
   */
  constructor(
    analyzer: ContentAnalyzer,
    aiProvider?: AIProvider,
    options?: LearnerProfilerOptions,
  ) {
    this.analyzer = analyzer;
    this.generator = new SurveyGenerator(aiProvider!, options, options?.logger);
    this.builder = new ProfileBuilder();
    this.matcher = new ProfileMatcher();
    this.updater = new ProfileUpdater(
      analyzer.getContentMeta(),
      options,
      options?.logger,
    );
    this.logger = options?.logger || defaultLogger;
    this.logger.debugOperation(
      'LearnerProfiler',
      `${analyzer.size} repositories, nodeResolver=${!!options?.nodeResolver}`,
    );
  }

  /**
   * Get the ContentAnalyzer instance
   */
  getAnalyzer(): ContentAnalyzer {
    return this.analyzer;
  }

  /**
   * Get the content metadata map
   */
  getContentMeta(): Map<string, ContentMeta> {
    return this.analyzer.getContentMeta();
  }

  /**
   * Generate profiling questions based on content metadata
   * Uses the ContentAnalyzer's cached analysis to generate questions.
   */
  async generateQuestions(): Promise<ProfileQuestion[]> {
    const analysis = this.analyzer.analyze();
    this.logger.debugOperation(
      'LearnerProfiler',
      `generateQuestions(): analyzing ${this.analyzer.size} repositories`,
    );
    const questions = await this.generator.generate(analysis);
    this.logger.debugOperation(
      'LearnerProfiler',
      `generateQuestions(): generated ${questions.length} from ` +
      `${Object.keys(analysis.tagDistribution).length} tags`,
    );
    return questions;
  }

  /**
   * Analyze content to understand tag and category distribution
   * Returns cached analysis from ContentAnalyzer.
   */
  analyzeContent(): AggregatedContentAnalysis {
    return this.analyzer.analyze();
  }

  /**
   * Build learner profile from question answers.
   * Returns both the profile and resolved survey data for auditing.
   *
   * @param answers - Map of questionId to selected answer indexes
   * @param questions - Survey questions in API format
   * @param options.trackDifficulty - Whether to track experience level
   * @param options.tagDimensionResolver - Map tag names to dimensions (default: 'topic')
   * @returns Profile and onboarding data
   */
  buildProfile(
    answers: Record<string, number[]>,
    questions: SurveyQuestionResponse[],
    options?: {
      trackDifficulty?: boolean;
      tagDimensionResolver?: (tagName: string) => AffinityDimension;
    },
  ): ProfileBuildResult {
    const result = this.builder.build(answers, questions, options);
    const affinityCount = this.countAffinities(result.profile.affinities);
    this.logger.debugOperation(
      'LearnerProfiler',
      `buildProfile(): ${Object.keys(answers).length} answers → ` +
        `${affinityCount} affinities, ` +
        `trackDifficulty=${options?.trackDifficulty ?? false}`,
    );
    return result;
  }

  /**
   * Create an empty learner profile for a new user
   * @param userId - User identifier to use as profile ID
   * @returns Empty profile with default values
   */
  createEmptyProfile(userId: string): LearnerProfile {
    return this.builder.createEmptyProfile(userId);
  }

  /**
   * Count total affinities across all dimensions
   */
  private countAffinities(affinities: DimensionalAffinities): number {
    let count = 0;
    for (const dim of AFFINITY_DIMENSIONS) {
      count += Object.keys(affinities[dim] || {}).length;
    }
    return count;
  }

  /**
   * Calculate match score between profile and repository metadata
   */
  calculateMatchScore(profile: LearnerProfile, metadata: ContentMeta): number {
    return this.matcher.calculateScore(profile, metadata);
  }

  /**
   * Get matched tags between profile and metadata
   */
  getMatchedTags(profile: LearnerProfile, metadata: ContentMeta): Tag[] {
    return this.matcher.getMatchedTags(profile, metadata);
  }

  /**
   * Generate reasons for recommendation
   */
  generateReasons(profile: LearnerProfile, metadata: ContentMeta): string[] {
    return this.matcher.generateReasons(profile, metadata);
  }

  /**
   * Update profile based on content interaction (lightweight - affinities only)
   * For full tracking with visit history, use trackActivity() instead.
   *
   * @example
   * profiler.updateFromInteraction(profile, 'element-uid-123', 'view', 5000);
   * profiler.updateFromInteraction(profile, 'activity-uid-456', 'complete');
   * profiler.updateFromInteraction(profile, 'repo-uid-789', 'bookmark');
   */
  updateFromInteraction(
    profile: LearnerProfile,
    nodeId: string,
    action: NavigationEvent['action'],
    duration?: number,
  ): { profile: LearnerProfile; updates: InterestUpdate[] } {
    return this.updater.update(profile, nodeId, action, duration);
  }

  /**
   * Full activity tracking with visit history and engagement metrics
   *
   * Use this for comprehensive tracking that records visits, updates engagement
   * metrics (velocity, streak, journey stage), and maintains visit history.
   *
   * For lightweight tracking (affinities only), use `updateFromInteraction()`.
   *
   * @param profile - Current learner profile
   * @param nodeId - Content node UID (repo, activity, container, or element)
   * @param action - Type of interaction (view, complete, bookmark, skip)
   * @param duration - Optional time spent in ms
   * @param context - Session context (entryPoint, referrer, sessionId, etc.)
   * @param engagement - Engagement data (scrollDepth, contentProgress, etc.)
   * @returns Updated profile, affinity changes, and the created visit entry
   *
   * @example
   * const { profile, updates, visit } = profiler.trackActivity(
   *   profile,
   *   'lesson-123',
   *   'complete',
   *   120000,
   *   { sessionId: 'abc', entryPoint: 'recommendation' },
   *   { scrollDepth: 95, interactionCount: 8 }
   * );
   */
  trackActivity(
    profile: LearnerProfile,
    nodeId: string,
    action: NavigationEvent['action'],
    duration?: number,
    context?: Partial<VisitContext>,
    engagement?: Partial<VisitEngagement>,
  ): { profile: LearnerProfile; updates: InterestUpdate[]; visit?: VisitEntry } {
    return this.updater.track(profile, nodeId, action, duration, context, engagement);
  }

  /**
   * Decay old interests over time
   */
  decayInterests(profile: LearnerProfile, decayRate = 0.95): LearnerProfile {
    return this.updater.decay(profile, decayRate);
  }

  /**
   * Get trending interests based on recent positive affinity changes.
   *
   * Analyzes visit history to find tags with the highest cumulative positive
   * deltas in recent visits. This captures actual engagement trends rather than
   * just high-value tags.
   *
   * @param profile - Learner profile with visit history
   * @param limit - Maximum number of trending tags to return (default: 5)
   * @param recentVisits - Number of recent visits to analyze (default: 20)
   * @returns Tag names sorted by cumulative positive delta
   */
  getTrendingInterests(
    profile: LearnerProfile,
    limit = 5,
    recentVisits = 20,
  ): string[] {
    // If no visit history, fall back to recentTags with highest affinity values
    if (!profile.visitHistory || profile.visitHistory.length === 0) {
      return this.getFallbackTrendingTags(profile, limit);
    }

    // Aggregate positive deltas per tag from recent visits
    const tagDeltas = new Map<string, number>();
    const visits = profile.visitHistory.slice(0, recentVisits);

    for (const visit of visits) {
      for (const change of visit.affinityChanges) {
        if (change.delta > 0) {
          const current = tagDeltas.get(change.tag) || 0;
          tagDeltas.set(change.tag, current + change.delta);
        }
      }
    }

    // Sort by cumulative delta and return top tags
    const sorted = Array.from(tagDeltas.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);

    // If not enough trending tags, supplement with fallback
    if (sorted.length < limit) {
      const fallback = this.getFallbackTrendingTags(profile, limit - sorted.length);
      const existing = new Set(sorted);
      for (const tag of fallback) {
        if (!existing.has(tag)) {
          sorted.push(tag);
          if (sorted.length >= limit) break;
        }
      }
    }

    return sorted;
  }

  /**
   * Fallback: get high-affinity tags from recentTags when no visit history
   */
  private getFallbackTrendingTags(profile: LearnerProfile, limit: number): string[] {
    const recentSet = new Set(profile.recentTags);
    const allAffinities: Array<{ tag: string; value: number }> = [];

    for (const dim of AFFINITY_DIMENSIONS) {
      for (const [tag, score] of Object.entries(profile.affinities[dim] || {})) {
        if (recentSet.has(tag)) {
          allAffinities.push({ tag, value: score.value });
        }
      }
    }

    return allAffinities
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((a) => a.tag);
  }

  /**
   * Get content to continue learning
   * Returns recently visited content that hasn't been completed, sorted by recency.
   *
   * @param profile - Learner profile with visit history
   * @param options - Query options
   * @returns List of content to continue, sorted by most recently visited
   *
   * @example
   * const result = profiler.getContinueLearning(profile, { limit: 5 });
   */
  getContinueLearning(
    profile: LearnerProfile,
    options?: ContinueLearningOptions,
  ): ContinueLearningResult {
    return getContinueLearning(profile, options);
  }

  /**
   * Suggest content based on learner profile
   * By default, excludes completed repositories (those with 'complete' action)
   * at repository level). Use `includeCompleted: true` to override.
   *
   * @param options.includeCompleted - Include completed repositories
   * @param options.onlyInProgress - Only show repositories learner has started
   * @param options.boostRecent - Boost recently updated content
   * @param options.recentBoostWeight - How much to boost recent (0-1, default 0.2)
   * @param options.recentDays - Content updated within this is recent (default 30)
   */
  suggestContent(
    profile: LearnerProfile,
    options?: {
      limit?: number;
      includeCompleted?: boolean;
      onlyInProgress?: boolean;
    } & ProfileMatchOptions,
  ): RelatedContent[] {
    // Build exclusion list
    let excludeCompleted: string[] = [];
    if (!options?.includeCompleted) {
      excludeCompleted = this.getCompletedRepositories(profile);
    }
    this.logger.debugOperation(
      'LearnerProfiler',
      `suggestContent(): contentMeta=${this.analyzer.getContentMeta().size} ` +
      `repos, excluding=${excludeCompleted.length} completed, ` +
      `options=${JSON.stringify(options)}`,
    );
    // Get suggestions
    let suggestions = this.matcher.suggestContent(
      profile,
      this.analyzer.getContentMeta(),
      { ...options, excludeCompleted },
    );
    // Filter to in-progress only if requested
    if (options?.onlyInProgress) {
      const inProgress = new Set(this.getInProgressRepositories(profile));
      const beforeCount = suggestions.length;
      suggestions = suggestions.filter((s) => inProgress.has(s.id));
      this.logger.debugOperation(
        'LearnerProfiler',
        `suggestContent(): filtered to ${suggestions.length}/${beforeCount} ` +
        `in-progress`,
      );
    }
    this.logger.debugOperation(
      'LearnerProfiler',
      `suggestContent(): returning ${suggestions.length} suggestions`,
    );
    return suggestions;
  }

  /**
   * Get "more like this" suggestions based on current content
   * @param repositoryId - Repository to find similar content for
   * @param profile - Learner profile for interest-based boosting
   * @param options - Options for matching
   * @param options.sectionId - node uid for section-level matching
   * @param options.limit - Maximum suggestions to return (default 5)
   *
   * @example
   * Repository-level matching
   * const similar = profiler.getMoreLikeThis('repo-123', profile);
   *
   * @example
   * Section-level matching (find content like this activity)
   * const similar = profiler.getMoreLikeThis('repo-123', profile, {
   *   sectionId: 'activity-456',
   *   limit: 10,
   * });
   */
  getMoreLikeThis(
    repositoryId: string,
    profile: LearnerProfile,
    options?: { sectionId?: string; limit?: number } | number,
  ): RelatedContent[] {
    const opts =
      typeof options === 'number' ? { limit: options } : options || {};
    const suggestions = this.matcher.getMoreLikeThis(
      repositoryId,
      profile,
      this.analyzer.getContentMeta(),
      opts,
    );
    this.logger.debugOperation(
      'LearnerProfiler',
      `getMoreLikeThis(): repo=${repositoryId}, ` +
      `sectionId=${opts.sectionId || 'none'}, ` +
      `found ${suggestions.length} similar`,
    );
    return suggestions;
  }

  /**
   * Get list of completed repository ids
   * A repository is considered completed when it has a 'complete' action
   * at the repository level in visitHistory.
   */
  getCompletedRepositories(profile: LearnerProfile): string[] {
    if (!profile.visitHistory) return [];
    // Get all unique repository IDs from visit history
    const repositoryIds = new Set<string>();
    for (const visit of profile.visitHistory) {
      repositoryIds.add(visit.repositoryId);
    }
    // Filter to only completed repositories
    return Array.from(repositoryIds).filter((id) =>
      this.isRepositoryCompleted(profile, id),
    );
  }

  /**
   * Get list of in-progress repository ids
   * A repository is in-progress if it has any interactions but no
   * repository-level 'complete' action.
   */
  getInProgressRepositories(profile: LearnerProfile): string[] {
    if (!profile.visitHistory) return [];
    // Get all unique repository IDs that have been interacted with
    const interactedRepositories = new Set<string>();
    for (const visit of profile.visitHistory) {
      interactedRepositories.add(visit.repositoryId);
    }
    // Filter out completed repositories
    return Array.from(interactedRepositories).filter((id) =>
      !this.isRepositoryCompleted(profile, id),
    );
  }

  /**
   * Check if a repository is completed
   */
  isRepositoryCompleted(
    profile: LearnerProfile,
    repositoryId: string,
  ): boolean {
    if (!profile.visitHistory) return false;
    return profile.visitHistory.some(
      (visit) =>
        visit.repositoryId === repositoryId &&
        visit.nodeType === 'repository' &&
        visit.action === 'complete',
    );
  }

  /**
   * Get last interaction time for a repository
   */
  getLastInteraction(
    profile: LearnerProfile,
    repositoryId: string,
  ): Date | undefined {
    if (!profile.visitHistory) return undefined;
    // visitHistory is sorted newest first, so find the first match
    const visit = profile.visitHistory.find(
      (v) => v.repositoryId === repositoryId,
    );
    return visit?.timestamp;
  }

  /**
   * Serialize profile for persistence (e.g., localStorage, database)
   */
  serializeProfile(profile: LearnerProfile): SerializedLearnerProfile {
    const serialized = this.builder.serialize(profile);
    this.logger.debugOperation(
      'LearnerProfiler',
      `serializeProfile(): id=${profile.id}, ` +
      `${this.countAffinities(profile.affinities)} affinities, ` +
      `${profile.visitHistory?.length || 0} visits`,
    );
    return serialized;
  }

  /**
   * Deserialize profile from storage
   */
  deserializeProfile(data: SerializedLearnerProfile): LearnerProfile {
    const profile = this.builder.deserialize(data);
    this.logger.debugOperation(
      'LearnerProfiler',
      `deserializeProfile(): id=${profile.id}, ` +
      `${this.countAffinities(profile.affinities)} affinities, ` +
      `${profile.visitHistory?.length || 0} visits`,
    );
    return profile;
  }
}
