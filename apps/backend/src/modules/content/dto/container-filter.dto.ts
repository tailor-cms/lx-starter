import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for filtering content containers across repositories.
 * Supports filtering by repository, type, and tags. Containers hold
 * ContentElements (text, video, quizzes) within an activity structure.
 *
 * @example <caption>Filter page containers in a repository</caption>
 * { repositoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', type: 'PAGE' }
 *
 * @example <caption>Find containers tagged with specific topic</caption>
 * { tags: 'advanced-css', limit: 10 }
 */
export class ContainerFilterQueryDto {
  @ApiPropertyOptional({
    description: 'Repository ID to filter containers by',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsString()
  repositoryId?: string;

  @ApiPropertyOptional({
    description: 'Container parent ID to filter by',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Container type to filter by',
    example: 'TAKEAWAYS',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Tag to filter containers by (from recommendation metadata)',
    example: 'javascript',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return (max 100)',
    example: 20,
    default: 100,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Search result containing a content container entity with its context.
 * Includes the repository ID for navigation and entity type.
 *
 * @example
 * {
 *   entity: {
 *    uid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
 *    type: 'PAGE',
 *    elements: [...]
 *   },
 *   entityType: 'ContentContainer',
 *   repositoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 * }
 */
export class ContainerSearchResultDto {
  @ApiProperty({
    description: 'The content container entity',
    type: 'object',
    additionalProperties: true,
  })
  entity: any;

  @ApiProperty({
    description: 'Entity type',
    example: 'ContentContainer',
  })
  entityType: string;

  @ApiProperty({
    description: 'Repository ID that contains this container',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  repositoryId: string;
}
