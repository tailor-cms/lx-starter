import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityDto } from './activity.dto';

/**
 * Repository DTO matching Repository from @tailor-cms/garment.
 * Represents a complete content package with its full structure.
 * Contains the activity outline with all nested containers and elements.
 * This is the root entity of the content hierarchy.
 *
 * Hierarchy: Repository → Activity → ContentContainer → ContentElement
 *
 * @example
 * {
 *   id: 1,
 *   uid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   schema: 'COURSE',
 *   name: 'Introduction to Programming',
 *   structure: [{ type: 'MODULE', contentContainers: [...] }]
 * }
 */
@Exclude()
export class RepositoryDto {
  @Expose()
  @ApiProperty({ description: 'Repository id', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Repository uid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  uid: string;

  @Expose()
  @ApiProperty({ description: 'Content schema identifier', example: 'COURSE' })
  schema: string;

  @Expose()
  @ApiProperty({ description: 'Schema version', example: '1.0.0' })
  version: string;

  @Expose()
  @ApiProperty({
    description: 'Repository name',
    example: 'Introduction to Programming',
  })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'Repository description',
    example: 'Learn the basics of programming',
  })
  description: string;

  @Expose()
  @ApiProperty({
    description: 'Repository metadata, defined by the content schema',
    example: {},
  })
  meta: Record<string, any>;

  @Expose()
  @ApiProperty({
    description: 'Repository structure (activities/modules)',
    type: [ActivityDto],
  })
  @Type(() => ActivityDto)
  structure: ActivityDto[];

  @Expose()
  @ApiProperty({ description: 'Human-readable total size', example: '2.5 MB' })
  size: string;

  @Expose()
  @ApiProperty({ description: 'Publication timestamp' })
  publishedAt: Date;
}
