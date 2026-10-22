import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ContentElementDto } from './content-element.dto';

/**
 * Content container DTO matching ContentContainer from @tailor-cms/garment.
 * Containers are the structural units that hold ContentElements (text, video,
 * quizzes) and can be nested (e.g., sections within pages). They live inside
 * Activities and form the page structure of learning content.
 *
 * @example
 * {
 *   id: 1,
 *   uid: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
 *   type: 'PAGE',
 *   elements: [{ type: 'TIPTAP_HTML', ... }, { type: 'MUX_VIDEO', ... }],
 *   containers: []
 * }
 */
@Exclude()
export class ContentContainerDto {
  @Expose()
  @ApiProperty({ description: 'Container ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({
    description: 'Container UID',
    example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  })
  uid: string;

  @Expose()
  @ApiProperty({ description: 'Parent activity ID', example: 1 })
  parentId: number;

  @Expose()
  @ApiProperty({ description: 'Container type', example: 'PAGE' })
  type: string;

  @Expose()
  @ApiProperty({ description: 'Position in parent', example: 1 })
  position: number;

  @Expose()
  @ApiProperty({
    description: 'Publication filename',
    example: 'container.type.json',
  })
  publishedAs: string;

  @Expose()
  @ApiProperty({
    description: 'Container data, defined by the container type',
    example: {},
  })
  data: Record<string, any>;

  @Expose()
  @ApiProperty({
    description: 'Content elements within container',
    type: [ContentElementDto],
  })
  @Type(() => ContentElementDto)
  elements: ContentElementDto[];

  @Expose()
  @ApiProperty({
    description: 'Nested containers (e.g. sections within a page)',
    type: [ContentContainerDto],
  })
  @Type(() => ContentContainerDto)
  containers: ContentContainerDto[];

  @Expose()
  @ApiProperty({ description: 'Human-readable size', example: '15.2 KB' })
  size: string;

  @Expose()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
