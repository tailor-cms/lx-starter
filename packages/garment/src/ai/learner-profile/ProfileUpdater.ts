import { randomUUID } from 'node:crypto';

import type {
  AffinityChange,
  AffinityDimension,
  AffinityScore,
  AffinitySource,
  ContentMeta,
  ContentNodeInfo,
  ContentNodeType,
  DeviceInfo,
  DifficultyLevel,
  DimensionalAffinities,
  EngagementMetrics,
  InterestUpdate,
  JourneyStage,
  LearnerProfile,
  NavigationEvent,
  NodeResolver,
  ProfileUpdateOptions,
  VisitContentMeta,
  VisitContext,
  VisitEngagement,
  VisitEntry,
} from '../types';
import {
  AFFINITY_DIMENSIONS,
  AFFINITY_SOURCES,
  DIMENSION_WEIGHTS,
  JOURNEY_STAGES,
  JOURNEY_THRESHOLDS,
  MAX_VISIT_HISTORY,
} from '../types';

import { defaultLogger, type GarmentLogger } from '../../garment/logger';
import { DIFFICULTY_LEVELS } from '../core-settings';

const DEFAULT_OPTIONS = {
  trackDifficulty: false,
  maxRecentTags: 50,
};

// Destructured journey stages for readable code
const [STAGE_BROWSE, STAGE_EXPLORE, STAGE_TARGETED, STAGE_FLOW] =
  JOURNEY_STAGES;

/**
 * Learning rate for affinity updates.
 * Prevents large jumps from single interactions - without it, one completion
 * could max out an affinity immediately.
 */
const LEARNING_RATE = 0.1;

/**
 * Minimum delta threshold for affinity changes.
 * Changes smaller than this are ignored to reduce noise from
 * low-weight tags or brief interactions.
 */
const MIN_DELTA_THRESHOLD = 0.005;

/**
 * Weight multipliers for different content node types.
 * Seeing HTML section (element) has less influence than completing entire
 * repository.
 */
const NODE_WEIGHTS: Record<ContentNodeType, number> = {
  repository: 1.0,
  activity: 0.5,
  container: 0.3,
  element: 0.2,
};

/**
 * Profile Updater
 * Updates learner profiles based on content interactions (views, completions,
 * bookmarks, skips). Tracks tag affinities, category preferences, and consumed
 * content to enable personalized recommendations.
 *
 * @example
 * const contentMeta = new Map([
 *   ['repo-123', {
 *     name: 'Intro to Python',
 *     tags: [{ name: 'python', weight: 1 }, { name: 'basics', weight: 0.8 }],
 *     problems: [{ id: 'p1', title: 'Learn syntax', category: 'programming' }],
 *     difficulty: 'beginner',
 *   }],
 * ]);
 *
 * const updater = new ProfileUpdater(contentMeta, {
 *   nodeResolver: (nodeId) => ({
 *     repositoryId: 'repo-123',
 *     nodeType: 'activity',
 *   }),
 * });
 *
 * const { profile, updates } = updater.update(
 *   existingProfile,
 *   'activity-456',
 *   'complete',
 *   120000,
 * );
 *
 * Updates 6D affinities based on content tags and engagement.
 *
 * Delta formula:
 *   delta =
 *    tagWeight × actionWeight × nodeTypeWeight × dimensionWeight × LEARNING_RATE
 *   newValue = clamp(0, 1, oldValue + delta)
 *
 * The LEARNING_RATE (0.1) prevents large jumps from single interactions.
 * Without it, one completion could max out an affinity immediately.
 *
 * Example:
 *   Tag 'javascript' (weight: 1.0), action 'complete' (1.0), node 'activity' (0.5),
 *   dimension 'topic' (1.0):
 *   delta = 1.0 × 1.0 × 0.5 × 1.0 × 0.1 = 0.05
 *   If oldValue = 0.3, newValue = 0.35
 */
export class ProfileUpdater {
  private logger: GarmentLogger;
  private nodeResolver?: NodeResolver;

  private maxRecentEvents = 200;
  private recentEvents: NavigationEvent[] = [];

  constructor(
    private contentMeta: Map<string, ContentMeta>,
    private options: ProfileUpdateOptions = {},
    logger?: GarmentLogger,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.nodeResolver = options.nodeResolver;
    this.logger = logger || defaultLogger;
  }

  /**
   * Resolve a content node ID to its info
   * Falls back to treating the ID as a repository ID if no resolver
   */
  private resolveNode(nodeId: string): ContentNodeInfo | undefined {
    if (this.nodeResolver) return this.nodeResolver(nodeId);
    // if not treat as repository ID
    if (this.contentMeta.has(nodeId)) {
      return {
        repositoryId: nodeId,
        nodeType: 'repository',
      };
    }
    return undefined;
  }

  /**
   * Resolve node and get metadata in one call.
   * Returns undefined if node can't be resolved or metadata not found.
   */
  private resolveNodeWithMetadata(
    nodeId: string,
  ): { nodeInfo: ContentNodeInfo; metadata: ContentMeta } | undefined {
    const nodeInfo = this.resolveNode(nodeId);
    if (!nodeInfo) return undefined;

    const metadata = this.contentMeta.get(nodeInfo.repositoryId);
    if (!metadata) return undefined;

    return { nodeInfo, metadata };
  }

  /**
   * Lightweight profile update - updates affinities only.
   *
   * Use this for simple tracking where you don't need visit history or
   * engagement metrics. Updates 6D affinities, recentTags, and experienceLevel.
   *
   * For full tracking with visit history, use `track()` instead.
   *
   * @param profile - Current learner profile
   * @param nodeId - Content node UID (repo, activity, container, or element)
   * @param action - Type of interaction (view, complete, bookmark, skip)
   * @param duration - Optional time spent in ms
   * @returns Updated profile and list of affinity changes
   *
   * @example
   * Simple tracking without visit history
   * const { profile, updates } =
   *  updater.update(profile, 'lesson-123', 'view', 30000);
   */
  update(
    profile: LearnerProfile,
    nodeId: string,
    action: NavigationEvent['action'],
    duration?: number,
  ): { profile: LearnerProfile; updates: InterestUpdate[] } {
    this.logger.debugOperation(
      'ProfileUpdater',
      `update() called: nodeId=${nodeId}, action=${action}, duration=${duration}`,
    );

    const resolved = this.resolveNodeWithMetadata(nodeId);
    if (!resolved) {
      this.logger.debugOperation(
        'ProfileUpdater',
        `Node not resolved or no metadata: ${nodeId} - skipping update`,
      );
      return { profile, updates: [] };
    }

    const { nodeInfo, metadata } = resolved;
    this.logger.debugOperation(
      'ProfileUpdater',
      `Resolved node: type=${nodeInfo.nodeType}, repoId=${nodeInfo.repositoryId}`,
    );

    // Track event
    const event: NavigationEvent = {
      nodeId,
      repositoryId: nodeInfo.repositoryId,
      timestamp: new Date(),
      duration,
      action,
    };
    this.recentEvents.push(event);

    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents.shift();
    }
    const updates: InterestUpdate[] = [];

    const nodeTypeWeight = NODE_WEIGHTS[nodeInfo.nodeType];

    // Use node-specific tags if provided, otherwise use repository tags
    const tags = nodeInfo.nodeTags
      ? metadata.tags.filter((t) => nodeInfo.nodeTags!.includes(t.name))
      : metadata.tags;

    // Update 6D affinities
    const affinityChanges: AffinityChange[] = [];
    const affinities = this.updateDimensionalAffinities({
      current: profile.affinities,
      metadata,
      action,
      duration,
      nodeType: nodeInfo.nodeType,
      changes: affinityChanges,
    });

    // Convert AffinityChange (internal 6D format) to InterestUpdate (API format).
    // AffinityChange includes dimension info for internal tracking, while
    // InterestUpdate is a flattened structure returned to callers for logging,
    // debugging, and UI display of what changed during the update.
    //
    // Example transformation:
    //   AffinityChange: { dimension: 'topic', tag: 'python', delta: 0.05, ... }
    //   InterestUpdate: { tag: 'python', delta: 0.05, source: 'interaction', ... }
    for (const change of affinityChanges) {
      updates.push({
        tag: change.tag,
        oldValue: change.oldValue,
        newValue: change.newValue,
        delta: change.delta,
        source: 'interaction',
        reason: this.getUpdateReason(action, change.tag),
      });
    }

    // Update recent tags
    const viewedTags = tags.filter((t) => t.weight > 0.5).map((t) => t.name);
    const maxRecentTags =
      this.options.maxRecentTags ?? DEFAULT_OPTIONS.maxRecentTags;
    const newRecentTags = [...viewedTags, ...(profile.recentTags || [])]
      .filter((t, i, arr) => arr.indexOf(t) === i) // dedupe
      .slice(0, maxRecentTags);

    // Infer difficulty preference from engagement.
    // Only triggers on repository-level completions because:
    // 1. Repository = full course completion, a reliable signal of mastery
    // 2. Activities/elements are too granular - completing one lesson doesn't
    //    indicate readiness for harder content overall
    // 3. Prevents noisy level changes from brief interactions
    //
    // When a learner completes content at or above their current level,
    // their experienceLevel advances (e.g., intermediate → advanced).
    let newExperienceLevel = profile.experienceLevel;
    if (
      this.options.trackDifficulty &&
      profile.experienceLevel &&
      nodeInfo.nodeType === 'repository'
    ) {
      newExperienceLevel = this.inferDifficultyPreference(
        profile.experienceLevel,
        metadata.difficulty,
        event,
      );
    }

    this.logger.debugOperation(
      'ProfileUpdater',
      `Update complete: ${updates.length} affinity updates, ` +
        `action=${action}, nodeTypeWeight=${nodeTypeWeight}`,
    );

    if (updates.length > 0) {
      const topUpdates = updates
        .slice(0, 3)
        .map((u) => `${u.tag}:${u.delta > 0 ? '+' : ''}${u.delta.toFixed(3)}`)
        .join(', ');
      this.logger.debugOperation(
        'ProfileUpdater',
        `Top affinity changes: ` +
          `${topUpdates}${updates.length > 3 ? ` (+${updates.length - 3} more)` : ''}`,
      );
    }

    return {
      profile: {
        ...profile,
        affinities,
        recentTags: newRecentTags,
        experienceLevel: newExperienceLevel,
        updatedAt: new Date(),
      },
      updates,
    };
  }

  /**
   * Decay old interests over time
   * Call periodically (e.g., daily) to reduce stale affinities
   */
  decay(profile: LearnerProfile, decayRate = 0.95): LearnerProfile {
    const affinities = this.cloneDimensionalAffinities(profile.affinities);
    let originalCount = 0;
    let removed = 0;
    for (const dim of AFFINITY_DIMENSIONS) {
      for (const [tag, score] of Object.entries(affinities[dim])) {
        originalCount++;
        const decayed = score.value * decayRate;
        if (decayed > 0.05) {
          affinities[dim][tag] = { ...score, value: decayed };
        } else {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete affinities[dim][tag];
          removed++;
        }
      }
    }

    this.logger.debugOperation(
      'ProfileUpdater',
      `decay() rate=${decayRate}: ${originalCount} tags → ` +
        `${originalCount - removed} tags (${removed} removed below threshold)`,
    );
    return {
      ...profile,
      affinities,
      updatedAt: new Date(),
    };
  }

  private getUpdateReason(action: string, tag: string): string {
    switch (action) {
      case 'complete':
        return `Completed content about ${tag}`;
      case 'bookmark':
        return `Bookmarked content with ${tag}`;
      case 'view':
        return `Viewed content about ${tag}`;
      case 'skip':
        return `Skipped content about ${tag}`;
      default:
        return `Interacted with ${tag}`;
    }
  }

  private inferDifficultyPreference(
    currentLevel: DifficultyLevel,
    contentDifficulty: DifficultyLevel,
    event: NavigationEvent,
  ): DifficultyLevel {
    // If they completed advanced content, they might be ready for more
    if (event.action === 'complete') {
      const currentIdx = DIFFICULTY_LEVELS.indexOf(currentLevel);
      const contentIdx = DIFFICULTY_LEVELS.indexOf(contentDifficulty);
      // Move up if they completed something at their level or above
      if (
        contentIdx >= currentIdx &&
        currentIdx < DIFFICULTY_LEVELS.length - 1
      ) {
        return DIFFICULTY_LEVELS[currentIdx + 1];
      }
    }

    return currentLevel;
  }

  // ===========================================================================
  // VISIT HISTORY & 6D AFFINITIES
  // ===========================================================================

  /**
   * Full profile update with visit history and engagement tracking.
   *
   * Use this for complete activity tracking. In addition to what `update()` does,
   * this method also:
   * - Creates a VisitEntry in visitHistory (capped at MAX_VISIT_HISTORY)
   * - Updates engagement metrics (velocity, streaks, totals)
   * - Accepts session context (entryPoint, referrer, learningPathId)
   * - Accepts engagement data (scrollDepth, interactionCount, contentProgress)
   *
   * Internally calls `update()` first, then adds visit history and engagement.
   *
   * @param profile - Current learner profile
   * @param nodeId - Content node UID (repo, activity, container, or element)
   * @param action - Type of interaction (view, complete, bookmark, skip)
   * @param duration - Optional time spent in ms
   * @param context - Session context (entryPoint, referrer, etc.)
   * @param engagement - Engagement data (scrollDepth, contentProgress, etc.)
   * @returns Updated profile, affinity changes, and the created visit entry
   *
   * @example
   * const { profile, updates, visit } = updater.track(
   *   profile,
   *   'lesson-123',
   *   'complete',
   *   120000,
   *   { sessionId: 'abc', entryPoint: 'recommendation' },
   *   { scrollDepth: 95, interactionCount: 8 }
   * );
   */
  track(
    profile: LearnerProfile,
    nodeId: string,
    action: NavigationEvent['action'],
    duration?: number,
    context?: Partial<VisitContext>,
    engagement?: Partial<VisitEngagement>,
    device?: Partial<DeviceInfo>,
  ): {
    profile: LearnerProfile;
    updates: InterestUpdate[];
    visit?: VisitEntry;
  } {
    // First do the standard update (handles affinities, recentTags, experienceLevel)
    const result = this.update(profile, nodeId, action, duration);
    const updatedProfile = result.profile;

    // Resolve node for visit entry creation
    const resolved = this.resolveNodeWithMetadata(nodeId);
    if (!resolved) {
      return { ...result, visit: undefined };
    }
    const { nodeInfo, metadata } = resolved;

    // Create visit entry (uses updates from update() call)
    const visit = this.createVisitEntry({
      nodeId,
      nodeInfo,
      metadata,
      action,
      duration,
      updates: result.updates,
      context,
      engagement,
      device,
    });

    // Update visit history (prepend, trim to max)
    const visitHistory = [visit, ...(updatedProfile.visitHistory || [])].slice(
      0,
      MAX_VISIT_HISTORY,
    );

    // Update engagement metrics
    const engagementMetrics = this.updateEngagementMetrics(
      updatedProfile.engagement,
      duration,
      visitHistory,
    );

    // Affinities already updated by update()
    // just add visit history and engagement
    return {
      profile: {
        ...updatedProfile,
        visitHistory,
        engagement: engagementMetrics,
      },
      updates: result.updates,
      visit,
    };
  }

  /**
   * Create a VisitEntry record from interaction data.
   *
   * VisitEntry captures a complete snapshot of a content interaction:
   * - What was visited (nodeId, repositoryId, nodeType)
   * - What happened (action, duration)
   * - Content metadata (title, difficulty, tags)
   * - Session context (entryPoint, referrer, learningPathId)
   * - Engagement signals (scrollDepth, interactionCount, contentProgress)
   * - Resulting affinity changes (for analytics/debugging)
   *
   * Used by `track()` to build visitHistory for journey analysis and
   * "continue learning" functionality.
   */
  private createVisitEntry(params: {
    nodeId: string;
    nodeInfo: ContentNodeInfo;
    metadata: ContentMeta;
    action: NavigationEvent['action'];
    duration?: number;
    updates: InterestUpdate[];
    context?: Partial<VisitContext>;
    engagement?: Partial<VisitEngagement>;
    device?: Partial<DeviceInfo>;
  }): VisitEntry {
    const {
      nodeId,
      nodeInfo,
      metadata,
      action,
      duration,
      updates,
      context,
      engagement,
      device,
    } = params;

    const contentMeta: VisitContentMeta = {
      title: metadata.name,
      difficulty: metadata.difficulty,
      tags: metadata.tags.map((t) => t.name),
    };

    const fullContext: VisitContext = {
      sessionId: context?.sessionId || this.generateId(),
      sequenceNumber: context?.sequenceNumber || 1,
      entryPoint: context?.entryPoint || 'direct',
      referrer: context?.referrer,
      learningPathId: context?.learningPathId,
    };

    const fullEngagement: VisitEngagement = {
      scrollDepth: engagement?.scrollDepth || 0,
      interactionCount: engagement?.interactionCount || 0,
      contentProgress: engagement?.contentProgress,
    };

    // Convert InterestUpdate to AffinityChange
    const affinityChanges: AffinityChange[] = updates.map((u) => ({
      dimension: this.getTagDimension(u.tag, metadata) || 'topic',
      tag: u.tag,
      oldValue: u.oldValue,
      newValue: u.newValue,
      delta: u.delta,
    }));

    return {
      id: this.generateId(),
      nodeId,
      repositoryId: nodeInfo.repositoryId,
      nodeType: nodeInfo.nodeType,
      action,
      timestamp: new Date(),
      duration: duration ?? null,
      content: contentMeta,
      context: fullContext,
      engagement: fullEngagement,
      device: { type: device?.type || 'desktop', ...device },
      affinityChanges,
    };
  }

  /**
   * Update 6-dimensional affinities based on content interaction.
   *
   * Applies the delta formula to each tag in the content:
   *   delta =
   *    tagWeight × actionWeight × nodeTypeWeight × dimensionWeight × LEARNING_RATE
   *   newValue = clamp(0, 1, oldValue + delta)
   *
   * Updates two sources of affinities:
   * 1. Content tags → mapped to their respective dimensions
   *    (topic, skill, tool, etc.)
   * 2. Problem categories → mapped to 'industry' dimension
   *
   * Changes below MIN_DELTA_THRESHOLD are ignored to reduce noise.
   * All changes are pushed to the `changes` array for caller visibility.
   */
  private updateDimensionalAffinities(params: {
    current: DimensionalAffinities | undefined;
    metadata: ContentMeta;
    action: NavigationEvent['action'];
    duration?: number;
    nodeType: ContentNodeType;
    changes: AffinityChange[];
  }): DimensionalAffinities {
    const { current, metadata, action, duration, nodeType, changes } = params;
    // Initialize if needed
    const affinities: DimensionalAffinities = current
      ? this.cloneDimensionalAffinities(current)
      : this.createEmptyAffinities();
    const actionMultiplier = this.getActionMultiplierValue(action, duration);
    const nodeTypeWeight = NODE_WEIGHTS[nodeType];

    // Update affinities from tags (uses tag's category as dimension)
    for (const tag of metadata.tags) {
      const dimension = this.getTagDimension(tag.name, metadata) || 'topic';
      const dimWeight = DIMENSION_WEIGHTS[dimension];

      const currentScore = affinities[dimension][tag.name];
      const oldValue = currentScore?.value || 0;
      const delta =
        tag.weight *
        actionMultiplier *
        nodeTypeWeight *
        dimWeight *
        LEARNING_RATE;
      const newValue = Math.max(0, Math.min(1, oldValue + delta));

      if (Math.abs(delta) > MIN_DELTA_THRESHOLD) {
        affinities[dimension][tag.name] = this.updateAffinityScore(
          currentScore,
          newValue,
          delta,
          'behavioral',
        );

        changes.push({
          dimension,
          tag: tag.name,
          oldValue,
          newValue,
          delta,
        });
      }
    }

    // Update industry affinities from problem categories.
    // ContentMeta.problems define what real-world challenges the content addresses.
    // Each problem has a category (e.g., 'fintech', 'e-commerce', 'data-analysis')
    // that maps to the 'industry' dimension, helping match learners with content
    // relevant to their professional domain.
    const industryDimWeight = DIMENSION_WEIGHTS.industry;
    for (const problem of metadata.problems) {
      const currentScore = affinities.industry[problem.category];
      const oldValue = currentScore?.value || 0;
      const delta =
        actionMultiplier * nodeTypeWeight * industryDimWeight * LEARNING_RATE;
      const newValue = Math.max(0, Math.min(1, oldValue + delta));

      if (Math.abs(delta) > MIN_DELTA_THRESHOLD) {
        affinities.industry[problem.category] = this.updateAffinityScore(
          currentScore,
          newValue,
          delta,
          'behavioral',
        );
        changes.push({
          dimension: 'industry',
          tag: problem.category,
          oldValue,
          newValue,
          delta,
        });
      }
    }

    return affinities;
  }

  /**
   * Update engagement metrics based on activity.
   *
   * Computes:
   * - totalInteractions: Cumulative interaction count
   * - totalTimeSpent: Cumulative duration across all visits
   * - streakDays: Consecutive days with activity
   * - velocity: Engagement momentum (0-100), boosted by completions and scroll depth
   * - journeyStage: Current learning phase (browse → explore → targeted → flow)
   *
   * Action-specific logic (e.g., completions boosting velocity) is derived from
   * visitHistory entries, not passed directly - the visit already contains action.
   */
  private updateEngagementMetrics(
    current: EngagementMetrics | undefined,
    duration: number | undefined,
    visitHistory: VisitEntry[],
  ): EngagementMetrics {
    const now = new Date();
    const metrics: EngagementMetrics = current
      ? { ...current }
      : {
          velocity: 0,
          journeyStage: STAGE_BROWSE,
          totalInteractions: 0,
          totalTimeSpent: 0,
          streakDays: 0,
          lastActiveAt: now,
        };

    // Update totals
    metrics.totalInteractions++;
    metrics.totalTimeSpent += duration || 0;
    metrics.lastActiveAt = now;
    // Update streak
    metrics.streakDays = this.calculateStreak(visitHistory, now);
    // Calculate velocity
    metrics.velocity = this.calculateVelocity(visitHistory, metrics);
    // Classify journey stage
    metrics.journeyStage = this.classifyJourneyStage(visitHistory, metrics);
    return metrics;
  }

  /**
   * Calculate engagement velocity (0-100).
   *
   * Velocity represents learning momentum - how actively engaged the learner is.
   * Higher velocity indicates consistent, deep engagement; lower indicates
   * inactivity or shallow interactions.
   *
   * Formula components:
   * 1. Base: Starts at 100, decays by 2 points per hour of inactivity
   * 2. Completions boost: +5 per completion (max +25) from last 20 visits
   * 3. Scroll depth boost: +0.2 × avgScrollDepth from last 20 visits
   * 4. Streak multiplier: ×(1 + streakDays × 0.05)
   *
   * Example: 12 hours inactive, 3 completions, 80% avg scroll, 5-day streak
   *   base = 100 - 24 = 76
   *   + completions = 76 + 15 = 91
   *   + scroll = 91 + 16 = 107
   *   × streak = 107 × 1.25 = 133.75 → capped at 100
   */
  private calculateVelocity(
    visitHistory: VisitEntry[],
    metrics: EngagementMetrics,
  ): number {
    const now = new Date();
    const lastActive = metrics.lastActiveAt;
    const hoursSinceActivity =
      (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    // Base velocity decays over time
    let velocity = Math.max(0, 100 - hoursSinceActivity * 2);

    // Boost from recent completions
    const recentCompletions = visitHistory
      .slice(0, 20)
      .filter((v) => v.action === 'complete').length;
    velocity += Math.min(recentCompletions * 5, 25);

    // Boost from engagement depth
    const avgScrollDepth =
      visitHistory
        .slice(0, 20)
        .reduce((sum, v) => sum + v.engagement.scrollDepth, 0) /
      Math.max(1, Math.min(20, visitHistory.length));
    velocity += avgScrollDepth * 0.2;

    // Streak multiplier
    const streakMultiplier = 1 + metrics.streakDays * 0.05;
    velocity *= streakMultiplier;

    return Math.min(100, Math.round(velocity));
  }

  /**
   * Classify journey stage based on engagement.
   *
   * Journey stages represent the learner's progression from casual browsing
   * to deep learning flow. Used to adapt recommendation strategies.
   *
   * Stages (evaluated in order, first match wins):
   * - flow:     velocity ≥ 90 AND matchQuality ≥ 95 (deep engagement, optimal learning)
   * - targeted: velocity ≥ 70 AND matchQuality ≥ 85 (focused, clear preferences)
   * - explore:  interactions ≥ 10 AND velocity ≥ 40 (discovering interests)
   * - browse:   default (new user or low engagement)
   *
   * matchQuality is derived from recent affinity changes - high positive deltas
   * indicate content is well-matched to learner interests.
   */
  private classifyJourneyStage(
    visitHistory: VisitEntry[],
    metrics: EngagementMetrics,
  ): JourneyStage {
    const { velocity, totalInteractions } = metrics;
    const { flow, targeted, explore } = JOURNEY_THRESHOLDS;
    // Calculate average match quality from recent visits
    const avgMatchQuality = this.calculateAverageMatchQuality(visitHistory);
    if (velocity >= flow.velocity && avgMatchQuality >= flow.matchQuality) {
      return STAGE_FLOW;
    }
    if (
      velocity >= targeted.velocity &&
      avgMatchQuality >= targeted.matchQuality
    ) {
      return STAGE_TARGETED;
    }
    if (
      totalInteractions >= explore.interactions &&
      velocity >= explore.velocity
    ) {
      return STAGE_EXPLORE;
    }
    return STAGE_BROWSE;
  }

  /**
   * Calculate average match quality from visit affinity changes (0-100).
   *
   * Match quality measures how well recent content aligns with learner interests.
   * High positive affinity deltas indicate content the learner engages with matches
   * their profile - a signal they're finding relevant material.
   *
   * Formula per visit:
   *   avgDelta = mean of positive affinity changes (negative changes ignored)
   *   visitQuality = min(100, avgDelta × 1000 + 50)
   *
   * The ×1000 scaling converts small deltas (e.g., 0.05) to meaningful scores.
   * Base of 50 means neutral engagement (no affinity changes) scores average.
   *
   * @returns Average quality across last 10 visits, or 50 (neutral) if no data
   */
  private calculateAverageMatchQuality(visitHistory: VisitEntry[]): number {
    const recent = visitHistory.slice(0, 10);
    if (recent.length === 0) return 0;

    // Positive deltas indicate content matched learner interests.
    // Negative deltas (from skips) are ignored - we care about alignment, not rejection.
    let totalQuality = 0;
    let count = 0;
    for (const visit of recent) {
      if (visit.affinityChanges.length > 0) {
        const avgDelta =
          visit.affinityChanges.reduce(
            (sum, c) => sum + Math.max(0, c.delta),
            0,
          ) / visit.affinityChanges.length;
        totalQuality += Math.min(100, avgDelta * 1000 + 50);
        count++;
      }
    }
    return count > 0 ? totalQuality / count : 50;
  }

  /**
   * Calculate consecutive days of learning activity (streak).
   *
   * Streaks reward consistent engagement. A higher streak means the learner
   * has been active for multiple consecutive days, boosting their velocity
   * via the streak multiplier (×1.05 per day).
   *
   * Algorithm:
   * 1. Start from today (or yesterday if no activity today yet)
   * 2. Walk backward through calendar days
   * 3. Count consecutive days with at least one visit
   * 4. Stop at first gap (day with no activity)
   *
   * Grace period: If no activity today (i === 0), the streak isn't broken -
   * we start counting from yesterday. This prevents penalizing learners who
   * haven't logged in yet today.
   *
   * @returns Number of consecutive active days (0-365 max)
   */
  private calculateStreak(visitHistory: VisitEntry[], now: Date): number {
    if (visitHistory.length === 0) return 0;

    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    let streak = 0;
    const currentDay = dayStart;

    // Walk backward through calendar days, counting consecutive active days
    for (let i = 0; i < 365; i++) {
      const dayEnd = new Date(currentDay);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const hasActivity = visitHistory.some((v) => {
        const vTime = new Date(v.timestamp).getTime();
        return vTime >= currentDay.getTime() && vTime < dayEnd.getTime();
      });

      if (hasActivity) {
        streak++;
        currentDay.setDate(currentDay.getDate() - 1);
      } else if (i === 0) {
        // Grace period: no activity today doesn't break the streak.
        // Check yesterday instead - learner may not have logged in yet today.
        currentDay.setDate(currentDay.getDate() - 1);
      } else {
        // Gap found - streak is broken
        break;
      }
    }

    return streak;
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Create empty 6D affinities structure
   */
  createEmptyAffinities(): DimensionalAffinities {
    const affinities = {} as DimensionalAffinities;
    for (const dim of AFFINITY_DIMENSIONS) {
      affinities[dim] = {};
    }
    return affinities;
  }

  /**
   * Create empty engagement metrics
   */
  createEmptyEngagement(): EngagementMetrics {
    return {
      velocity: 0,
      journeyStage: STAGE_BROWSE,
      totalInteractions: 0,
      totalTimeSpent: 0,
      streakDays: 0,
      lastActiveAt: new Date(),
    };
  }

  /**
   * Clone dimensional affinities (deep copy)
   */
  private cloneDimensionalAffinities(
    source: DimensionalAffinities,
  ): DimensionalAffinities {
    const clone = {} as DimensionalAffinities;
    for (const dim of AFFINITY_DIMENSIONS) {
      clone[dim] = {};
      for (const [tag, score] of Object.entries(source[dim] || {})) {
        clone[dim][tag] = { ...score };
      }
    }
    return clone;
  }

  /**
   * Update or create an affinity score
   */
  private updateAffinityScore(
    current: AffinityScore | undefined,
    newValue: number,
    delta: number,
    source: AffinitySource,
  ): AffinityScore {
    const now = new Date();
    const [SOURCE_ONBOARDING, SOURCE_BEHAVIORAL, SOURCE_EXPLICIT] =
      AFFINITY_SOURCES;

    if (!current) {
      return {
        value: newValue,
        confidence: this.calculateConfidence(1),
        sources: {
          onboarding: source === SOURCE_ONBOARDING ? delta : 0,
          behavioral: source === SOURCE_BEHAVIORAL ? delta : 0,
          explicit: source === SOURCE_EXPLICIT ? delta : 0,
        },
        lastUpdated: now,
        interactionCount: 1,
      };
    }

    return {
      value: newValue,
      confidence: this.calculateConfidence(current.interactionCount + 1),
      sources: {
        onboarding: current.sources.onboarding,
        behavioral:
          current.sources.behavioral +
          (source === SOURCE_BEHAVIORAL ? delta : 0),
        explicit:
          current.sources.explicit + (source === SOURCE_EXPLICIT ? delta : 0),
      },
      lastUpdated: now,
      interactionCount: current.interactionCount + 1,
    };
  }

  /**
   * Calculate confidence based on interaction count.
   *
   * Confidence grows logarithmically with interactions, reflecting that more
   * data points make the affinity more reliable. Capped at MAX_CONFIDENCE
   * because even many interactions don't guarantee perfect accuracy.
   * log10 is the common logarithm, or base-10 logarithm, which is the inverse
   * of the exponential function 10^x. It answers the question:
   * "10 to what power equals this number?"
   *
   * Formula: confidence =
   *  min(MAX_CONFIDENCE, BASE_CONFIDENCE + log10(count + 1) × GROWTH_RATE)
   *
   * Example progression:
   *   1 interaction  → 0.39 (just above base)
   *   10 interactions → 0.60
   *   100 interactions → 0.90
   *   1000+ interactions → 0.95 (capped)
   *
   * @param interactionCount - Number of interactions affecting this affinity
   * @returns Confidence value between BASE_CONFIDENCE and MAX_CONFIDENCE
   */
  private calculateConfidence(interactionCount: number): number {
    const MAX_CONFIDENCE = 0.95;
    const BASE_CONFIDENCE = 0.3;
    const GROWTH_RATE = 0.3;
    return Math.min(
      MAX_CONFIDENCE,
      BASE_CONFIDENCE + Math.log10(interactionCount + 1) * GROWTH_RATE,
    );
  }

  /**
   * Determine tag dimension from content metadata
   */
  private getTagDimension(
    tagName: string,
    metadata: ContentMeta,
  ): AffinityDimension | undefined {
    const tag = metadata.tags.find((t) => t.name === tagName);
    if (
      tag?.category &&
      AFFINITY_DIMENSIONS.includes(tag.category as AffinityDimension)
    ) {
      return tag.category as AffinityDimension;
    }
    return 'topic'; // Default fallback
  }

  /**
   * Get action multiplier value
   */
  private getActionMultiplierValue(
    action: NavigationEvent['action'],
    duration?: number,
  ): number {
    switch (action) {
      case 'complete':
        return 1.0;
      case 'bookmark':
        return 0.8;
      case 'view':
        return duration && duration > 60000 ? 0.5 : 0.3;
      case 'skip':
        return -0.3;
      default:
        return 0;
    }
  }

  /**
   * Generate a unique ID using crypto.randomUUID
   */
  private generateId(): string {
    return randomUUID();
  }
}
