/**
 * Courseware Assistant DTOs
 *
 * Data Transfer Objects for the conversational courseware assistant. The
 * assistant answers free-text questions about the courseware, recommends
 * content, and proposes multi-step learning pathways.
 *
 * Conversation state is held by the client and replayed on every request,
 * so the endpoint is stateless and reads only.
 */
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { oneLine } from 'common-tags';

export const MAX_ASSISTANT_MESSAGES = 40;
export const MAX_ASSISTANT_MESSAGE_LENGTH = 4000;

// Kinds of courseware the assistant can surface
export const CoursewareTypes = {
  COURSE: 'COURSE',
  LESSON: 'LESSON',
  PRACTICE: 'PRACTICE',
} as const;

export type CoursewareType =
  (typeof CoursewareTypes)[keyof typeof CoursewareTypes];

/**
 * One turn of the conversation, as replayed by the client.
 */
export class AssistantMessageDto {
  @ApiProperty({
    description: 'Who produced this turn',
    enum: ['user', 'assistant'],
    example: 'user',
  })
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty({
    description: 'Plain-text content of the turn',
    example: 'Build me a pathway for retirement income planning',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_ASSISTANT_MESSAGE_LENGTH)
  text!: string;
}

/**
 * Request body for a courseware assistant turn.
 *
 * @example
 * {
 *   "messages": [
 *     { "role": "user", "text": "What do you have on client trust?" }
 *   ]
 * }
 */
export class AssistantChatRequestDto {
  @ApiProperty({
    description: oneLine`
      Full conversation so far, oldest first, including the new user turn
      as the last entry. The endpoint is stateless; the client owns history.
    `,
    type: [AssistantMessageDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_ASSISTANT_MESSAGES)
  @ValidateNested({ each: true })
  @Type(() => AssistantMessageDto)
  messages!: AssistantMessageDto[];
}

/**
 * A courseware entity the learner can open.
 */
export class AssistantCatalogItemDto {
  @ApiProperty({
    description: 'Repository or activity uid, resolvable via /content/node',
    example: '36da35e9-0f81-4a97-868c-44f21286ce60',
  })
  uid!: string;

  @ApiProperty({
    description: 'Catalog entity kind, used by the client to build the link',
    enum: CoursewareTypes,
    example: 'LESSON',
  })
  type!: CoursewareType;

  @ApiProperty({ description: 'Display title', example: 'Building Emotional Trust' })
  title!: string;

  @ApiProperty({ description: 'Estimated duration in minutes', example: 15 })
  duration!: number;

  @ApiProperty({
    description: 'Thumbnail URL when the content has one',
    required: false,
  })
  thumbnail?: string;

  @ApiProperty({ description: 'uid of the owning repository' })
  repositoryUid!: string;

  @ApiProperty({ description: 'Name of the owning repository' })
  repositoryName!: string;
}

// One step of a proposed pathway: narration plus the content it points at.
export class AssistantPathwayStepDto {
  @ApiProperty({
    description: 'Why this step comes here',
    example: 'First, get the account landscape straight.',
  })
  title!: string;

  @ApiProperty({
    description: 'What the learner takes away from this step',
  })
  description!: string;

  @ApiProperty({
    description: 'The catalog entity this step points at',
    type: AssistantCatalogItemDto,
  })
  item!: AssistantCatalogItemDto;
}

// A proposed multi-step pathway the learner can save to their library.
export class AssistantPathwayDto {
  @ApiProperty({ description: 'Pathway title' })
  title!: string;

  @ApiProperty({
    description: 'Short note on pacing or assumptions, shown under the title',
  })
  note!: string;

  @ApiProperty({ description: 'What the pathway gets the learner to' })
  description!: string;

  @ApiProperty({
    description: 'Ordered steps, each pointing at real catalog content',
    type: [AssistantPathwayStepDto],
  })
  steps!: AssistantPathwayStepDto[];
}

/**
 * The assistant's reply.
 */
export class AssistantReplyDto {
  @ApiProperty({ description: 'Assistant reply, always present' })
  text!: string;

  @ApiProperty({
    description: 'Clarifying questions, when the assistant needs more to go on',
    type: [String],
    required: false,
  })
  questions?: string[];

  @ApiProperty({
    description: 'Courseware content matching the request',
    type: [AssistantCatalogItemDto],
    required: false,
  })
  items?: AssistantCatalogItemDto[];

  @ApiProperty({
    description: 'A proposed pathway the learner can save',
    type: AssistantPathwayDto,
    required: false,
  })
  pathway?: AssistantPathwayDto;

  @ApiProperty({
    description: 'Follow-up prompts offered as chips',
    type: [String],
    required: false,
  })
  suggestions?: string[];
}
