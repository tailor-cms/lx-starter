import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ContentContainerDto } from './content-container.dto';

/**
 * Activity DTO matching Activity from @tailor-cms/garment.
 * Represents a structural unit of the content repository (e.g., module, lesson).
 * Activities form the hierarchical structure of content and contain
 * ContentContainers which hold the actual learning elements.
 *
 * @example
 * {
 *   id: 1,
 *   uid: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
 *   type: 'MODULE',
 *   parentId: null,
 *   position: 1,
 *   meta: { name: 'Introduction to JavaScript' },
 *   contentContainers: [...]
 * }
 */
@Exclude()
export class ActivityDto {
  @Expose()
  @ApiProperty({ description: 'Activity ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Activity UID',
    example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  })
  uid: string;

  @Expose()
  @ApiProperty({ description: 'Parent activity ID', example: 0 })
  parentId: number;

  @Expose()
  @ApiProperty({ description: 'Activity type', example: 'MODULE' })
  type: string;

  @Expose()
  @ApiProperty({
    description: 'Position in repository (within parent or repository root)',
    example: 1,
  })
  position: number;

  @Expose()
  @ApiProperty({
    description: 'Activity relationships, defined by the repository schema',
    example: {},
  })
  relationships: Record<string, any>;

  @Expose()
  @ApiProperty({
    description: 'Activity metadata, configurable by schema per activity type',
    example: {},
  })
  meta: Record<string, any>;

  @Expose()
  @ApiProperty({
    description: 'Content containers within activity, e.g. pages',
    type: [ContentContainerDto],
  })
  @Type(() => ContentContainerDto)
  contentContainers: ContentContainerDto[];

  @Expose()
  @ApiProperty({ description: 'Human-readable size', example: '150 KB' })
  size: string;

  @Expose()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ description: 'Publication timestamp' })
  publishedAt: Date;
}
