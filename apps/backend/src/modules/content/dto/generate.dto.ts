import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Request DTO for AI content generation.
 * Used by the /content/generate endpoint for AI text completion.
 *
 * @example
 * { prompt: 'Explain the concept of machine learning in simple terms' }
 */
export class GenerateRequestDto {
  @ApiProperty({
    description: 'The prompt to send to the AI',
    example: 'Explain the concept of machine learning in simple terms',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

/**
 * Response DTO for AI content generation.
 * Contains the AI-generated text response from the completion request.
 *
 * @example
 * {
 *   response: 'Machine learning is a type of artificial intelligence that...'
 * }
 */
export class GenerateResponseDto {
  @ApiProperty({
    description: 'Generated text response from AI',
    example: 'Machine learning is a type of artificial intelligence...',
  })
  response!: string;
}
