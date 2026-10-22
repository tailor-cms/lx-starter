/**
 * Recommendations DTOs
 *
 * Data Transfer Objects for personalized content recommendations,
 * related content discovery, and continue learning features.
 * Maps to garment's ProfileMatcher and getContinueLearning outputs.
 *
 * @module learning/dto/recommendations
 */
import {
  ACTIVITY_ACTIONS,
  CONTENT_NODE_TYPES,
  DIFFICULTY_LEVELS,
  RELATIONSHIP_TYPES,
  type ActivityAction,
  type ContentNodeType,
  type DifficultyLevel,
  type RelationshipType,
} from '@tailor-cms/garment';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { oneLine } from 'common-tags';

/**
 * Query parameters for fetching personalized recommendations.
 * Controls the ProfileMatcher behavior for generating content recommendations
 * based on the learner's profile affinities, visit history, and goals.
 *
 * @example <caption>Top 5 recommendations with recency boost</caption>
 * GET /learning/recommendations?limit=5&boostRecent=true&recentDays=14
 *
 * @example <caption>In-progress content without recency boost</caption>
 * GET /learning/recommendations?onlyInProgress=true&boostRecent=false
 */
export class RecommendationsQueryDto {
  @ApiProperty({
    description: oneLine`
      Maximum number of recommendations to return,
      sorted by relevance score (highest first)
    `,
    example: 10,
    default: 10,
    required: false,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiProperty({
    description: oneLine`
      Include repositories the learner has completed (progress=100).
      Disabled by default to focus on new learning opportunities
    `,
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCompleted?: boolean;

  @ApiProperty({
    description: oneLine`
      Only show repositories the learner has started (has visit history).
      Useful for "resume learning" focused recommendations
    `,
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  onlyInProgress?: boolean;

  @ApiProperty({
    description: oneLine`
      Boost relevance score for content with recent interactions.
      Recent activity signals active interest and learning momentum
    `,
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  boostRecent?: boolean;

  @ApiProperty({
    description: oneLine`
      Weight multiplier for recency boost (0-1). Higher values prioritize
      recent activity over pure profile match quality
    `,
    example: 0.2,
    default: 0.2,
    required: false,
    minimum: 0,
    maximum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  recentBoostWeight?: number;

  @ApiProperty({
    description: oneLine`
      Number of days to consider for "recent" interactions.
      Activity older than this threshold receives no recency boost
    `,
    example: 30,
    default: 30,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  recentDays?: number;
}

/**
 * Matched repository suggestion.
 *
 * Represents a repository matched via profile affinity or content similarity.
 * Used for personalized recommendations and "more like this" discovery.
 * Maps to garment's `RelatedContent` type from ProfileMatcher.
 *
 * @example <caption>Content that builds on source material</caption>
 * {
 *   id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   name: 'Advanced Portfolio Management',
 *   score: 78,
 *   reason: 'Builds on the concepts introduced in this content',
 *   relationship: 'builds-on',
 *   sharedTags: ['portfolio', 'investment-strategy'],
 *   sharedProblems: ['portfolio-rebalancing'],
 *   sectionId: '4h7ac10b-58cc-4372-a567-0e02b2c3d432'
 * }
 *
 * @example <caption>Prerequisite content to complete first</caption>
 * {
 *   id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
 *   name: 'Investment Fundamentals',
 *   score: 92,
 *   reason: 'Required background knowledge for this content',
 *   relationship: 'prerequisite',
 *   sharedTags: ['investing-basics', 'financial-literacy'],
 *   sharedProblems: []
 * }
 */
export class RepositoryMatchDto {
  @ApiProperty({
    description: 'Unique repository identifier',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'Repository display name',
    example: 'Advanced Portfolio Management',
  })
  name: string;

  @ApiProperty({
    description: oneLine`
      Similarity/relevance score (0-100). Higher scores indicate stronger
      semantic relationship. Typical range for good matches: 50-95
    `,
    example: 78,
    minimum: 0,
    maximum: 100,
  })
  score: number;

  @ApiProperty({
    description: oneLine`
      Human-readable explanation of why this content is related.
      Generated based on relationship type and shared attributes
    `,
    example: 'Builds on the concepts introduced in this content',
  })
  reason: string;

  @ApiProperty({
    description: 'Semantic relationship type between source and target content',
    example: 'builds-on',
    enum: RELATIONSHIP_TYPES,
  })
  relationship: RelationshipType;

  @ApiProperty({
    description: oneLine`
      Tag names shared between source and target repositories,
      indicating topical overlap
    `,
    example: ['portfolio', 'investment-strategy', 'asset-allocation'],
    type: [String],
  })
  sharedTags: string[];

  @ApiProperty({
    description: oneLine`
      Problem IDs that both repositories address,
      indicating similar practical applications
    `,
    example: ['portfolio-rebalancing', 'risk-assessment'],
    type: [String],
  })
  sharedProblems: string[];

  @ApiProperty({
    description: oneLine`
      Best matching section (activity) id in the target repository.
      Useful for deep-linking to the most relevant content section
    `,
    example: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
    required: false,
  })
  sectionId?: string;
}

/**
 * Recommendations response envelope.
 *
 * Wraps the list of personalized recommendations with metadata about
 * the query execution. Used as the response type for recommendation endpoints.
 *
 * @example <caption>Response with 2 matches</caption>
 * {
 *   recommendations: [
 *     {
 *       id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *       name: 'Advanced Portfolio Management',
 *       score: 87,
 *       reason: 'Matches your interest in investment strategies',
 *       relationship: 'similar-topic',
 *       sharedTags: ['portfolio', 'investment-strategy'],
 *       sharedProblems: ['portfolio-rebalancing']
 *     },
 *     {
 *       id: 'c3d4e5f6-a7b8-4901-cdef-012345678901',
 *       name: 'Risk Assessment Fundamentals',
 *       score: 72,
 *       reason: 'Complements your learning in portfolio management',
 *       relationship: 'complement',
 *       sharedTags: ['risk-management'],
 *       sharedProblems: ['risk-assessment']
 *     }
 *   ],
 *   count: 2,
 *   totalRepositories: 45,
 *   generatedAt: '2025-01-15T10:30:00.000Z'
 * }
 */
export class RecommendationsDto {
  @ApiProperty({
    description: oneLine`
      Ordered list of recommended content,
      sorted by relevance score (highest first)
    `,
    type: [RepositoryMatchDto],
  })
  recommendations: RepositoryMatchDto[];

  @ApiProperty({
    description: oneLine`
      Number of recommendations returned. May be less than requested limit
      if fewer matches meet the minimum score threshold
    `,
    example: 10,
  })
  count: number;

  @ApiProperty({
    description: oneLine`
      Total repositories analyzed during recommendation generation.
      Useful for understanding content catalog coverage
    `,
    example: 45,
  })
  totalRepositories: number;

  @ApiProperty({
    description: 'ISO 8601 timestamp when recommendations were generated',
    example: '2025-01-15T10:30:00.000Z',
  })
  generatedAt: string;
}

/**
 * Query parameters for "more like this" endpoint.
 *
 * Controls related content discovery based on a source repository.
 * Can optionally narrow matching to a specific section for precision.
 *
 * @example <caption>Related to entire repository</caption>
 * GET /learning/similar/f47ac10b-58cc-4372-a567-0e02b2c3d479?limit=5
 *
 * @example <caption>Related to specific section</caption>
 * GET /learning/similar/f47ac10b-58cc-4372-a567-0e02b2c3d479
 *     ?sectionId=b2c3d4e5-f6a7-4890-bcde-f01234567890&limit=3
 */
export class LikeThisQueryDto {
  @ApiProperty({
    description: oneLine`
      Section (activity) id for section-level matching. When provided,
      recommendations are based on section tags rather than full repository
    `,
    example: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({
    description: oneLine`
      Maximum number of related content suggestions to return,
      sorted by similarity score (highest first)
    `,
    example: 5,
    default: 5,
    required: false,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

/**
 * Query parameters for "continue learning" endpoint.
 * Controls the getContinueLearning query which returns content the learner
 * has started but not finished, sorted by most recently visited.
 *
 * @example <caption>3 most recent unfinished items</caption>
 * GET /learning/continue?limit=3
 *
 * @example <caption>Include completed items</caption>
 * GET /learning/continue?limit=10&includeCompleted=true
 */
export class ContinueLearningQueryDto {
  @ApiProperty({
    description: oneLine`
      Maximum number of items to return,
      sorted by last visit timestamp (most recent first)
    `,
    example: 5,
    default: 5,
    required: false,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;

  @ApiProperty({
    description: oneLine`
      Include items the learner has completed (progress=100).
      Disabled by default to focus on unfinished content
    `,
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCompleted?: boolean;
}

/**
 * A content item the learner should continue.
 *
 * Aggregates visit data per repository to show resume points.
 * Maps to garment's `ContinueLearningItem` type from getContinueLearning.
 *
 * @example <caption>In-progress content at 65%</caption>
 * {
 *   repositoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   nodeId: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
 *   nodeType: 'activity',
 *   title: 'Understanding Asset Allocation',
 *   thumbnail: 'https://cdn.example.com/thumbnails/asset-allocation.jpg',
 *   lastAction: 'view',
 *   lastVisitedAt: '2025-01-15T10:30:00.000Z',
 *   totalTimeSpent: 720000,
 *   progress: 65,
 *   difficulty: 'intermediate',
 *   tags: ['asset-allocation', 'portfolio', 'diversification']
 * }
 *
 * @example <caption>Bookmarked but not started</caption>
 * {
 *   repositoryId: 'c3d4e5f6-a7b8-4901-cdef-012345678901',
 *   nodeId: 'd4e5f6a7-b8c9-4012-def0-123456789012',
 *   nodeType: 'activity',
 *   title: 'Introduction to Investing',
 *   lastAction: 'bookmark',
 *   lastVisitedAt: '2025-01-10T08:15:00.000Z',
 *   totalTimeSpent: 30000,
 *   progress: 5,
 *   difficulty: 'beginner',
 *   tags: ['investing-basics', 'getting-started']
 * }
 */
export class ContinueLearningItemDto {
  @ApiProperty({
    description: 'Parent repository identifier',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  repositoryId: string;

  @ApiProperty({
    description: oneLine`
      Most recent content node visited within this repository.
      This is the suggested resume point for the learner
    `,
    example: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
  })
  nodeId: string;

  @ApiProperty({
    description: 'Content title',
    example: 'Understanding Asset Allocation',
  })
  title: string;

  @ApiProperty({
    description: 'Thumbnail image URL',
    example: 'https://cdn.example.com/thumbnails/asset-allocation.jpg',
    required: false,
  })
  thumbnail?: string;

  @ApiProperty({
    description: 'Content node type',
    example: 'activity',
    enum: CONTENT_NODE_TYPES,
  })
  nodeType: ContentNodeType;

  @ApiProperty({
    description: oneLine`
      Last action: view=visited, complete=finished,
      bookmark=saved, skip=intentionally skipped
    `,
    example: 'view',
    enum: ACTIVITY_ACTIONS,
  })
  lastAction: ActivityAction;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the most recent visit to this content',
    example: '2025-01-15T10:30:00.000Z',
  })
  lastVisitedAt: string;

  @ApiProperty({
    description:
      'Total time spent across all visits in milliseconds (720000 = 12 min)',
    example: 720000,
  })
  totalTimeSpent: number;

  @ApiProperty({
    description: oneLine`
      Progress percentage (0-100). 100 indicates completion;
      otherwise reflects max scroll depth or element completion percentage
    `,
    example: 65,
    minimum: 0,
    maximum: 100,
  })
  progress: number;

  @ApiProperty({
    description: 'Content difficulty level',
    example: 'intermediate',
    enum: DIFFICULTY_LEVELS,
  })
  difficulty: DifficultyLevel;

  @ApiProperty({
    description: 'Content tags captured at time of visit',
    example: ['asset-allocation', 'portfolio', 'diversification'],
    type: [String],
  })
  tags: string[];
}

/**
 * Continue learning response envelope.
 *
 * Wraps the list of content items the learner should continue with metadata.
 * Maps to garment's `ContinueLearningResult` type.
 *
 * @example <caption>2 in-progress items sorted by recency</caption>
 * {
 *   items: [
 *     {
 *       repositoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *       nodeId: 'b2c3d4e5-f6a7-4890-bcde-f01234567890',
 *       title: 'Understanding Asset Allocation',
 *       nodeType: 'activity',
 *       lastAction: 'view',
 *       lastVisitedAt: '2025-01-15T10:30:00.000Z',
 *       totalTimeSpent: 720000,
 *       progress: 65,
 *       difficulty: 'intermediate',
 *       tags: ['asset-allocation', 'portfolio']
 *     },
 *     {
 *       repositoryId: 'c3d4e5f6-a7b8-4901-cdef-012345678901',
 *       nodeId: 'd4e5f6a7-b8c9-4012-def0-123456789012',
 *       title: 'Introduction to Investing',
 *       nodeType: 'activity',
 *       lastAction: 'bookmark',
 *       lastVisitedAt: '2025-01-10T08:15:00.000Z',
 *       totalTimeSpent: 30000,
 *       progress: 5,
 *       difficulty: 'beginner',
 *       tags: ['investing-basics']
 *     }
 *   ],
 *   count: 2,
 *   generatedAt: '2025-01-15T10:30:00.000Z'
 * }
 *
 * @example <caption>Empty response (no in-progress content)</caption>
 * {
 *   items: [],
 *   count: 0,
 *   generatedAt: '2025-01-15T10:30:00.000Z'
 * }
 */
export class ContinueLearningDto {
  @ApiProperty({
    description: oneLine`
      Ordered list of content to continue,
      sorted by most recently visited first
    `,
    type: [ContinueLearningItemDto],
  })
  items: ContinueLearningItemDto[];

  @ApiProperty({
    description: oneLine`
      Number of items returned. May be less than requested limit
      if learner has fewer in-progress items
    `,
    example: 2,
  })
  count: number;

  @ApiProperty({
    description: 'ISO 8601 timestamp when this response was generated',
    example: '2025-01-15T10:30:00.000Z',
  })
  generatedAt: string;
}
