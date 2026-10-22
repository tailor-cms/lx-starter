import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * Catalog entry DTO matching CatalogEntry from @tailor-cms/garment.
 * Represents a content package summary in the catalog listing.
 * Contains basic metadata without the full structure. Use the
 * repository endpoint (/content/:id) for complete details.
 *
 * @example
 * {
 *   id: 1,
 *   uid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   schema: 'COURSE',
 *   name: 'Introduction to Programming',
 *   description: 'Learn the basics',
 *   publishedAt: '2024-01-15T10:30:00Z'
 * }
 */
@Exclude()
export class CatalogEntryDto {
  @Expose()
  @ApiProperty({ description: 'Repository ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Repository UID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  uid: string;

  @Expose()
  @ApiProperty({ description: 'Content schema identifier', example: 'COURSE' })
  schema: string;

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
    description: 'Publication timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  publishedAt: string;

  @Expose()
  @ApiProperty({
    description: 'Detachment timestamp',
    example: null,
    required: false,
  })
  detachedAt?: string;
}
