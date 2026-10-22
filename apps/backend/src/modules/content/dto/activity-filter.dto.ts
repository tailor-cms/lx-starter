import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for filtering activities across repositories.
 * Supports filtering by repository, parent, type, and tags. Results are
 * returned as ActivitySearchResultDto with entity and repository context.
 *
 * @example <caption>Filter lessons within a specific module</caption>
 * {
 *  repositoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *  type: 'LESSON',
 *  parentId: 5
 * }
 *
 * @example <caption>Find activities tagged with 'javascript'</caption>
 * { tags: 'javascript', limit: 20 }
 */
export class ActivityFilterQueryDto {
  @ApiPropertyOptional({
    description: 'Repository ID to filter activities by',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsString()
  repositoryId?: string;

  @ApiPropertyOptional({
    description:
      'Activity parent ID to filter by (0 for root-level activities)',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Activity type to filter by',
    example: 'LESSON',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Tag to filter activities by (from recommendation metadata)',
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
 * Search result containing an activity entity with its context.
 * Includes the repository ID for navigation and entity type for disambiguation.
 *
 * @example
 * {
 *   entity: {
 *    uid: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
 *    type: 'LESSON', ...
 *   },
 *   entityType: 'Activity',
 *   repositoryId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 * }
 */
export class ActivitySearchResultDto {
  @ApiProperty({
    description: 'The activity entity',
    type: 'object',
    additionalProperties: true,
  })
  entity: any;

  @ApiProperty({
    description: 'Entity type',
    example: 'Activity',
  })
  entityType: string;

  @ApiProperty({
    description: 'Repository ID that contains this activity',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  repositoryId: string;
}
