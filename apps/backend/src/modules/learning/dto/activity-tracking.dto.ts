/**
 * Activity Tracking DTOs
 *
 * These DTOs capture user learning activities for profile building.
 *
 * CONTENT HIERARCHY (Tailor CMS):
 *   Repository → Activity → ContentContainer → ContentElement
 *
 * TRACKING GRANULARITY:
 *   - nodeId can be any level (repository, activity, container, or element)
 *   - Typically track at Activity level (lesson/module completion)
 *   - Can track at Element level for fine-grained progress (video %, quiz)
 *
 * @module learning/dto/activity-tracking
 */
import {
  ACTIVITY_ACTIONS,
  DEVICE_TYPES,
  ENTRY_POINTS,
  type ActivityAction,
  type ContentProgressType,
  type DeviceType,
  type EntryPoint,
  type InterestUpdate,
} from '@tailor-cms/garment';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { oneLine } from 'common-tags';
import { Type } from 'class-transformer';

/**
 * Navigation context for the visit.
 *
 * Tracks how the user arrived at the content and their session info.
 * Used for grouping visits within a learning session, understanding
 * navigation patterns, and learning path attribution.
 *
 * @example <caption>User arrived from recommendation</caption>
 * {
 *   sessionId: 'c3d4e5f6-a7b8-4901-cdef-012345678901',
 *   sequenceNumber: 3,
 *   entryPoint: 'recommendation',
 *   referrer: '/recommendations'
 * }
 */
/**
 * Device information for analytics.
 * Captures the device type and browser used for the visit.
 */
export class DeviceInfoDto {
  @ApiProperty({
    description: 'Device type',
    enum: DEVICE_TYPES,
    example: 'desktop',
  })
  @IsIn(DEVICE_TYPES)
  type: DeviceType;

  @ApiPropertyOptional({
    description: 'Browser name',
    example: 'Chrome',
  })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiPropertyOptional({
    description: 'Operating system',
    example: 'macOS',
  })
  @IsOptional()
  @IsString()
  os?: string;
}

export class VisitContextDto {
  @ApiPropertyOptional({
    description: oneLine`
      Client-generated session ID.
      Groups visits in the same browsing session
    `,
    example: 'c3d4e5f6-a7b8-4901-cdef-012345678901',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Visit order within session (1, 2, 3...). Tracks navigation',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  sequenceNumber?: number;

  @ApiPropertyOptional({
    description: 'How user arrived at the content',
    example: 'recommendation',
    enum: ENTRY_POINTS,
  })
  @IsOptional()
  @IsIn(ENTRY_POINTS)
  entryPoint?: EntryPoint;

  @ApiPropertyOptional({
    description: 'Previous page URL or content ID that led here',
    example: 'https://app.example.com/search?q=investing',
  })
  @IsOptional()
  @IsString()
  referrer?: string;

  @ApiPropertyOptional({
    description: 'Learning path ID if user is following a structured path',
    example: 'path-retirement-101',
  })
  @IsOptional()
  @IsString()
  learningPathId?: string;
}

/**
 * Progress for a specific content element type.
 *
 * Used within contentProgress[] to track per-element progress when
 * a container has multiple interactive elements.
 *
 * Element types (from Tailor CMS), e.g.:
 *   - TIPTAP_HTML: Rich text (no progress tracking needed)
 *   - MUX_VIDEO: Video - track percent watched
 *   - PDF: PDF document - track percent/pages viewed
 *   - MULTIPLE_CHOICE / SINGLE_CHOICE: Quiz - use data field
 *
 * @example <caption>Video progress</caption>
 * { elementId: 'video-1', type: 'MUX_VIDEO', percent: 75 }
 *
 * @example <caption>Quiz result</caption>
 * {
 *   elementId: 'quiz-1',
 *   type: 'MULTIPLE_CHOICE',
 *   data: { attempts: 2, correct: true, score: 100 }
 * }
 */
export class ContentProgressEntryDto {
  @ApiProperty({
    description: 'Unique content element identifier',
    example: 'e5f6a7b8-c9d0-4123-ef01-234567890abc',
  })
  @IsString()
  @IsNotEmpty()
  elementId: string;

  @ApiProperty({
    description: 'Content element type from Tailor CMS (MUX_VIDEO, PDF, etc.)',
    example: 'MUX_VIDEO',
  })
  @IsString()
  @IsNotEmpty()
  type: ContentProgressType;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100). Used for video, audio, PDF',
    example: 75,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent?: number;

  @ApiPropertyOptional({
    description: 'Type-specific data. For quizzes: { attempts, correct, score }',
    example: { attempts: 2, correct: true, score: 100, selected: ['0', '2'] },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

/**
 * Engagement signals captured during the visit.
 *
 * Measures how deeply the user engaged with the content:
 *   - scrollDepth: Did they scroll through the whole page?
 *   - interactionCount: Did they click, expand sections, etc.?
 *   - contentProgress: Progress on specific elements (video %, quiz results)
 *
 * Used to calculate engagement velocity and journey stage.
 *
 * @example <caption>High engagement with video and quiz</caption>
 * {
 *   scrollDepth: 100,
 *   interactionCount: 12,
 *   contentProgress: [
 *     { elementId: 'video-1', type: 'MUX_VIDEO', percent: 100 },
 *     { elementId: 'quiz-1', type: 'SINGLE_CHOICE', data: { correct: true } }
 *   ]
 * }
 */
export class VisitEngagementDto {
  @ApiPropertyOptional({
    description: 'How far user scrolled (0-100%). Max value during visit',
    example: 85,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  scrollDepth?: number;

  @ApiPropertyOptional({
    description: 'Number of interactions (clicks, expands) during the visit',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  interactionCount?: number;

  @ApiPropertyOptional({
    description: oneLine`
      Per-element progress tracking. Each entry includes elementId, type,
      and progress data (percent for media, data for quizzes)
    `,
    type: [ContentProgressEntryDto],
    example: [
      { elementId: 'text-1', type: 'TIPTAP_HTML', percent: 100 },
      { elementId: 'video-1', type: 'MUX_VIDEO', percent: 75 },
      {
        elementId: 'quiz-1',
        type: 'SINGLE_CHOICE',
        percent: 100,
        data: { attempts: 1, correct: true },
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentProgressEntryDto)
  contentProgress?: ContentProgressEntryDto[];
}

/**
 * Record a user activity/interaction with content.
 *
 * Called when user:
 *   - Views content (action: 'view')
 *   - Completes content (action: 'complete')
 *   - Bookmarks content (action: 'bookmark')
 *   - Skips content (action: 'skip')
 *
 * The backend uses this to:
 *   1. Update learner profile affinities based on content tags
 *   2. Add to visit history (last 100 visits)
 *   3. Update engagement metrics (velocity, streak, journey stage)
 *
 * @example <caption>Complete a lesson with video and quiz</caption>
 * {
 *   nodeId: 'f6a7b8c9-d0e1-4234-f012-345678901bcd',
 *   action: 'complete',
 *   duration: 300000,
 *   context: { sessionId: '...', entryPoint: 'pathway' },
 *   engagement: {
 *     scrollDepth: 100,
 *     interactionCount: 8,
 *     contentProgress: [
 *       { elementId: 'v1', type: 'MUX_VIDEO', percent: 100 },
 *       { elementId: 'q1', type: 'SINGLE_CHOICE', data: { correct: true } }
 *     ]
 *   }
 * }
 */
export class RecordActivityDto {
  @ApiProperty({
    description:
      'Content node id. Can be repository, activity, container, or element',
    example: 'ae27f684-9cb9-40da-a10f-9d0b1c33d742',
  })
  @IsString()
  @IsNotEmpty()
  nodeId: string;

  @ApiProperty({
    description: oneLine`
      Action: view (started), complete (finished),
      bookmark (saved), skip (passed)
    `,
    enum: ACTIVITY_ACTIONS,
    example: 'complete',
  })
  @IsIn(ACTIVITY_ACTIONS)
  action: ActivityAction;

  @ApiPropertyOptional({
    description: oneLine`
      Time spent in milliseconds.
      Auto-calculated from visit start if not provided
    `,
    example: 300000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Navigation context: session, entry point, referrer',
    type: VisitContextDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => VisitContextDto)
  context?: VisitContextDto;

  @ApiPropertyOptional({
    description: 'Engagement signals: scroll depth, interactions, progress',
    type: VisitEngagementDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => VisitEngagementDto)
  engagement?: VisitEngagementDto;

  @ApiPropertyOptional({
    description: 'Device information: type, browser, OS',
    type: DeviceInfoDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  device?: DeviceInfoDto;
}

/**
 * Submit onboarding survey answers.
 * Raw answer indexes sent to backend for ProfileBuilder processing.
 *
 * @example <caption>User selected interests, experience, and goals</caption>
 * {
 *   answers: { interests: [0, 2], experience: [1], goals: [0] }
 * }
 */
export class SubmitOnboardingDto {
  @ApiProperty({
    description: oneLine`
      Map of questionId to selected answer indexes (0-based).
      ProfileBuilder.build() uses these to compute affinities
    `,
    example: { interests: [0, 2], experience: [1], goals: [0] },
  })
  @IsObject()
  answers: Record<string, number[]>;
}

/**
 * Options for resetting user activity data.
 *
 * Allows selective reset of different parts of the activity profile:
 * - onboarding: Survey answers and completion status
 * - progress: Visit history, engagement metrics, affinities
 *
 * Used during testing phase to allow users/admins to reset their data.
 *
 * @example <caption>Reset everything</caption>
 * { resetOnboarding: true, resetProgress: true }
 */
export class ResetActivityDto {
  @ApiPropertyOptional({
    description: 'Reset onboarding data (survey answers, completion status)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  resetOnboarding?: boolean;

  @ApiPropertyOptional({
    description: oneLine`
      Reset progress data
      (visit history, engagement, affinities, experience level)
    `,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  resetProgress?: boolean;
}

/**
 * Response showing what was reset.
 *
 * @example <caption>Both onboarding and progress reset</caption>
 * {
 *   onboardingReset: true,
 *   progressReset: true,
 *   message: 'Reset onboarding and progress data'
 * }
 */
export class ResetActivityResultDto {
  @ApiProperty({
    description: 'Whether onboarding data was reset',
    example: true,
  })
  onboardingReset: boolean;

  @ApiProperty({
    description: 'Whether progress data was reset',
    example: true,
  })
  progressReset: boolean;

  @ApiProperty({
    description: 'Message describing what was reset',
    example: 'Reset onboarding and progress data',
  })
  message: string;
}

/**
 * Response showing what changed in the profile.
 *
 * @example <caption>Profile updated with 5 affinity changes</caption>
 * {
 *   updated: true,
 *   changesCount: 5,
 *   topChanges: [
 *     {
 *       tag: 'retirement-plans',
 *       oldValue: 0.8,
 *       newValue: 0.85,
 *       delta: 0.05,
 *       source: 'interaction'
 *     }
 *   ]
 * }
 */
export class ProfileUpdateResultDto {
  @ApiProperty({
    description: 'Whether the profile was updated',
    example: true,
  })
  updated: boolean;

  @ApiProperty({
    description: 'Number of tag affinities that changed',
    example: 5,
  })
  changesCount: number;

  @ApiProperty({
    description: 'Top interest updates from this activity',
    example: [
      {
        tag: 'retirement-plans',
        oldValue: 0.8,
        newValue: 0.85,
        delta: 0.05,
        source: 'interaction',
      },
    ],
  })
  topChanges: InterestUpdate[];
}
