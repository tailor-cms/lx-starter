import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class ElementInteractDto {
  @ApiProperty({
    description: 'Element UID to interact with',
    example: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  })
  @IsString()
  @IsNotEmpty()
  elementUid: string;

  @ApiProperty({
    description: 'Interaction data (e.g., user response)',
    example: { response: 'User answer here' },
  })
  @IsObject()
  data: Record<string, any>;
}

export class ElementInteractResponseDto {
  @ApiProperty({
    description: 'Whether the response is correct',
    example: true,
    required: false,
  })
  isCorrect?: boolean;

  @ApiProperty({
    description: 'User response',
    required: false,
  })
  response?: string;

  @ApiProperty({
    description: 'Whether the element has been submitted',
    example: true,
    required: false,
  })
  isSubmitted?: boolean;

  // Additional state properties from runtime
  [key: string]: any;
}
