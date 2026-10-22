/**
 * Content Analyzer
 * Holds content metadata and analyzes tag/category distribution
 *
 * ContentAnalyzer is the single source of truth for content metadata.
 * It should be instantiated once with your content catalog and passed
 * to LearnerProfiler and other components that need content data.
 *
 * @example
 * Initialize with content metadata
 * const contentMeta = await metadataGenerator.generateBatch(repositories);
 * const analyzer = new ContentAnalyzer(contentMeta);
 *
 * Pass to LearnerProfiler
 * const profiler = new LearnerProfiler(aiProvider, options, analyzer);
 *
 * Get analysis (cached after first call)
 * const analysis = analyzer.analyze();
 */
import type {
  AggregatedContentAnalysis,
  ContentMeta,
  DifficultyLevel,
  TagCategory,
} from '../types';

import { THRESHOLDS } from '../core-settings';

export class ContentAnalyzer {
  private contentMeta: Map<string, ContentMeta>;
  private cachedAnalysis?: AggregatedContentAnalysis;

  /**
   * Create a ContentAnalyzer with content metadata
   * @param contentMeta - Map of repository ID to ContentMeta
   * @param cachedAnalysis - Pre-computed analysis to avoid recomputation
   */
  constructor(
    contentMeta?: Map<string, ContentMeta>,
    cachedAnalysis?: AggregatedContentAnalysis,
  ) {
    this.contentMeta = contentMeta || new Map();
    this.cachedAnalysis = cachedAnalysis;
  }

  /**
   * Get the content metadata map
   */
  getContentMeta(): Map<string, ContentMeta> {
    return this.contentMeta;
  }

  /**
   * Set or update content metadata
   * Clears cached analysis when metadata changes.
   */
  setContentMeta(contentMeta: Map<string, ContentMeta>): void {
    this.contentMeta = contentMeta;
    this.cachedAnalysis = undefined;
  }

  /**
   * Get metadata for a specific repository
   */
  get(id: string): ContentMeta | undefined {
    return this.contentMeta.get(id);
  }

  /**
   * Check if content metadata is loaded
   */
  hasContent(): boolean {
    return this.size > 0;
  }

  /**
   * Get the number of repositories in the catalog
   */
  get size(): number {
    return this.contentMeta.size;
  }

  /**
   * Analyze content to understand tag and category distribution
   *
   * Results are cached after first call. Call with `force: true` to recompute.
   * This method examines all repository metadata to build a
   * statistical profile of the content catalog. It aggregates:
   *
   * **Tag Distribution**: Weighted frequency of each tag across all content.
   * Tags appearing in multiple repos with high weights score higher.
   * Returns top 30 tags sorted by aggregate weight.
   *
   * **Category Distribution**: Total weight by tag category (topic, skill,
   * concept, industry, tool). Shows what types of knowledge the catalog covers.
   *
   * **Difficulty Distribution**: Count of repositories at each difficulty level.
   * Helps understand if content skews beginner or advanced.
   *
   * @example
   * const analyzer = new ContentAnalyzer(contentMeta);
   * const analysis = analyzer.analyze();
   *
   * See top topics in catalog
   * console.log('Top tags:', Object.keys(analysis.tagDistribution).slice(0, 5));
   *
   * Check category balance
   * console.log('Skills coverage:', analysis.categoryDistribution.skill);
   *
   * Check difficulty spread
   * const { beginner, advanced } = analysis.difficultyDistribution;
   * console.log(`${beginner} beginner, ${advanced} advanced courses`);
   */
  analyze(options?: { force?: boolean }): AggregatedContentAnalysis {
    if (this.cachedAnalysis && !options?.force) {
      return this.cachedAnalysis;
    }
    const contentMetadataArray = Array.from(this.contentMeta.values());
    const tagDistribution: Record<string, number> = {};
    const categoryDistribution: Record<TagCategory, number> = {
      topic: 0,
      skill: 0,
      concept: 0,
      industry: 0,
      tool: 0,
      goal: 0,
    };
    const difficultyDistribution: Record<DifficultyLevel, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    };
    // Aggregate tag weights across all repositories
    for (const metadata of contentMetadataArray) {
      // Accumulate tag weights (tag appearing in multiple repos = higher score)
      for (const tag of metadata.tags) {
        tagDistribution[tag.name] =
          (tagDistribution[tag.name] || 0) + tag.weight;
        categoryDistribution[tag.category] += tag.weight;
      }
      // Count difficulty levels
      difficultyDistribution[metadata.difficulty]++;
    }
    // Sort tags by aggregate weight and keep top N
    // Rounding to 2 decimals for cleaner output
    const sortedTags = Object.entries(tagDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, THRESHOLDS.topTags)
      .reduce(
        (obj, [key, value]) => {
          obj[key] = Math.round(value * 100) / 100;
          return obj;
        },
        {} as Record<string, number>,
      );
    // Questions are populated by QuestionGenerator
    this.cachedAnalysis = {
      repositoryIds: Array.from(this.contentMeta.keys()),
      tagDistribution: sortedTags,
      categoryDistribution,
      difficultyDistribution,
      questions: [],
    };
    return this.cachedAnalysis;
  }

  /**
   * Get top tags from analysis
   */
  getTopTags(limit = 10): string[] {
    const analysis = this.analyze();
    return Object.keys(analysis.tagDistribution).slice(0, limit);
  }

  /**
   * Get tag-to-category mapping from content metadata
   * Builds a map of tag names to their categories across all repositories
   *
   * @returns Map of tag name to category (topic, skill, concept, industry, tool)
   *
   * @example
   * const categories = analyzer.getTagCategories();
   * const category = categories.get('javascript'); // 'tool'
   */
  getTagCategories(): Map<string, TagCategory> {
    const tagCategories = new Map<string, TagCategory>();
    for (const meta of this.contentMeta.values()) {
      for (const tag of meta.tags) {
        if (!tagCategories.has(tag.name)) {
          tagCategories.set(tag.name, tag.category);
        }
      }
    }
    return tagCategories;
  }

  /**
   * Get formatted tag distribution with categories
   * Returns tags sorted by count (highest first) with their categories
   *
   * @returns Array of {tag, category, count} sorted by count descending
   *
   * @example
   * const tags = analyzer.getFormattedTagDistribution();
   * // [{ tag: 'javascript', category: 'tool', count: 15 }, ...]
   */
  getFormattedTagDistribution(): Array<{
    tag: string;
    category: TagCategory;
    count: number;
  }> {
    const analysis = this.analyze();
    const categories = this.getTagCategories();
    return Object.entries(analysis.tagDistribution)
      .map(([tag, count]) => ({
        tag,
        category: categories.get(tag) || ('topic' as TagCategory),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get formatted category distribution
   * Returns categories with their counts
   *
   * @returns Array of {category, count}
   *
   * @example
   * const categories = analyzer.getFormattedCategoryDistribution();
   * // [{ category: 'topic', count: 25 }, { category: 'skill', count: 18 }, ...]
   */
  getFormattedCategoryDistribution(): Array<{
    category: string;
    count: number;
  }> {
    const analysis = this.analyze();
    return Object.entries(analysis.categoryDistribution).map(
      ([category, count]) => ({
        category,
        count,
      }),
    );
  }

  /**
   * Get formatted difficulty distribution
   * Returns difficulty levels with their repository counts
   *
   * @returns Array of {level, count}
   *
   * @example
   * const difficulty = analyzer.getFormattedDifficultyDistribution();
   * // [{ level: 'beginner', count: 10 }, { level: 'intermediate', count: 15 }, ...]
   */
  getFormattedDifficultyDistribution(): Array<{
    level: string;
    count: number;
  }> {
    const analysis = this.analyze();
    return Object.entries(analysis.difficultyDistribution).map(
      ([level, count]) => ({
        level,
        count,
      }),
    );
  }

  /**
   * Iterate over all content metadata
   */
  [Symbol.iterator](): Iterator<[string, ContentMeta]> {
    return this.contentMeta[Symbol.iterator]();
  }

  /**
   * Get entries iterator
   */
  entries(): IterableIterator<[string, ContentMeta]> {
    return this.contentMeta.entries();
  }

  /**
   * Get values iterator
   */
  values(): IterableIterator<ContentMeta> {
    return this.contentMeta.values();
  }
}
