/**
 * Learning Service
 * Handles learner activity tracking, profile updates, and recommendations.
 *
 * @module learning
 */
import {
  type ActivityAction,
  getContinueLearning,
  ProfileBuilder,
} from '@tailor-cms/garment';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import type {
  ContinueLearningDto,
  ContinueLearningQueryDto,
  LikeThisQueryDto,
  RecommendationsDto,
  RecommendationsQueryDto,
} from './dto/recommendations.dto';
import type {
  DeviceInfoDto,
  ProfileUpdateResultDto,
  ResetActivityDto,
  ResetActivityResultDto,
  VisitContextDto,
  VisitEngagementDto,
} from './dto/activity-tracking.dto';
import { ContentElementDto } from '../content/dto';
import { ContentService } from '../content/services/content.service';
import type { ElementInteractResponseDto } from './dto/element-interact.dto';
import { getRuntime } from './elementRegistry';
import { UserService } from '../user/user.service';

@Injectable()
export class LearningService {
  private readonly profileBuilder = new ProfileBuilder();

  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly contentService: ContentService,
  ) {
    this.logger.setContext(LearningService.name);
  }

  /**
   * Record user activity and update profile affinities.
   * Tracks interactions (view, complete, bookmark, skip) with content nodes and
   * updates the learner's 6D affinity scores based on content tags. Creates a
   * visit entry in history for analytics and "continue learning" functionality.
   *
   * Entry points tracked: search, recommendation, browse, pathway, continue,
   * direct
   *
   * @param userId - User id
   * @param nodeId - id of the content node (e.g. repository, activity, el...)
   * @param action - Interaction type: 'view' | 'complete' | 'bookmark' | 'skip'
   * @param duration - Time spent on content in milliseconds
   * @param context - Session context (entryPoint, referrer, learningPathId)
   * @param engagement - Engagement metrics
   * @param device - Device information (type, browser, os, viewport)
   * @returns Summary of profile changes
   */
  async recordActivity(
    userId: string,
    nodeId: string,
    action: ActivityAction,
    duration?: number,
    context?: VisitContextDto,
    engagement?: VisitEngagementDto,
    device?: DeviceInfoDto,
  ): Promise<ProfileUpdateResultDto> {
    this.logger.debug({ userId, nodeId, action }, 'Recording activity');
    const profile = await this.getOrCreateProfile(userId);
    const {
      profile: updated,
      updates,
      visit,
    } = await this.contentService.recordActivity(
      profile,
      nodeId,
      action,
      duration,
      context,
      engagement,
      device,
    );
    await this.userService.saveProfile(userId, updated);
    const logData = {
      userId,
      nodeId,
      action,
      changesCount: updates.length,
      hasVisit: !!visit,
      entryPoint: context?.entryPoint,
    };
    this.logger.debug(logData, 'Activity recorded');
    return {
      updated: updates.length > 0,
      changesCount: updates.length,
      topChanges: updates.slice(0, 5),
    };
  }

  /**
   * Get recently visited content that hasn't been completed.
   * Returns items from the user's visit history that are still in progress,
   * sorted by last visit time. Used to populate "Continue Learning" sections.
   *
   * @param userId - User id
   * @param query - Filtering options (limit, minProgress, maxAge)
   * @returns List of in-progress content items with visit info
   */
  async getContinueLearning(
    userId: string,
    query: ContinueLearningQueryDto,
  ): Promise<ContinueLearningDto> {
    const userProfile = await this.userService.getProfile(userId);
    const profile = userProfile.activity;
    if (!profile) {
      return { items: [], count: 0, generatedAt: new Date().toISOString() };
    }

    const result = getContinueLearning(profile, query);
    this.logger.debug(
      { userId, count: result.count },
      'Continue learning items fetched',
    );
    return {
      items: result.items.map((item) => ({
        ...item,
        lastVisitedAt: item.lastVisitedAt.toISOString(),
      })),
      count: result.count,
      generatedAt: result.generatedAt.toISOString(),
    };
  }

  /**
   * Get personalized content recommendations based on learner profile.
   * Uses affinity scores to rank content by relevance.
   *
   * @param userId - User id
   * @param query.limit - Max recommendations to return (default: 10)
   * @param query.includeCompleted - Include completed repositories (default: false)
   * @param query.onlyInProgress - Only show started repositories (default: false)
   * @param query.boostRecent - Boost recently-interacted content (default: true)
   * @param query.recentBoostWeight - Recency boost multiplier 0-1 (default: 0.2)
   * @param query.recentDays - Days threshold for "recent" (default: 30)
   * @returns Ranked list of recommended content with relevance scores
   */
  async getRecommendations(
    userId: string,
    query: RecommendationsQueryDto,
  ): Promise<RecommendationsDto> {
    this.logger.debug(
      { userId, limit: query.limit },
      'Fetching recommendations',
    );
    const profile = await this.getOrCreateProfile(userId);
    const result = await this.contentService.getRecommendations(profile, query);
    this.logger.debug(
      { userId, count: result.count, total: result.totalRepositories },
      'Recommendations fetched',
    );
    return result;
  }

  /**
   * Get similar content based on tag and problem overlap with a specific
   * repository. Finds content that shares topics, skills, or addresses
   * similar problems.
   *
   * @param userId - User id
   * @param repositoryId - src repository id to find similar content for
   * @param query.sectionId - Narrow to section-level matching (optional)
   * @param query.limit - Max suggestions to return (default: 5)
   * @returns List of similar content ranked by similarity score
   */
  async getMoreLikeThis(
    userId: string,
    repositoryId: string,
    query: LikeThisQueryDto,
  ): Promise<RecommendationsDto> {
    this.logger.debug({ userId, repositoryId }, 'Fetching similar content');
    const profile = await this.getOrCreateProfile(userId);
    const result = await this.contentService.getMoreLikeThis(
      repositoryId,
      profile,
      query,
    );
    this.logger.debug(
      { userId, repositoryId, count: result.items.length },
      'Similar content fetched',
    );
    return result;
  }

  /**
   * Submit onboarding survey and initialize learner profile.
   * Processes survey responses to build garment affinity scores based on
   * selected options and their tag weights. Stores both the raw survey
   * responses and the computed profile.
   *
   * @param userId - User id
   * @param answers - Map of questionId to selected option indexes
   * @returns Updated user profile with onboarding data and computed affinities
   * @throws BadRequestException if profiling questions are not available
   */
  async submitOnboarding(
    userId: string,
    answers: Record<string, number[]>,
  ): Promise<any> {
    this.logger.debug({ userId }, 'Processing onboarding');
    const analysis = await this.contentService.getAnalysis();
    const { profilingQuestions } = analysis;
    if (!profilingQuestions?.length) {
      throw new BadRequestException('Profiling questions not available');
    }
    // Build profile and onboarding data from survey answers
    const { profile, onboarding } = this.profileBuilder.build(
      answers,
      profilingQuestions,
      { id: userId, trackDifficulty: true },
    );
    const serialized = this.profileBuilder.serialize(profile);
    const existing = await this.getOrCreateProfile(userId);
    await this.userService.saveProfile(userId, {
      onboarding: {
        survey: onboarding.survey,
        completedAt: onboarding.completedAt,
      },
      affinities: serialized.affinities!,
      experienceLevel: serialized.experienceLevel,
      goals: serialized.goals,
      recentTags: serialized.recentTags,
      visitHistory: existing?.visitHistory ?? serialized.visitHistory!,
      engagement: existing?.engagement ?? serialized.engagement!,
      lastUpdatedAt: new Date(),
    });
    this.logger.info(
      { userId, questionsAnswered: Object.keys(answers).length },
      'Onboarding completed',
    );
    return this.userService.getProfile(userId);
  }

  /**
   * Reset user activity data (onboarding, progress, or both).
   * Allows selective clearing of learner data for testing or
   * user-requested resets. If neither flag is set, resets both onboarding
   * and progress data.
   *
   * - Onboarding reset: Clears survey responses, requires re-onboarding
   * - Progress reset: Clears visit history, affinities, engagement metrics,
   *   experience level, goals, and recent tags
   *
   * @param userId - User id
   * @param options - Reset flags (resetOnboarding, resetProgress)
   * @returns Confirmation of what was reset
   */
  async resetActivity(
    userId: string,
    options: ResetActivityDto,
  ): Promise<ResetActivityResultDto> {
    const { resetOnboarding = false, resetProgress = false } = options;
    const resetBoth = !resetOnboarding && !resetProgress;
    const doResetOnboarding = resetOnboarding || resetBoth;
    const doResetProgress = resetProgress || resetBoth;

    this.logger.debug(
      { userId, onboarding: doResetOnboarding, progress: doResetProgress },
      'Resetting activity',
    );

    const userProfile = await this.userService.getProfile(userId);
    const activity: Record<string, any> = { ...(userProfile.activity || {}) };

    if (doResetOnboarding) {
      delete activity.onboarding;
    }

    if (doResetProgress) {
      delete activity.visitHistory;
      delete activity.affinities;
      delete activity.engagement;
      delete activity.experienceLevel;
      delete activity.goals;
      delete activity.recentTags;
    }

    delete activity.lastUpdatedAt;
    await this.userService.saveProfile(
      userId,
      Object.keys(activity).length > 0 ? activity : {},
    );

    const parts: string[] = [];
    if (doResetOnboarding) parts.push('onboarding');
    if (doResetProgress) parts.push('progress');

    this.logger.info(
      { userId, onboarding: doResetOnboarding, progress: doResetProgress },
      'Activity data reset',
    );

    return {
      onboardingReset: doResetOnboarding,
      progressReset: doResetProgress,
      message: `Reset ${parts.join(' and ')} data`,
    };
  }

  /**
   * Handle element interaction (quiz answer, drag-drop, etc.).
   * Processes user response through the element's server-side runtime
   * and returns updated display state with correctness feedback.
   *
   * @param id - Element uid to interact with
   * @param data - Interaction data (e.g., user response)
   * @returns Updated element state or null if element/runtime not found
   */
  async interact(
    id: string,
    data: Record<string, any>,
  ): Promise<ElementInteractResponseDto | null> {
    this.logger.debug({ id }, 'Processing element interaction');
    const node = await this.contentService.getNode(id);
    if (!node) {
      this.logger.warn({ id }, 'Element not found');
      return null;
    }
    const element = node as ContentElementDto;
    const runtime = getRuntime(element.type);
    if (!runtime) {
      this.logger.debug(
        { id, type: element.type },
        'No runtime found for element type',
      );
      return null;
    }
    const output = runtime.onUserInteraction(element, {}, data);
    if (!output.updateDisplayState) return null;
    const { correct, feedback } = (element as any).data ?? {};
    const state = runtime?.beforeDisplay(element, {
      correct,
      feedback,
    }) as Record<string, any>;
    this.logger.debug(
      { id, isCorrect: output.isCorrect },
      'Element interaction processed',
    );
    return {
      ...state,
      isCorrect: output.isCorrect,
      response: data?.response as string,
      isSubmitted: true,
    };
  }

  /**
   * Get user's learner profile or create an empty one.
   * Fetches existing profile from user service, or initializes a new profile
   * with empty affinities and engagement metrics if none exists.
   *
   * @param userId - User's ID to fetch profile for
   * @returns Existing or newly created LearnerProfile
   */
  private async getOrCreateProfile(userId: string) {
    const userProfile = await this.userService.getProfile(userId);
    return (
      userProfile.activity ||
      this.contentService.content.profiler.createEmptyProfile(userId)
    );
  }
}
