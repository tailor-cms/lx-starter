import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Tag distribution entry
 */
export class TagDistributionDto {
  @ApiProperty({
    description: 'Tag name',
    example: 'javascript',
  })
  tag: string;

  @ApiProperty({
    description: 'Tag category',
    example: 'topic',
    enum: ['topic', 'skill', 'concept', 'industry', 'tool'],
  })
  category: string;

  @ApiProperty({
    description: 'Number of repositories containing this tag',
    example: 5,
  })
  count: number;
}

/**
 * Category distribution entry
 */
export class CategoryDistributionDto {
  @ApiProperty({
    description: 'Category name',
    example: 'topic',
  })
  category: string;

  @ApiProperty({
    description: 'Number of tags in this category',
    example: 15,
  })
  count: number;
}

/**
 * Difficulty distribution entry
 */
export class DifficultyDistributionDto {
  @ApiProperty({
    description: 'Difficulty level',
    example: 'intermediate',
  })
  level: string;

  @ApiProperty({
    description: 'Number of repositories at this difficulty level',
    example: 8,
  })
  count: number;
}

/**
 * Profiling question option
 */
export class ProfileQuestionOptionDto {
  @ApiProperty({
    description: 'Option text',
    example: 'JavaScript Fundamentals',
  })
  label: string;

  @ApiProperty({
    description: 'Tag affinities for this option',
    example: { javascript: 0.9, programming: 0.7 },
  })
  tagAffinities: Record<string, number>;
}

/**
 * Profiling question with embeds resolved
 */
export class ProfileQuestionDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'q-1',
  })
  id: string;

  @ApiProperty({
    description: 'Question type',
    example: 'multiple',
    enum: ['single', 'multiple'],
  })
  type: 'single' | 'multiple';

  @ApiProperty({
    description: 'Question text',
    example: 'What topics are you interested in learning?',
  })
  question: string;

  @ApiProperty({
    description: 'Question category',
    example: 'interests',
  })
  category: string;

  @ApiProperty({
    description: 'Whether multiple answers can be selected',
    example: true,
  })
  allowMultiple: boolean;

  @ApiProperty({
    description: 'Answer options',
    type: [ProfileQuestionOptionDto],
  })
  options: ProfileQuestionOptionDto[];

  @ApiProperty({
    description: 'Question weight in profiling (0-1)',
    example: 1.0,
  })
  weight: number;
}

/**
 * Force analysis response
 */
export class ForceAnalysisResponseDto {
  @ApiProperty({
    description: 'Whether the operation succeeded',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Status message',
    example: 'Analysis completed successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Number of repositories analyzed',
    example: 5,
  })
  repositoriesAnalyzed?: number;

  @ApiPropertyOptional({
    description: 'Number of tags found',
    example: 42,
  })
  tags?: number;

  @ApiPropertyOptional({
    description: 'Number of profiling questions generated',
    example: 8,
  })
  questions?: number;
}

/**
 * Content analysis response with aggregated data
 */
export class ContentAnalysisDto {
  @ApiProperty({
    description: 'Whether AI analysis has been generated',
    example: true,
  })
  hasAnalysis: boolean;

  @ApiProperty({
    description: 'Number of repositories with AI metadata',
    example: 15,
  })
  analyzedRepositories: number;

  @ApiProperty({
    description:
      'Repository IDs that were included in the aggregated content analysis',
    example: [
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    ],
    type: [String],
  })
  analysisRepositoryIds: string[];

  @ApiProperty({
    description: 'Total number of repositories',
    example: 20,
  })
  totalRepositories: number;

  @ApiProperty({
    description: 'Percentage of repositories analyzed',
    example: 75,
  })
  coveragePercentage: number;

  @ApiProperty({
    description: 'When the analysis was last generated',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  generatedAt: string | null;

  @ApiProperty({
    description: 'Tag distribution across all content',
    type: [TagDistributionDto],
  })
  tagDistribution: TagDistributionDto[];

  @ApiProperty({
    description: 'Category distribution',
    type: [CategoryDistributionDto],
  })
  categoryDistribution: CategoryDistributionDto[];

  @ApiProperty({
    description: 'Difficulty level distribution',
    type: [DifficultyDistributionDto],
  })
  difficultyDistribution: DifficultyDistributionDto[];

  @ApiProperty({
    description: 'Global profiling questions',
    type: [ProfileQuestionDto],
  })
  profilingQuestions: ProfileQuestionDto[];
}
