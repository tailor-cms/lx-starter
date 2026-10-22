/**
 * Learning Controller
 * Handles learner activity tracking, recommendations, and profile management.
 *
 * @module learning
 */
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { oneLine } from 'common-tags';

import { CurrentUser, Roles } from '@/modules/auth/common';
import {
  ContinueLearningDto,
  ContinueLearningQueryDto,
  LikeThisQueryDto,
  RecommendationsDto,
  RecommendationsQueryDto,
} from './dto/recommendations.dto';
import {
  ElementInteractDto,
  ElementInteractResponseDto,
} from './dto/element-interact.dto';
import {
  ProfileUpdateResultDto,
  RecordActivityDto,
  ResetActivityDto,
  ResetActivityResultDto,
  SubmitOnboardingDto,
} from './dto/activity-tracking.dto';
import { LearningService } from './learning.service';
import { UserRole } from '@/database/entities';

@ApiTags('learning')
@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Post('interaction')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: oneLine`
      Process learner interaction with the content element (Tailor CMS
      content element hook)
    `,
    description: oneLine`
      Processes user interaction with a content element (quiz, drag-drop, etc.)
      and returns updated display state with correctness feedback. Uses
      element-specific server-side runtimes to validate responses.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Interaction processed successfully',
    type: ElementInteractResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Element not found' })
  async interact(
    @Body() dto: ElementInteractDto,
  ): Promise<ElementInteractResponseDto | null> {
    return this.learningService.interact(dto.elementUid, dto.data);
  }

  @Post('activity')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Record content consumption activity',
    description: oneLine`
      Records a user interaction with a content node (repository, activity,
      container, or element). Updates the learner's 6-dimensional affinity
      scores (topic, skill, concept, industry, tool, goal) based on content
      tags and creates a visit entry for analytics. The context.entryPoint
      field tracks how the user discovered the content: search, recommendation,
      browse, pathway, continue, or direct.
    `,
  })
  @ApiResponse({ status: 200, type: ProfileUpdateResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async recordActivity(
    @CurrentUser() currentUser: any,
    @Body() dto: RecordActivityDto,
  ): Promise<ProfileUpdateResultDto> {
    return this.learningService.recordActivity(
      currentUser.id,
      dto.nodeId,
      dto.action,
      dto.duration,
      dto.context,
      dto.engagement,
      dto.device,
    );
  }

  @Post('onboarding')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Initialize learner profile with onboarding survey',
    description: oneLine`
      Processes onboarding survey responses to create the initial learner
      profile. Each answer maps to tag affinities that seed the 6-dimensional
      profile (topic, skill, concept, industry, tool, goal). Also extracts
      experience level and learning goals from relevant questions.
    `,
  })
  @ApiResponse({ status: 200, description: 'Profile initialized' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitOnboarding(
    @CurrentUser() currentUser: any,
    @Body() dto: SubmitOnboardingDto,
  ): Promise<any> {
    return this.learningService.submitOnboarding(currentUser.id, dto.answers);
  }

  @Get('continue')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get in-progress content',
    description: oneLine`
      Returns content the learner has started but not completed, sorted by
      most recent visit. Designed for "Continue Learning" UI sections. Use
      includeCompleted to also return finished items for review purposes.
    `,
  })
  @ApiResponse({ status: 200, type: ContinueLearningDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getContinueLearning(
    @CurrentUser() currentUser: any,
    @Query() query: ContinueLearningQueryDto,
  ): Promise<ContinueLearningDto> {
    return this.learningService.getContinueLearning(currentUser.id, query);
  }

  @Get('recommendations')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get personalized content recommendations',
    description: oneLine`
      Returns content ranked by how well it matches the learner's affinity
      profile. By default excludes completed items and boosts recently-visited
      content. Use includeCompleted to show finished items, onlyInProgress to
      filter to started content, and boostRecent/recentBoostWeight/recentDays
      to control recency scoring.
    `,
  })
  @ApiResponse({ status: 200, type: RecommendationsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecommendations(
    @CurrentUser() currentUser: any,
    @Query() query: RecommendationsQueryDto,
  ): Promise<RecommendationsDto> {
    return this.learningService.getRecommendations(currentUser.id, query);
  }

  @Get('similar/:id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Find similar content',
    description: oneLine`
      Returns content similar to a given repository based on shared tags and
      problems addressed. Results are ranked by overlap score. Use sectionId
      to match against a specific section's tags rather than the full
      repository. Useful for "More Like This" UI sections.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Repository id',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({ status: 200, type: RecommendationsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  async getMoreLikeThis(
    @Param('id') id: string,
    @CurrentUser() currentUser: any,
    @Query() query: LikeThisQueryDto,
  ): Promise<RecommendationsDto> {
    return this.learningService.getMoreLikeThis(currentUser.id, id, query);
  }

  @Delete('activity/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reset user activity (admin)',
    description: oneLine`
      Admin-only endpoint to clear any user's learning data. Set resetOnboarding
      to clear survey responses. Set resetProgress to clear visit history,
      affinities, and engagement metrics. If neither flag is set, resets both.
    `,
  })
  @ApiParam({
    name: 'userId',
    description: 'Target user ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({ status: 200, type: ResetActivityResultDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin only' })
  async resetUserActivity(
    @Param('userId') userId: string,
    @Body() dto: ResetActivityDto,
  ): Promise<ResetActivityResultDto> {
    return this.learningService.resetActivity(userId, dto);
  }
}
