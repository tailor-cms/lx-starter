/**
 * Metadata Generator
 *
 * Uses AI to generate semantic metadata from educational content including:
 * - Real-world problems learners can solve
 * - Content tags with weights and hierarchy
 * - Learning outcomes using Bloom's Taxonomy
 * - Difficulty level and duration estimates
 *
 * @example
 * const generator = new MetadataGenerator(aiProvider, {
 *   maxProblems: 5,
 *   maxTags: 20,
 *   maxOutcomes: 6,
 * });
 *
 * const metadata = await generator.generate(repository);
 * Returns: { problems, tags, learningOutcomes, difficulty, ... }
 *
 * Batch processing with progress
 * const results = await generator.generateBatch(repositories, (done, total) => {
 *   console.log(`Progress: ${done}/${total}`);
 * });
 */
import { ContentExtractor } from './ContentExtractor';
import {
  buildPrompt,
  OUTCOME_PROMPT,
  PROBLEM_PROMPT,
  SUMMARY_PROMPT,
  TAG_PROMPT,
} from './prompts';
import type { Repository } from '@/garment/entities/repository/Repository';
import type {
  AIProvider,
  ContentChunk,
  ContentMeta,
  DifficultyLevel,
  ExtractedRepository,
  ExtractedSection,
  LearningOutcome,
  MetadataGeneratorOptions,
  Problem,
  Prerequisite,
  Tag,
} from '@/ai/types';
import { type GarmentLogger, defaultLogger } from '@/garment/logger';

/**
 * AI generation temperature settings
 * Lower values = more deterministic, higher = more creative
 */
const TEMPERATURE = {
  PROBLEMS: 0.3, // Some creativity for real-world scenarios
  TAGS: 0.2, // Consistent categorization
  OUTCOMES: 0.2, // Structured learning objectives
  SUMMARY: 0.1, // Factual analysis
} as const;

/**
 * Default generator configuration
 */
const DEFAULT_OPTIONS = {
  maxProblems: 20, // Maximum problems to generate
  maxTags: 20, // Maximum tags to generate
  maxOutcomes: 10, // Maximum learning outcomes
  concurrency: 3, // Parallel batch processing workers
} as const;

/**
 * Content chunking configuration
 * Used when content exceeds token limits
 */
const CHUNKING = {
  MAX_TOKENS: 6000, // Token limit per chunk (~24K chars, leaves room for output)
  CHARS_PER_TOKEN: 4, // Approximate chars per token
  OVERLAP_TOKENS: 200, // Overlap between chunks for context continuity
  MAX_CHUNK_CHARS: 24000, // Hard cap on chunk content sent to AI
} as const;

/**
 * Element types considered interactive for metric calculation
 */
const INTERACTIVE_ELEMENT_TYPES = [
  'MULTIPLE_CHOICE',
  'SINGLE_CHOICE',
  'VIDEO_UNIT',
  'PODCAST_UNIT',
  'MUX_VIDEO',
  'AUDIO',
] as const;

/**
 * Metadata Generator
 * Generates AI-powered semantic metadata for educational content
 */
export class MetadataGenerator {
  private extractor: ContentExtractor;
  private options: Required<MetadataGeneratorOptions>;
  private logger: GarmentLogger;

  /**
   * Create a new MetadataGenerator
   * @param aiProvider AI provider for structured generation (OpenAI, Anthropic, etc.)
   * @param options Generation configuration options
   * @param logger Logger instance for diagnostic output
   */
  constructor(
    private aiProvider: AIProvider,
    options?: MetadataGeneratorOptions,
    logger?: GarmentLogger,
  ) {
    this.extractor = new ContentExtractor();
    this.logger = (logger || defaultLogger).scoped('MetadataGenerator');
    // Merge provided options with defaults
    this.options = {
      maxProblems: options?.maxProblems ?? DEFAULT_OPTIONS.maxProblems,
      maxTags: options?.maxTags ?? DEFAULT_OPTIONS.maxTags,
      maxOutcomes: options?.maxOutcomes ?? DEFAULT_OPTIONS.maxOutcomes,
      concurrency: options?.concurrency ?? DEFAULT_OPTIONS.concurrency,
    };
  }

  /**
   * Generate complete metadata for a repository
   * Uses AI to analyze content and generate semantic metadata
   *
   * @param repository Repository to analyze
   * @param options Generation options
   * @param options.extractedContent Optional pre-extracted content (avoids re-extraction)
   * @param options.force Force regeneration even if cached metadata exists
   * @returns Complete metadata including tags, problems, outcomes, and metrics
   */
  async generate(
    repository: Repository,
    options?: {
      extractedContent?: ExtractedRepository;
      force?: boolean;
    },
  ): Promise<ContentMeta> {
    // Return cached metadata if available (unless force is true)
    if (!options?.force) {
      const existing = (repository as any)?.recommendationMetadata as
        | ContentMeta
        | undefined;
      if (existing) return existing;
    }
    // Extract text content from repository structure
    const content: ExtractedRepository =
      options?.extractedContent || (await this.extractor.extract(repository));
    const plainText = this.extractor.toPlainText(content);
    const chunked = this.shouldChunkContent(plainText);
    this.logger.debug(
      `${repository.uid}: extracted ${plainText.length} chars` +
        ` (${content.sections.length} sections, chunked: ${chunked})`,
    );
    // Determine if content needs chunking based on size
    const chunks = chunked
      ? this.extractor.chunk(
          content,
          CHUNKING.MAX_TOKENS,
          CHUNKING.OVERLAP_TOKENS,
        )
      : null;
    // Generate core metadata (problems, tags, outcomes)
    const [problems, tags, outcomes, summaryData] = await this.generateCoreMetadata(
      content,
      plainText,
      chunks,
    );
    this.logger.debug(
      `${repository.uid}: generated ` +
        `${tags.length} tags, ${problems.length} problems, ${outcomes.length} outcomes`,
    );
    if (tags.length === 0) {
      this.logger.warn(
        `${repository.uid}: 0 tags generated! ` +
          `Content length: ${plainText.length}, sections: ${content.sections.length}`,
      );
    }
    // Calculate derived metrics from content and tags
    const metrics = this.calculateMetrics(content, tags);
    // Build final metadata object
    return {
      id: repository.uid,
      name: repository.name,
      // Trim results to configured limits
      problems: problems.slice(0, this.options.maxProblems),
      tags: tags.slice(0, this.options.maxTags),
      learningOutcomes: outcomes.slice(0, this.options.maxOutcomes),
      // Summary and derived data
      difficulty: summaryData.difficulty,
      estimatedDuration: summaryData.estimatedMinutes,
      prerequisites: this.inferPrerequisites(tags),
      // Calculated metrics
      ...metrics,
      // Metadata
      generatedAt: new Date(),
      modelVersion: this.aiProvider.name,
    };
  }

  /**
   * Check if content exceeds token limit and needs chunking
   */
  private shouldChunkContent(plainText: string): boolean {
    const maxChars = CHUNKING.MAX_TOKENS * CHUNKING.CHARS_PER_TOKEN;
    return plainText.length > maxChars;
  }

  /**
   * Generate all core metadata (problems, tags, outcomes, summary)
   * Uses chunking strategy if chunks are provided
   */
  private async generateCoreMetadata(
    content: ExtractedRepository,
    plainText: string,
    chunks: ContentChunk[] | null,
  ): Promise<
    [
      Problem[],
      Tag[],
      LearningOutcome[],
      { difficulty: DifficultyLevel; estimatedMinutes: number },
    ]
  > {
    if (chunks) {
      // Process large content via chunks
      const [problems, tags, outcomes] = await this.generateFromChunks(chunks);
      const summaryData = await this.generateSummaryFromChunks(chunks);
      return [problems, tags, outcomes, summaryData];
    } else {
      // Process small content directly in parallel
      const [problems, tags, outcomes, summaryData] = await Promise.all([
        this.generateProblems(content, plainText),
        this.generateTags(content, plainText),
        this.generateOutcomes(content, plainText),
        this.generateSummary(content, plainText),
      ]);
      return [problems, tags, outcomes, summaryData];
    }
  }

  /**
   * Calculate all derived metrics from content and tags
   */
  private calculateMetrics(
    content: ExtractedRepository,
    tags: Tag[],
  ): {
    contentComplexity: number;
    practicalFocus: number;
    interactivityLevel: number;
  } {
    return {
      contentComplexity: this.calculateContentComplexity(content),
      practicalFocus: this.calculatePracticalFocus(tags),
      interactivityLevel: this.calculateInteractivityLevel(content),
    };
  }

  /**
   * Generate metadata from multiple chunks and aggregate results
   * Processes chunks sequentially to control memory usage and avoid rate limits
   */
  private async generateFromChunks(
    chunks: ContentChunk[],
  ): Promise<[Problem[], Tag[], LearningOutcome[]]> {
    if (!this.aiProvider.generateStructured) return [[], [], []];

    // Accumulate results from all chunks
    const allProblems: Problem[] = [];
    const allTags: Tag[] = [];
    const allOutcomes: LearningOutcome[] = [];

    // Process each chunk sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate all metadata types for this chunk in parallel
      const [problems, tags, outcomes] = await this.generateMetadataForChunk(
        chunk,
      );

      // Accumulate results
      allProblems.push(...problems);
      allTags.push(...tags);
      allOutcomes.push(...outcomes);
    }

    // Deduplicate and aggregate results from all chunks
    return [
      this.aggregateProblems(allProblems),
      this.aggregateTags(allTags),
      this.aggregateOutcomes(allOutcomes),
    ];
  }

  /**
   * Generate all metadata types for a single chunk
   * Processes problems, tags, and outcomes in parallel
   */
  private async generateMetadataForChunk(
    chunk: ContentChunk,
  ): Promise<[Problem[], Tag[], LearningOutcome[]]> {
    const title = chunk.metadata.title || 'Content';
    const content = chunk.content;

    // Build prompts for each metadata type
    const problemPrompt = this.buildChunkPrompt(PROBLEM_PROMPT, title, content);
    const tagPrompt = this.buildChunkPrompt(TAG_PROMPT, title, content);
    const outcomePrompt = this.buildChunkPrompt(OUTCOME_PROMPT, title, content);

    // Generate all types in parallel
    const [problems, tags, outcomes] = await Promise.all([
      this.generateStructuredFromPrompt<{ problems: Problem[] }>(
        problemPrompt,
        TEMPERATURE.PROBLEMS,
      ).then((r) => r?.problems || []),
      this.generateStructuredFromPrompt<{ tags: Tag[] }>(
        tagPrompt,
        TEMPERATURE.TAGS,
      ).then((r) => r?.tags || []),
      this.generateStructuredFromPrompt<{ outcomes: LearningOutcome[] }>(
        outcomePrompt,
        TEMPERATURE.OUTCOMES,
      ).then((r) => r?.outcomes || []),
    ]);

    return [problems, tags, outcomes];
  }

  /**
   * Build prompt for chunk by replacing placeholders
   * Truncates content to MAX_CHUNK_CHARS to stay within token budget
   */
  private buildChunkPrompt(
    template: string,
    title: string,
    content: string,
  ): string {
    const truncated =
      content.length > CHUNKING.MAX_CHUNK_CHARS
        ? content.substring(0, CHUNKING.MAX_CHUNK_CHARS) + '\n\n[Content truncated...]'
        : content;
    return template
      .replace('{{title}}', title)
      .replace('{{content}}', truncated);
  }

  /**
   * Generic structured generation helper
   */
  private async generateStructuredFromPrompt<T>(
    prompt: string,
    temperature: number,
  ): Promise<T | null> {
    if (!this.aiProvider.generateStructured) {
      this.logger.warn('AI provider missing generateStructured');
      return null;
    }
    try {
      return await this.aiProvider.generateStructured<T>(prompt, {
        temperature,
      });
    } catch (error) {
      this.logger.error(
        `generateStructured failed: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /**
   * Generate real-world problems learners can solve with this content
   */
  private async generateProblems(
    content: ExtractedRepository,
    plainText: string,
  ): Promise<Problem[]> {
    const prompt = buildPrompt(PROBLEM_PROMPT, content, plainText);
    const result = await this.generateStructuredFromPrompt<{
      problems: Problem[];
    }>(prompt, TEMPERATURE.PROBLEMS);

    return result?.problems || [];
  }

  /**
   * Generate semantic tags for content categorization
   */
  private async generateTags(
    content: ExtractedRepository,
    plainText: string,
  ): Promise<Tag[]> {
    const prompt = buildPrompt(TAG_PROMPT, content, plainText);
    const result = await this.generateStructuredFromPrompt<{ tags: Tag[] }>(
      prompt,
      TEMPERATURE.TAGS,
    );

    const tags = result?.tags || [];
    return tags.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Generate learning outcomes using Bloom's Taxonomy
   */
  private async generateOutcomes(
    content: ExtractedRepository,
    plainText: string,
  ): Promise<LearningOutcome[]> {
    const prompt = buildPrompt(OUTCOME_PROMPT, content, plainText);
    const result = await this.generateStructuredFromPrompt<{
      outcomes: LearningOutcome[];
    }>(prompt, TEMPERATURE.OUTCOMES);

    return result?.outcomes || [];
  }

  /**
   * Generate difficulty level and duration estimates
   */
  private async generateSummary(
    content: ExtractedRepository,
    plainText: string,
  ): Promise<{
    difficulty: DifficultyLevel;
    estimatedMinutes: number;
  }> {
    const fallback = {
      difficulty: this.inferDifficultyFromContent(content),
      estimatedMinutes: this.estimateDuration(content),
    };
    const prompt = buildPrompt(SUMMARY_PROMPT, content, plainText);
    const result = await this.generateStructuredFromPrompt<{
      difficulty: DifficultyLevel;
      estimatedMinutes: number;
    }>(prompt, TEMPERATURE.SUMMARY);
    return {
      difficulty: result?.difficulty || fallback.difficulty,
      estimatedMinutes: result?.estimatedMinutes || fallback.estimatedMinutes,
    };
  }

  /**
   * Generate summary from multiple chunks and aggregate results
   * Aggregates difficulty (takes highest) and duration (sums all)
   */
  private async generateSummaryFromChunks(chunks: ContentChunk[]): Promise<{
    difficulty: DifficultyLevel;
    estimatedMinutes: number;
  }> {
    if (!this.aiProvider.generateStructured) {
      // Fallback when AI provider doesn't support structured generation
      return {
        difficulty: 'intermediate',
        estimatedMinutes: chunks.length * 20,
      };
    }

    // Difficulty hierarchy for comparison
    const DIFFICULTY_HIERARCHY: DifficultyLevel[] = [
      'beginner',
      'intermediate',
      'advanced',
      'expert',
    ];

    let maxDifficulty: DifficultyLevel = 'beginner';
    let totalMinutes = 0;

    // Process each chunk sequentially
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate summary for this chunk
      const prompt = this.buildChunkPrompt(
        SUMMARY_PROMPT,
        chunk.metadata.title || 'Content',
        chunk.content,
      );
      const summary = await this.generateStructuredFromPrompt<{
        difficulty: DifficultyLevel;
        estimatedMinutes: number;
      }>(prompt, TEMPERATURE.SUMMARY);

      // Track highest difficulty encountered
      if (summary?.difficulty) {
        const currentIndex = DIFFICULTY_HIERARCHY.indexOf(summary.difficulty);
        const maxIndex = DIFFICULTY_HIERARCHY.indexOf(maxDifficulty);
        if (currentIndex > maxIndex) {
          maxDifficulty = summary.difficulty;
        }
      }

      // Sum up duration estimates
      totalMinutes += summary?.estimatedMinutes || 0;
    }

    return {
      difficulty: maxDifficulty,
      // Fallback to 15 min per chunk if no estimates
      estimatedMinutes: totalMinutes || chunks.length * 15,
    };
  }

  /**
   * Aggregate tags from multiple chunks
   * Merges tags by name, sums weights, and normalizes to 0-1 range
   */
  private aggregateTags(allTags: Tag[]): Tag[] {
    // Merge duplicate tags by name
    const tagMap = new Map<string, Tag>();

    for (const tag of allTags) {
      const existing = tagMap.get(tag.name);

      if (!existing) {
        // First occurrence - add to map
        tagMap.set(tag.name, { ...tag });
      } else {
        // Duplicate - merge weights and section IDs
        existing.weight += tag.weight;
        if (tag.sectionIds) {
          existing.sectionIds = [
            ...new Set([...(existing.sectionIds || []), ...tag.sectionIds]),
          ];
        }
      }
    }

    // Normalize weights to 0-1 range
    const tags = Array.from(tagMap.values());
    const maxWeight = Math.max(...tags.map((t) => t.weight), 1);

    for (const tag of tags) {
      tag.weight = Math.round((tag.weight / maxWeight) * 100) / 100;
    }

    // Sort by weight descending
    return tags.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Aggregate problems from multiple chunks
   * Deduplicates by title (case-insensitive) and merges sectionIds
   */
  private aggregateProblems(allProblems: Problem[]): Problem[] {
    const problemMap = new Map<string, Problem>();

    for (const problem of allProblems) {
      const key = problem.title.toLowerCase().trim();
      const existing = problemMap.get(key);

      if (!existing) {
        // First occurrence - add to map
        problemMap.set(key, { ...problem });
      } else {
        // Duplicate - merge section IDs
        if (problem.sectionIds) {
          existing.sectionIds = [
            ...new Set([...(existing.sectionIds || []), ...problem.sectionIds]),
          ];
        }
      }
    }
    return Array.from(problemMap.values());
  }

  /**
   * Aggregate learning outcomes from multiple chunks
   * Deduplicates by description prefix + Bloom level and merges sectionIds
   */
  private aggregateOutcomes(allOutcomes: LearningOutcome[]): LearningOutcome[] {
    const outcomeMap = new Map<string, LearningOutcome>();

    for (const outcome of allOutcomes) {
      // Use first 50 chars of description + bloom level as key
      const desc = outcome.description.toLowerCase().substring(0, 50);
      const key = `${desc}-${outcome.bloomLevel}`;
      const existing = outcomeMap.get(key);

      if (!existing) {
        // First occurrence - add to map
        outcomeMap.set(key, { ...outcome });
      } else {
        // Duplicate - merge section IDs
        if (outcome.sectionIds) {
          existing.sectionIds = [
            ...new Set([...(existing.sectionIds || []), ...outcome.sectionIds]),
          ];
        }
      }
    }

    return Array.from(outcomeMap.values());
  }

  /**
   * Infer prerequisites from tag hierarchy (parent tags become prerequisites)
   */
  private inferPrerequisites(tags: Tag[]): Prerequisite[] {
    const prerequisites: Prerequisite[] = [];
    const conceptTags = tags.filter(
      (t) => t.category === 'concept' || t.category === 'tool',
    );
    for (const tag of conceptTags) {
      // If tag has a parent, the parent is likely a prerequisite
      if (tag.parent) {
        const existing = prerequisites.find((p) => p.tag === tag.parent);
        if (!existing) {
          prerequisites.push({
            tag: tag.parent,
            importance: tag.weight * 0.8,
            description: `Understanding of ${tag.parent} concepts`,
          });
        }
      }
    }
    // Sort by importance
    return prerequisites
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
  }

  /**
   * Estimate duration based on word count and section count
   */
  private estimateDuration(content: ExtractedRepository): number {
    const WORDS_PER_MINUTE = 200; // Average reading speed
    const MINUTES_PER_SECTION = 2; // Time for activities/interactions
    const readingTime = Math.ceil(
      (content.totalWordCount || 0) / WORDS_PER_MINUTE,
    );
    const interactiveTime = content.sections.length * MINUTES_PER_SECTION;
    return readingTime + interactiveTime;
  }

  /**
   * Infer difficulty from average words per section
   */
  private inferDifficultyFromContent(
    content: ExtractedRepository,
  ): DifficultyLevel {
    const sectionCount = content.sections.length;
    if (sectionCount === 0) return 'beginner';
    const avgWordsPerSection = (content.totalWordCount || 0) / sectionCount;
    if (avgWordsPerSection < 300) return 'beginner';
    if (avgWordsPerSection < 600) return 'intermediate';
    if (avgWordsPerSection < 1000) return 'advanced';
    return 'expert';
  }

  /**
   * Calculate content complexity score (0-1) based on size and structure
   */
  private calculateContentComplexity(content: ExtractedRepository): number {
    const MAX_WORDS = 10000; // Words for max complexity
    const MAX_SECTIONS = 20; // Sections for max complexity
    const wordComplexity = Math.min(
      (content.totalWordCount || 0) / MAX_WORDS,
      1,
    );
    const structureComplexity = Math.min(
      content.sections.length / MAX_SECTIONS,
      1,
    );
    return (wordComplexity + structureComplexity) / 2;
  }

  /**
   * Calculate practical vs theoretical focus (0-1, higher = more practical)
   */
  private calculatePracticalFocus(tags: Tag[]): number {
    const sumWeight = (category: string) =>
      tags
        .filter((t) => t.category === category)
        .reduce((sum, t) => sum + t.weight, 0);
    const skillWeight = sumWeight('skill');
    const conceptWeight = sumWeight('concept');
    const totalWeight = skillWeight + conceptWeight;
    return totalWeight === 0 ? 0.5 : skillWeight / totalWeight;
  }

  /**
   * Calculate interactivity level (0-1)
   * Ratio of interactive elements to total elements
   * Higher values indicate more hands-on, engaging content
   */
  private calculateInteractivityLevel(content: ExtractedRepository): number {
    let interactiveCount = 0;
    let totalCount = 0;

    // Recursively count elements in section tree
    const countInSection = (section: ExtractedSection) => {
      for (const element of section.elements) {
        totalCount++;
        if (INTERACTIVE_ELEMENT_TYPES.includes(element.type as any)) {
          interactiveCount++;
        }
      }
      // Process nested sections
      for (const child of section.children || []) {
        countInSection(child);
      }
    };

    // Count across all top-level sections
    for (const section of content.sections) {
      countInSection(section);
    }

    return totalCount > 0 ? interactiveCount / totalCount : 0;
  }

  /**
   * Batch generate metadata for multiple repositories with concurrency control
   * @param repositories Repositories to generate metadata for
   * @param options Batch generation options
   * @param options.onProgress Progress callback (completed, total)
   * @param options.force Force regeneration even if cached metadata exists
   */
  async generateBatch(
    repositories: Repository[],
    options?: {
      onProgress?: (completed: number, total: number) => void;
      force?: boolean;
    },
  ): Promise<Map<string, ContentMeta>> {
    const results = new Map<string, ContentMeta>();
    const total = repositories.length;
    let completed = 0;
    // Process with limited concurrency
    const queue = [...repositories];
    const workers: Promise<void>[] = [];
    for (let i = 0; i < this.options.concurrency; i++) {
      workers.push(
        (async () => {
          while (queue.length > 0) {
            const repo = queue.shift();
            if (!repo) break;
            try {
              const metadata = await this.generate(repo, { force: options?.force });
              results.set(repo.uid, metadata);
            } catch (error) {
              this.logger.error(
                `Failed to generate metadata for ${repo.uid}: ` +
                  `${error instanceof Error ? error.message : error}`,
              );
            }
            completed++;
            options?.onProgress?.(completed, total);
          }
        })(),
      );
    }
    await Promise.all(workers);
    return results;
  }
}
