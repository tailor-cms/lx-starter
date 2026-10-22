import { ApiProperty } from '@nestjs/swagger';

/**
 * Bulk storage metrics from Garment.
 * Shows compression efficiency of the content cache using zstd compression.
 *
 * @example
 * {
 *   jsonSize: 113152,
 *   compressedSize: 26956,
 *   compressionRatio: '76.2'
 * }
 */
export class BulkStorageDto {
  @ApiProperty({
    description: 'Uncompressed JSON size in bytes',
    example: 113152,
  })
  jsonSize: number;

  @ApiProperty({
    description: 'Compressed storage size in bytes (zstd)',
    example: 26956,
  })
  compressedSize: number;

  @ApiProperty({
    description: 'Compression ratio as percentage',
    example: '76.2',
  })
  compressionRatio: string;
}

/**
 * Aggregate statistics across all content repositories.
 * Provides counts of entities and storage metrics for monitoring
 * and admin dashboard displays.
 *
 * @example
 * {
 *   repositories: 3,
 *   activities: 85,
 *   containers: 44,
 *   elements: 230,
 *   bulk: { jsonSize: 113152, compressedSize: 26956, compressionRatio: '76.2' }
 * }
 */
export class ContentStatsDto {
  @ApiProperty({
    description: 'Total number of repositories',
    example: 3,
  })
  repositories: number;

  @ApiProperty({
    description: 'Total number of activities across all repositories',
    example: 85,
  })
  activities: number;

  @ApiProperty({
    description: 'Total number of content containers',
    example: 44,
  })
  containers: number;

  @ApiProperty({
    description: 'Total number of content elements',
    example: 23,
  })
  elements: number;

  @ApiProperty({
    description: 'Bulk storage metrics (null if no content)',
    type: BulkStorageDto,
    nullable: true,
    required: false,
  })
  bulk?: BulkStorageDto;
}
