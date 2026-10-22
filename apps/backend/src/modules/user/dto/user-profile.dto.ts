import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { SerializedDimensionalAffinities } from '@tailor-cms/garment';
import { Type } from 'class-transformer';

/**
 * Single onboarding answer
 */
export class OnboardingAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'q-1',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: 'Selected option values',
    example: ['javascript', 'react'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  selectedValues: string[];

  @ApiProperty({
    description: 'Tag affinities for this answer',
    example: { javascript: 0.9, programming: 0.7 },
  })
  @IsObject()
  tagAffinities: Record<string, number>;
}

/**
 * Onboarding survey data (stored format)
 */
export class OnboardingSurveyDto {
  @ApiProperty({
    description: 'Survey question answers',
    type: [OnboardingAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingAnswerDto)
  survey: OnboardingAnswerDto[];

  @ApiProperty({
    description: 'When the onboarding survey was completed',
    example: '2025-01-15T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string | Date;
}

/**
 * User activity data
 */
export class UserActivityDto {
  @ApiProperty({
    description: 'Onboarding survey data',
    type: OnboardingSurveyDto,
    required: false,
  })
  onboarding?: OnboardingSurveyDto;

  @ApiProperty({
    description: '6D affinities by dimension (topic, skill, concept, industry, tool)',
    example: {
      topic: { javascript: { value: 0.85, confidence: 0.6 } },
      skill: { debugging: { value: 0.7, confidence: 0.5 } },
    },
    required: false,
  })
  affinities?: SerializedDimensionalAffinities;

  @ApiProperty({
    description: 'Learner\'s experience/difficulty level',
    example: 'intermediate',
    required: false,
  })
  experienceLevel?: string;

  @ApiProperty({
    description: 'Learning goals',
    example: ['learn async programming', 'build REST APIs'],
    type: [String],
    required: false,
  })
  goals?: string[];

  @ApiProperty({
    description: 'Recently interacted tags (most recent first)',
    example: ['javascript', 'react', 'nodejs'],
    type: [String],
    required: false,
  })
  recentTags?: string[];

  @ApiProperty({
    description: 'When the activity data was last updated',
    example: '2025-01-15T10:30:00.000Z',
  })
  lastUpdatedAt: string | Date;
}

/**
 * User profile response
 */
export class UserProfileDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User activity data',
    type: UserActivityDto,
    nullable: true,
  })
  activity: UserActivityDto | null;
}
