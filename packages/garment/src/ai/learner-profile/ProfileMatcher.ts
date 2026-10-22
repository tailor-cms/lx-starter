/**
 * Profile Matcher
 * Calculates match scores between learner profiles and content
 *
 * Content Hierarchy & Granularity
 *
 * Content is organized hierarchically:
 * - **Repository** → Activities → ContentContainers → ContentElements
 *
 * During content extraction, `ContentExtractor` creates an `ExtractedSection`
 * for each Activity (with `id = activity.uid`). Each section contains elements
 * with their UIDs.
 *
 * `MetadataGenerator` generates tags and problems at repository level, but tags
 * can optionally include `sectionIds` to attribute them to specific activities.
 * This enables granular "more like this" matching:
 *
 * ```typescript
 * interface Tag {
 *   name: string;
 *   weight: number;
 *   sectionIds?: string[];  // Activity UIDs this tag came from
 * }
 * ```
 *
 * When `getMoreLikeThis` receives an activity/container uid (via `nodeResolver`),
 * it filters to tags attributed to that section, enabling:
 * - "More like this activity" (not just "more like this course")
 * - Cross-repository suggestions based on section-level similarity
 *
 * Falls back to repository-level comparison when `sectionIds` is not available.
 *
 * @example
 * const profile = {
 *   id: 'profile-1',
 *   affinities: {
 *     topic: { python: { value: 0.9, ... }, 'data-science': { value: 0.7, ... } },
 *     // ... other dimensions
 *   },
 *   recentTags: ['python', 'data-science'],
 *   experienceLevel: 'intermediate',
 *   goals: ['Build projects'],
 *   answers: {},
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 *
 * const contentMeta = new Map([
 *   ['repo-1', {
 *     name: 'Python Basics',
 *     tags: [{ name: 'python', weight: 1 }, { name: 'basics', weight: 0.8 }],
 *     problems: [{ id: 'p1', title: 'Learn syntax', category: 'programming' }],
 *     difficulty: 'beginner',
 *     learningOutcomes: [],
 *     prerequisites: [],
 *   }],
 *   ['repo-2', {
 *     name: 'Data Science with Python',
 *     tags: [{ name: 'python', weight: 0.8 }, { name: 'data-science', weight: 1 }],
 *     problems: [{ id: 'p2', title: 'Analyze data', category: 'programming' }],
 *     difficulty: 'intermediate',
 *     learningOutcomes: [],
 *     prerequisites: [],
 *   }],
 * ]);
 *
 * const matcher = new ProfileMatcher();
 * const suggestions = matcher.suggestContent(profile, contentMeta, { limit: 5 });
 *
 * Returns:
 * [
 *   {
 *     id: 'repo-2',
 *     name: 'Data Science with Python',
 *     score: 85,
 *     reason: 'Based on your interest in Data Science',
 *     relationship: 'similar-topic',
 *     sharedTags: ['python', 'data-science'],
 *     sharedProblems: ['p2'],
 *   },
 *   {
 *     id: 'repo-1',
 *     name: 'Python Basics',
 *     score: 72,
 *     reason: 'Based on your interest in Python',
 *     relationship: 'similar-topic',
 *     sharedTags: ['python'],
 *     sharedProblems: ['p1'],
 *   },
 * ]
 */

import type {
  ContentMeta,
  DifficultyLevel,
  LearnerProfile,
  ProfileMatchOptions,
  RelatedContent,
  RelationshipType,
  Tag,
} from '../types';
import {
  DIFFICULTY_LEVELS,
  DIFFICULTY_MATCH_SCORES,
  SCORE_WEIGHTS,
  THRESHOLDS,
} from '../core-settings';
import { DIMENSION_WEIGHTS } from '../types/activity-tracking';

import { formatTagLabel } from './utils';

export class ProfileMatcher {
  /**
   * Get affinity score for a tag from profile
   * Applies dimension weight and confidence factor.
   *
   * @param profile - Learner profile
   * @param tag - Content tag with category and name
   * @returns Affinity score 0-1, weighted by dimension importance and confidence
   */
  private getTagAffinity(profile: LearnerProfile, tag: Tag): number {
    const dimensionAffinities = profile.affinities[tag.category];
    if (!dimensionAffinities) return 0;

    const affinity = dimensionAffinities[tag.name];
    if (!affinity) return 0;

    // Apply dimension weight and confidence factor
    const dimensionWeight = DIMENSION_WEIGHTS[tag.category] ?? 1;
    const confidenceMultiplier = 0.5 + affinity.confidence * 0.5;
    return affinity.value * dimensionWeight * confidenceMultiplier;
  }

  /**
   * Get raw affinity value for a tag (without dimension weight/confidence)
   * Used for threshold checks where we just need the base score
   */
  private getTagAffinityValue(profile: LearnerProfile, tag: Tag): number {
    const dimensionAffinities = profile.affinities[tag.category];
    if (!dimensionAffinities) return 0;
    return dimensionAffinities[tag.name]?.value || 0;
  }

  /**
   * Get "more like this" suggestions based on current content
   * Finds similar content by comparing tags and problem categories between
   * the source content and all other content in the catalog.
   *
   * Section-Level Matching
   *
   * When `sectionId` is provided (activity UID), the matcher filters source tags
   * to only those attributed to that section (via `tag.sectionIds`). This enables
   * "more like this activity" instead of "more like this course".
   *
   * Target suggestions can also include `sectionId` when a specific section
   * within a repository is the best match.
   *
   * Scoring formula:
   * - Tag overlap: 60 points max (shared topics/skills)
   * - Category overlap: 30 points max (shared problem domains)
   * - Interest boost: scaled by 10 (personalized by learner affinities)
   *
   * Results below 30 points are filtered out.
   *
   * @example
   * Repository-level matching
   * const similar = matcher.getMoreLikeThis('repo-123', profile, contentMeta);
   *
   * @example
   * Section-level matching (activity)
   * const similar = matcher.getMoreLikeThis('repo-123', profile, contentMeta, {
   *   sectionId: 'activity-456',
   *   limit: 5,
   * });
   *
   * @param repositoryId - id of the repository to find similar items for
   * @param profile - Learner profile for interest-based boosting
   * @param contentMeta - Map of all content metadata (includes name)
   * @param options - Options including sectionId for granular matching and limit
   * @returns Sorted list of similar content with scores and reasons
   */
  getMoreLikeThis(
    repositoryId: string,
    profile: LearnerProfile,
    contentMeta: Map<string, ContentMeta>,
    options?: { sectionId?: string; limit?: number } | number,
  ): RelatedContent[] {
    // Handle backward compatibility (limit as number)
    const opts =
      typeof options === 'number' ? { limit: options } : options || {};
    const limit = opts.limit ?? 5;
    const sectionId = opts.sectionId;

    const sourceMetadata = contentMeta.get(repositoryId);
    if (!sourceMetadata) return [];

    // Get source tags - filter by sectionId if provided
    const sourceTags = sectionId
      ? sourceMetadata.tags.filter((t) => t.sectionIds?.includes(sectionId))
      : sourceMetadata.tags;

    // If filtering by section and no tags found, fall back to all tags
    const effectiveSourceTags =
      sourceTags.length > 0 ? sourceTags : sourceMetadata.tags;

    const suggestions: RelatedContent[] = [];
    for (const [repoId, metadata] of contentMeta) {
      if (repoId === repositoryId) continue;

      // Calculate similarity using effective source tags
      const tagOverlap = this.calculateTagOverlap(
        effectiveSourceTags,
        metadata.tags,
      );
      const categoryMatch = this.calculateCategoryOverlap(
        sourceMetadata,
        metadata,
      );

      // Base score on similarity (60% tags, 30% categories)
      let score = tagOverlap * 60 + categoryMatch * 30;
      // Boost by learner interest (10%)
      const interestBoost = this.calculateInterestBoost(profile, metadata);
      score += interestBoost * 10;

      if (score < 30) continue;

      const sourceTagNames = new Set(effectiveSourceTags.map((t) => t.name));
      const sharedTags = metadata.tags
        .filter((t) => sourceTagNames.has(t.name))
        .map((t) => t.name);

      // Find best matching section in target (if tags have sectionIds)
      const bestSection = this.findBestMatchingSection(
        metadata,
        sourceTagNames,
      );

      suggestions.push({
        id: repoId,
        name: metadata.name,
        score: Math.min(100, Math.round(score)),
        reason: `Similar to current content (${sharedTags.length} shared topics)`,
        relationship: 'similar-topic',
        sharedTags,
        sharedProblems: [],
        sectionId: bestSection,
      });
    }

    suggestions.sort((a, b) => b.score - a.score);
    return suggestions.slice(0, limit);
  }

  /**
   * Find the section (activity) within metadata that best matches the source tags
   */
  private findBestMatchingSection(
    metadata: ContentMeta,
    sourceTagNames: Set<string>,
  ): string | undefined {
    // Group tags by sectionId
    const sectionScores = new Map<string, number>();
    for (const tag of metadata.tags) {
      if (!tag.sectionIds || !sourceTagNames.has(tag.name)) continue;
      for (const sectionId of tag.sectionIds) {
        const current = sectionScores.get(sectionId) || 0;
        sectionScores.set(sectionId, current + tag.weight);
      }
    }

    // Return section with highest score
    let bestSection: string | undefined;
    let bestScore = 0;

    for (const [sectionId, score] of sectionScores) {
      if (score > bestScore) {
        bestScore = score;
        bestSection = sectionId;
      }
    }

    return bestSection;
  }

  /**
   * Calculate tag overlap between two repositories
   *
   * Tags are specific topics or skills extracted during AI metadata generation.
   * Each tag has a weight (0-1) indicating its importance to the content.
   *
   * Tag types include:
   * - Topics: 'sales-methodology', 'customer-success', 'product-knowledge'
   * - Skills: 'negotiation', 'objection-handling', 'presentation'
   * - Tools: 'excel-formulas', 'crm-usage', 'analytics-dashboards'
   *
   * Note: This method counts tag matches only, not their weights.
   * Tag weights are used separately in calculateInterestBoost.
   *
   * Measures how many tags are shared between source and target,
   * normalized by the larger tag count.
   *
   * Used in getMoreLikeThis to contribute 60 points to final score.
   *
   * @example
   * Source tags: ['negotiation', 'objection-handling', 'closing']
   * Target tags: ['negotiation', 'pricing', 'proposals']
   * Overlap = 1 (negotiation) / max(3, 3) = 0.33
   * Final contribution: 0.33 * 60 = 20 points
   *
   * @param source - Source repository metadata
   * @param target - Target repository to compare
   * @returns Overlap ratio (0-1)
   */
  private calculateTagOverlap(
    sourceTags: Tag[],
    targetTags: Tag[],
  ): number {
    const sourceTagNames = new Set(sourceTags.map((t) => t.name));
    const overlap = targetTags.filter((t) => sourceTagNames.has(t.name)).length;
    return overlap / Math.max(sourceTags.length, targetTags.length, 1);
  }

  /**
   * Calculate match score between profile and repository metadata
   *
   * Uses 6D affinities for scoring.
   * When difficulty profiling is disabled (experienceLevel undefined),
   * scoring is based entirely on tag affinity (100% weight).
   */
  calculateScore(profile: LearnerProfile, metadata: ContentMeta): number {
    let score = 0;
    let maxScore = 0;

    // Determine if difficulty scoring should be applied
    const includeDifficulty = profile.experienceLevel !== undefined;
    const tagWeight = includeDifficulty ? SCORE_WEIGHTS.tagAffinity : 1;
    const diffWeight = includeDifficulty ? SCORE_WEIGHTS.difficulty : 0;

    // Tag affinity matching (uses 6D affinities when available)
    for (const tag of metadata.tags) {
      const affinity = this.getTagAffinity(profile, tag);
      score += affinity * tag.weight * tagWeight;
      maxScore += tag.weight * tagWeight;
    }

    // Difficulty appropriateness (only if experience level is set)
    if (includeDifficulty) {
      const difficultyMatch = this.calculateDifficultyMatch(
        profile.experienceLevel!,
        metadata.difficulty,
      );
      score += difficultyMatch * diffWeight;
      maxScore += diffWeight;
    }

    // Normalize to 0-100
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Calculate how well difficulty levels match
   */
  calculateDifficultyMatch(
    profileLevel: DifficultyLevel,
    contentLevel: DifficultyLevel,
  ): number {
    const profileIndex = DIFFICULTY_LEVELS.indexOf(profileLevel);
    const contentIndex = DIFFICULTY_LEVELS.indexOf(contentLevel);
    const diff = Math.abs(profileIndex - contentIndex);
    return DIFFICULTY_MATCH_SCORES[diff] || 0;
  }

  /**
   * Get matched tags between profile and metadata
   * Uses 6D affinities for matching
   */
  getMatchedTags(profile: LearnerProfile, metadata: ContentMeta): Tag[] {
    return metadata.tags.filter((tag) => {
      const affinity = this.getTagAffinityValue(profile, tag);
      return affinity > THRESHOLDS.tagMatch;
    });
  }

  /**
   * Generate reasons for recommendation
   */
  generateReasons(profile: LearnerProfile, metadata: ContentMeta): string[] {
    const reasons: string[] = [];
    // Tag matches
    const matchedTags = this.getMatchedTags(profile, metadata);
    if (matchedTags.length > 0) {
      const topTags = matchedTags
        .slice(0, 3)
        .map((t) => formatTagLabel(t.name));
      reasons.push(`Covers your interests: ${topTags.join(', ')}`);
    }
    // Difficulty match (only if experience level is set)
    if (profile.experienceLevel) {
      const diffMatch = this.calculateDifficultyMatch(
        profile.experienceLevel,
        metadata.difficulty,
      );
      if (diffMatch >= 0.7) {
        reasons.push(`Appropriate for your ${profile.experienceLevel} level`);
      }
    }
    // Problems
    if (metadata.problems.length > 0) {
      const problem = metadata.problems[0];
      reasons.push(`Teaches you to: ${problem.title}`);
    }
    // Goals
    if (profile.goals.length > 0 && metadata.learningOutcomes.length > 0) {
      reasons.push(`Supports your goal: ${profile.goals[0]}`);
    }
    return reasons;
  }

  /**
   * Suggest content based on learner profile
   */
  suggestContent(
    profile: LearnerProfile,
    contentMeta: Map<string, ContentMeta>,
    options?: {
      limit?: number;
      excludeCompleted?: string[];
    } & ProfileMatchOptions,
  ): RelatedContent[] {
    const excludeSet = new Set(options?.excludeCompleted || []);
    const suggestions: RelatedContent[] = [];
    // Recency boost settings
    const boostRecent = options?.boostRecent ?? false;
    const recentBoostWeight = options?.recentBoostWeight ?? 0.2;
    const recentDays = options?.recentDays ?? 30;
    const recentThreshold = Date.now() - recentDays * 24 * 60 * 60 * 1000;
    for (const [repoId, metadata] of contentMeta) {
      if (excludeSet.has(repoId)) continue;
      // Calculate base interest score
      let score = this.calculateScore(profile, metadata);
      if (score < 20) continue;
      // Apply recency boost
      if (boostRecent && metadata.generatedAt) {
        const generatedTime = metadata.generatedAt.getTime();
        if (generatedTime > recentThreshold) {
          // Boost proportional to how recent (max boost for newest)
          const recencyRatio =
            (generatedTime - recentThreshold) / (Date.now() - recentThreshold);
          score = Math.min(100, score + recencyRatio * recentBoostWeight * 100);
        }
      }
      // Find shared interests (uses 6D affinities)
      const sharedTags = metadata.tags
        .filter((t) => this.getTagAffinityValue(profile, t) > 0.3)
        .map((t) => t.name);
      const sharedProblems = metadata.problems
        .filter((p) => {
          const industryAffinity = profile.affinities?.industry?.[p.category];
          return (industryAffinity?.value || 0) > 0.3;
        })
        .map((p) => p.id);
      const reason =
        boostRecent &&
        metadata.generatedAt &&
        metadata.generatedAt.getTime() > recentThreshold
          ? this.generateBoostRecentReason(profile, metadata, sharedTags)
          : this.generateSuggestionReason(profile, metadata, sharedTags);
      suggestions.push({
        id: repoId,
        name: metadata.name,
        score: Math.round(score),
        reason,
        relationship: this.determineRelationship(profile, metadata),
        sharedTags,
        sharedProblems,
      });
    }
    // Sort by score
    suggestions.sort((a, b) => b.score - a.score);
    // Apply limit
    return suggestions.slice(0, options?.limit || 10);
  }

  /**
   * Calculate problem category overlap between two repositories
   *
   * Categories are high-level problem domains that content addresses, extracted
   * during AI metadata generation. Examples: 'time-management', 'communication',
   * 'data-analysis', 'customer-retention', 'compliance'.
   *
   * Measures how many problem categories are shared between source and target,
   * normalized by the larger problem count.
   *
   * Used in getMoreLikeThis to contribute 30 points to final score.
   *
   * @example
   * Src problems [{ category: 'time-management' }, { category: 'communication' }]
   * Target problems [{ category: 'time-management' }, { category: 'leadership' }]
   * Overlap = 1 (time-management) / max(2, 2) = 0.5
   * Final contribution: 0.5 * 30 = 15 points
   *
   * @param source - Source repository metadata
   * @param target - Target repository to compare
   * @returns Overlap ratio (0-1)
   */
  private calculateCategoryOverlap(
    source: ContentMeta,
    target: ContentMeta,
  ): number {
    const sourceCategories = new Set(source.problems.map((p) => p.category));
    const overlap = target.problems.filter((p) =>
      sourceCategories.has(p.category),
    ).length;
    return (
      overlap / Math.max(source.problems.length, target.problems.length, 1)
    );
  }

  /**
   * Calculate interest boost score based on profile affinities
   *
   * Sums the weighted tag affinities between the learner's profile
   * and the content's tags. Higher boost = stronger match with
   * learner's demonstrated interests.
   *
   * Used in getMoreLikeThis scoring formula:
   * `score = tagOverlap * 60 + categoryMatch * 30 + interestBoost * 10`
   *
   * Where tagOverlap and categoryMatch are 0-1, contributing up to 60/30 points.
   * The interestBoost is unbounded (sum of affinities) and scaled by 10.
   *
   * This personalizes "similar content" results by factoring in what
   * the learner has actually engaged with, not just content similarity.
   *
   * @example
   * Profile affinities: { react: 0.8, typescript: 0.6 }
   * Content tags: [{ name: 'react', weight: 1.0 }, { name: 'css', weight: 0.5 }]
   * Boost = (react: 0.8 * 1.0) + (css: 0 * 0.5) = 0.8
   *          ↑ profile has react   ↑ profile has no css affinity
   * Final contribution to score: 0.8 * 10 = 8 points
   *
   * @param profile - Current learner profile with computed affinities
   * @param metadata - Repository metadata with weighted tags
   * @returns Boost score (sum of affinity * tag weight)
   */
  private calculateInterestBoost(
    profile: LearnerProfile,
    metadata: ContentMeta,
  ): number {
    let boost = 0;
    for (const tag of metadata.tags) {
      // Use 6D affinities when available
      boost += this.getTagAffinityValue(profile, tag) * tag.weight;
    }
    return boost;
  }

  /**
   * Generate a human-readable reason for suggesting content
   *
   * Creates personalized explanation based on:
   * - Number of shared tags (if 3+, shows count)
   * - Strongest matching interest tag
   * - Falls back to generic "Recommended for you"
   *
   * @param profile - Current learner profile
   * @param meta - Repository metadata being suggested
   * @param sharedTags - Tags that overlap between profile and content
   * @returns Human-readable reason string for the recommendation
   */
  private generateSuggestionReason(
    profile: LearnerProfile,
    meta: ContentMeta,
    sharedTags: string[],
  ): string {
    if (sharedTags.length >= 3) {
      return `Matches ${sharedTags.length} of your interests`;
    }
    const strongestTag = this.findStrongestAffinityTag(profile, meta);
    if (strongestTag) {
      return `Based on your interest in ${formatTagLabel(strongestTag)}`;
    }
    return 'Recommended for you';
  }

  /**
   * Generate reason for recently updated content suggestion
   *
   * Used when boostRecent is enabled to highlight that content was
   * recently updated while still connecting it to learner interests.
   *
   * Output formats:
   * - "Recently updated - matches N of your interests" (2+ shared tags)
   * - "Recently updated - related to {Tag}" (strongest affinity match)
   * - "Recently updated" (no specific match)
   *
   * @example
   * Learner interested in sales, content has sales + negotiation tags
   * "Recently updated - matches 2 of your interests"
   *
   * Learner interested in compliance, content has compliance tag
   * "Recently updated - related to Compliance"
   *
   * @param profile - Current learner profile
   * @param metadata - Repository metadata being suggested
   * @param sharedTags - Tags that overlap between profile and content
   * @returns Human-readable reason emphasizing recency
   */
  private generateBoostRecentReason(
    profile: LearnerProfile,
    meta: ContentMeta,
    sharedTags: string[],
  ): string {
    if (sharedTags.length >= 2) {
      return `Recently updated - matches ${sharedTags.length} of your interests`;
    }
    const strongestTag = this.findStrongestAffinityTag(profile, meta);
    if (strongestTag) {
      return `Recently updated - related to ${formatTagLabel(strongestTag)}`;
    }
    return 'Recently updated';
  }

  /**
   * Determine the relationship type between content and learner profile
   *
   * Logic:
   * - `similar-topic`: Content shares tags with learner's recent interactions
   * - `builds-on`: Content is higher difficulty than learner's current level
   * - `complementary`: Default when no specific relationship detected
   *
   * @param profile - Current learner profile
   * @param meta - Repository metadata to evaluate
   * @returns Relationship type for recommendation context
   */
  private determineRelationship(
    profile: LearnerProfile,
    meta: ContentMeta,
  ): RelationshipType {
    // Check if it's in recent tags (similar)
    const isRecent =
      profile.recentTags &&
      meta.tags.some((t) => profile.recentTags!.includes(t.name));
    if (isRecent) return 'similar-topic';
    // Check if it's higher difficulty (builds-on)
    if (profile.experienceLevel) {
      const profileIdx = DIFFICULTY_LEVELS.indexOf(profile.experienceLevel);
      const contentIdx = DIFFICULTY_LEVELS.indexOf(meta.difficulty);
      if (contentIdx > profileIdx) return 'builds-on';
    }
    return 'complement';
  }

  /**
   * Find the tag with the strongest learner affinity from content
   *
   * Searches through content tags to find the one the learner has
   * the highest affinity for. Uses 6D affinities when available.
   *
   * @param profile - Current learner profile
   * @param metadata - Repository metadata with tags
   * @returns Tag name with highest affinity, or empty string if none
   */
  private findStrongestAffinityTag(
    profile: LearnerProfile,
    metadata: ContentMeta,
  ): string {
    let strongestTag = '';
    let strongestWeight = 0;
    for (const tag of metadata.tags) {
      // Use 6D affinities when available
      const weight = this.getTagAffinityValue(profile, tag);
      if (weight > strongestWeight) {
        strongestWeight = weight;
        strongestTag = tag.name;
      }
    }
    return strongestTag;
  }
}
