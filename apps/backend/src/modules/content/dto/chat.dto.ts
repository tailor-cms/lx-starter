import { IsString, IsArray, ValidateNested, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ChatMessageDto {
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

class ClientProfileDto {
  @ApiProperty({
    description: 'Name of the virtual client',
    example: 'John Smith',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Description/background of the virtual client',
    example: 'A 45-year-old software engineer looking to retire early...',
  })
  @IsString()
  description!: string;
}

/**
 * Request DTO for scenario chat with virtual client.
 * Used for role-play training scenarios where the AI plays a client
 * seeking advice. Includes the client profile and conversation history.
 *
 * @example
 * {
 *   clientProfile: {
 *     name: 'John Smith',
 *     description: 'A 45-year-old engineer planning early retirement'
 *   },
 *   messages: [
 *     { role: 'user', content: 'How can I help you today?' },
 *     { role: 'assistant', content: 'I need advice on retirement planning.' }
 *   ]
 * }
 */
export class ChatRequestDto {
  @ApiProperty({
    description: 'The client profile to role-play as',
    type: ClientProfileDto,
  })
  @ValidateNested()
  @Type(() => ClientProfileDto)
  clientProfile!: ClientProfileDto;

  @ApiProperty({
    description: 'Conversation history',
    type: [ChatMessageDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];
}

/**
 * Response DTO for scenario chat.
 * Contains the AI-generated response as the virtual client and
 * a flag indicating if the conversation has reached a natural conclusion.
 *
 * @example
 * {
 *   response: 'Thank you for the advice, I feel much more confident now.',
 *   completed: true
 * }
 */
export class ChatResponseDto {
  @ApiProperty({
    description: 'AI response as the client',
    example: 'I appreciate you taking the time to meet with me today...',
  })
  response!: string;

  @ApiProperty({
    description: 'Whether the conversation has reached a natural conclusion',
    example: false,
  })
  completed!: boolean;
}
