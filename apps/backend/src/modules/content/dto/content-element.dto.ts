import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * Content element DTO matching ContentElement from @tailor-cms/garment.
 * Elements are the atomic content units: text (TIPTAP_HTML), video (MUX_VIDEO),
 * quizzes (SINGLE_CHOICE, MULTIPLE_CHOICE), PDFs, embeds, etc. They live
 * inside ContentContainers and contain the actual learning content with assets.
 *
 * @example
 * {
 *   id: 1,
 *   uid: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
 *   type: 'MUX_VIDEO',
 *   data: { ... }
 * }
 */
@Exclude()
export class ContentElementDto {
  @Expose()
  @ApiProperty({ description: 'Element ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Element UID',
    example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  })
  uid: string;

  @Expose()
  @ApiProperty({ description: 'Content ID', example: 'content-123' })
  contentId: string;

  @Expose()
  @ApiProperty({
    description:
      'Content signature hash, can be used to differentiate elements',
  })
  contentSignature: string;

  @Expose()
  @ApiProperty({ description: 'Element type', example: 'HTML' })
  type: string;

  @Expose()
  @ApiProperty({ description: 'Position in parent container', example: 1 })
  position: number;

  @Expose()
  @ApiProperty({
    description: 'Element references to other content elements',
    example: {},
  })
  refs: Record<string, any>;

  @Expose()
  @ApiProperty({
    description: 'Element metadata, configurable by schema per element type',
    example: {},
  })
  meta: Record<string, any>;

  @Expose()
  @ApiProperty({
    description: 'Element data including assets',
    example: { assets: {}, content: 'Sample content' },
  })
  data: {
    assets: Record<string, string>;
    [key: string]: any;
  };

  @Expose()
  @ApiProperty({ description: 'Human-readable size', example: '2.5 KB' })
  size: string;

  @Expose()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
