import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Learning goal type enum
 */
export type LearningGoalType = 'problem' | 'outcome';

/**
 * Section node for navigation
 */
export class SectionNodeDto {
  @ApiProperty({
    description: 'Section ID (uid)',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  id: string;

  @ApiProperty({
    description: 'Schema type (e.g., module, lesson, page)',
    example: 'lesson',
  })
  type: string;

  @ApiProperty({
    description: 'Entity type (e.g., Activity, Repository)',
    example: 'Activity',
  })
  entity: string;

  @ApiPropertyOptional({
    description: 'Section name',
    example: 'Introduction to CSS Grid',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Parent section (e.g., module containing a lesson)',
    type: () => SectionNodeDto,
  })
  parent?: SectionNodeDto;
}

/**
 * Individual learning goal item (problem or outcome)
 */
export class LearningGoalItemDto {
  @ApiProperty({
    description: 'Unique identifier for the learning goal',
    example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  })
  id: string;

  @ApiProperty({
    description: 'Type of learning goal',
    example: 'problem',
    enum: ['problem', 'outcome'],
  })
  type: LearningGoalType;

  @ApiProperty({
    description: 'Title or description of the learning goal',
    example: 'Build a responsive dashboard layout using CSS Grid',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description (for problems)',
    example: 'Apply CSS Grid and Flexbox techniques to create a responsive...',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Category (problem.category or outcome.bloomLevel)',
    example: 'web-development',
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level (for problems)',
    example: 'intermediate',
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
  })
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Required skills (for problems)',
    example: ['css', 'html', 'responsive-design'],
    type: [String],
  })
  requiredSkills?: string[];

  @ApiProperty({
    description: 'Repository uid for navigation',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  repositoryId: string;

  @ApiProperty({
    description: 'Repository name for display',
    example: 'Advanced CSS Techniques',
  })
  repositoryName: string;

  @ApiPropertyOptional({
    description: 'Resolved section nodes for navigation (all sectionIds resolved)',
    type: [SectionNodeDto],
  })
  sections?: SectionNodeDto[];
}

/**
 * Query parameters for filtering learning goals
 */
export class LearningGoalsQueryDto {
  @ApiPropertyOptional({
    description: 'Search query to filter learning goals',
    example: 'responsive',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by type (problem or outcome)',
    example: 'problem',
    enum: ['problem', 'outcome'],
  })
  @IsOptional()
  @IsString()
  type?: LearningGoalType;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 50,
    default: 100,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Response DTO for learning goals endpoint
 */
export class LearningGoalsResponseDto {
  @ApiProperty({
    description: 'List of learning goal items',
    type: [LearningGoalItemDto],
  })
  items: LearningGoalItemDto[];

  @ApiProperty({
    description: 'Total number of problems across all repositories',
    example: 45,
  })
  totalProblems: number;

  @ApiProperty({
    description: 'Total number of learning outcomes across all repositories',
    example: 78,
  })
  totalOutcomes: number;
}
