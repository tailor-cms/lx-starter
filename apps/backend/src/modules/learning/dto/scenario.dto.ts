import {
  IsString,
  IsArray,
  ValidateNested,
  IsIn,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ScenarioGenerateRequestDto {
  @ApiProperty({
    description: 'The prompt to send to the AI',
    example: 'Generate a client profile for a retirement planning scenario',
  })
  @IsString()
  @IsNotEmpty()
  prompt!: string;
}

export class ScenarioGenerateResponseDto {
  @ApiProperty({
    description: 'Generated text response from AI',
  })
  response!: string;
}

class MessageDto {
  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant'],
    example: 'user',
  })
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty({
    description: 'Content of the message',
    example: 'Hello, I need help with my retirement planning.',
  })
  @IsString()
  content!: string;
}

export class ChatRequestDto {
  @ApiProperty({
    description: 'System prompt defining the AI role',
    example: 'You are a Socratic tutor...',
  })
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @ApiProperty({
    description: 'Conversation history',
    type: [MessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages!: MessageDto[];
}

export class ChatResponseDto {
  @ApiProperty({
    description: 'AI response',
  })
  response!: string;
}

export class RealtimeSessionRequestDto {
  @ApiProperty({
    description: 'System prompt/instructions for the Realtime session',
    example: 'You are a helpful assistant...',
  })
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @ApiProperty({
    description: 'TTS voice for audio output',
    example: 'shimmer',
    required: false,
  })
  @IsString()
  @IsOptional()
  voice?: string;
}

export class RealtimeSessionResponseDto {
  @ApiProperty({
    description: 'Ephemeral client secret for WebRTC connection',
  })
  token!: string;

  @ApiProperty({
    description: 'Token expiration as Unix timestamp',
    example: 1711234567,
  })
  expiresAt!: number;
}
