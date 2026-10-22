import {
  type Activity,
  type ActivityAction,
  type CatalogEntry,
  type ContentContainer,
  type ContentElement,
  type DeviceInfo,
  Garment,
  type InterestUpdate,
  type LearnerProfile,
  OpenAIProvider,
  type Repository,
  TailorContent,
  toSurveyResponse,
  type VisitContext,
  type VisitEngagement,
  type VisitEntry,
} from '@tailor-cms/garment';
import type {
  ContentStatsDto,
  LearningGoalsQueryDto,
  LearningGoalsResponseDto,
} from '../dto';
import type { AccessWebhookPayloadDto } from '../dto/webhook.dto';
import type { AIConfig } from '../../../config/ai.config';
import { ConfigService } from '@nestjs/config';
import { ContentElementHookRegistry } from './content-element-hook-registry.service';
import type { GarmentConfig } from '../../../config/garment.config';
import { Injectable } from '@nestjs/common';
import { pickBy } from 'lodash';
import { PinoLogger } from 'nestjs-pino';

const CATALOG_GROUP_ID = 4;

/**
 * Content Service
 *
 * Leverages Garment's built-in features:
 * - TailorContent for global content management with bulk caching
 * - Built-in signature expiration tracking and deferred re-signing
 * - O(1) entity lookup via TailorContent.findNode()
 * - Indexed search for activities/containers
 */
@Injectable()
export class ContentService {
  private readonly garment: Garment;
  readonly content: TailorContent;

  constructor(
    private config: ConfigService,
    private logger: PinoLogger,
    private hookRegistry: ContentElementHookRegistry,
  ) {
    this.logger.setContext(ContentService.name);

    // Initialize Garment & register CE processors
    const garmentConfig = this.config.get('garment') as GarmentConfig;
    this.garment = new Garment(garmentConfig, {
      logger: {
        logger: this.logger,
        logLevel: 'debug',
        telemetry: true,
      },
    });
    this.garment.addContentElementProcessor((type: string) => {
      const hooks = this.hookRegistry.getFetchHooks(type);
      return hooks?.afterLoaded || ((() => Promise.resolve()) as any);
    });

    // Get AI config and create provider instance
    const aiConfig = this.config.get('ai') as AIConfig;
    const aiProvider = aiConfig
      ? new OpenAIProvider({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        baseURL: aiConfig.baseURL,
      })
      : undefined;

    // Initialize TailorContent in background with AI provider
    this.content = new TailorContent({
      garment: this.garment,
      aiProvider,
    });

    void this.content
      .init()
      .then(async () => {
        this.logger.info('TailorContent initialized successfully');
        // Skip analysis in CI/testing environments
        if (this.config.get<boolean>('skipContentAnalysis')) {
          this.logger.info(
            'Content analysis skipped (SKIP_CONTENT_ANALYSIS=true)',
          );
          return;
        }
        await this.runAnalysis();
      })
      .catch((err) => {
        this.logger.error({ err: err.message }, 'TailorContent init failed');
      });
  }

  /**
   * Access-filtered view of the catalog.
   */
  private getView() {
    return this.content.forGroup(CATALOG_GROUP_ID);
  }

  /**
   * List all repositories (basic data) with optional search filter.
   * Returns catalog entries containing basic metadata for each published
   * repository. Supports text search across repository names and descriptions.
   *
   * @param search - Optional search query to filter repositories
   * @returns Array of catalog entries with repository metadata
   */
  async list(search: string = ''): Promise<CatalogEntry[]> {
    this.logger.debug({ search }, 'Listing content repositories');
    try {
      await this.content.ready;
      void this.content.throttledSync();
      const view = this.getView();
      const catalog = await view.getCatalog();
      const filteredCatalog = search ? catalog.search(search) : catalog;
      const entries = await filteredCatalog.makePublic();
      if (search) {
        this.logger.debug(
          { count: entries.length, search },
          'Filtered catalog',
        );
      }
      return entries;
    } catch (error) {
      this.logger.error({ err: error.message }, 'Error fetching repositories');
      throw error;
    }
  }

  /**
   * Get every repository the current audience may see.
   */
  async getAccessibleRepositories(): Promise<Repository[]> {
    await this.content.ready;
    void this.content.throttledSync();
    return Array.from(this.getView().all());
  }

  /**
   * Get repository outline by id.
   * Returns the full repository structure.
   *
   * @param id - Repository unique identifier
   * @returns Full repository structure or null if not found
   */
  async get(id: string): Promise<Repository | null> {
    this.logger.debug({ id }, 'Getting content repository outline');
    await this.content.ready;
    void this.content.throttledSync();
    const view = this.getView();
    const repository = view.all().find(id);
    if (!repository) return null;
    await repository.makePublic();
    return repository;
  }

  /**
   * Get repository access data (users and their roles).
   * Returns the list of users and groups that have access to the repository,
   * including their roles and assignment timestamps.
   *
   * @param id - Repository unique identifier
   * @returns Access data with users and groups or null if not found
   */
  async getRepositoryAccess(
    id: string,
  ): Promise<AccessWebhookPayloadDto | null> {
    this.logger.debug({ id }, 'Getting repository access data');
    await this.content.ready;
    const view = this.getView();
    const repository = view.all().find(id);
    if (!repository || !repository.access) return null;
    return repository.access;
  }

  /**
   * Get any node (Repository, Activity, ContentContainer, or ContentElement).
   * Uses TailorContent's O(1) entity lookup via the global node index.
   * Returns the node with public-safe signed URLs for any media assets.
   *
   * @param id - Node unique identifier (works for any entity type)
   * @returns The requested node entity or null if not found
   */
  async getNode(
    id: string,
  ): Promise<Repository | Activity | ContentContainer | ContentElement | null> {
    try {
      await this.content.ready;
      void this.content.throttledSync();
      const view = this.getView();
      const result = view.findNode(id);
      if (!result) return null;
      await result.entity.makePublic();
      return result.entity;
    } catch (error) {
      this.logger.debug({ id, err: error.message }, 'Node not found');
      return null;
    }
  }

  /**
   * Filter activities across all repositories.
   * Supports filtering by repository, parent activity, type, and tags.
   * Uses Garment's indexed search for efficient lookups.
   *
   * @param queryParams.repositoryId - Optional repository to filter within
   * @param queryParams.parentId - Optional parent activity ID
   * @param queryParams.type - Optional activity type (e.g., 'MODULE', 'LESSON')
   * @param queryParams.tags - Optional tag name from recommendation metadata
   * @param queryParams.limit - Maximum results to return (default: 100)
   * @returns Array of search results with entity, type, and repository info
   */
  async findActivities(queryParams: {
    repositoryId?: string;
    parentId?: number;
    type?: string;
    tags?: string;
    limit?: number;
  }): Promise<any[]> {
    this.logger.debug({ queryParams }, 'Filter activities');
    try {
      const { repositoryId, parentId, type, tags, limit = 100 } = queryParams;
      if (tags) {
        return this.findEntitiesByTag(tags, 'Activity', limit, repositoryId);
      }
      const filterCriteria = pickBy({ type, parentId }, (v) => v !== undefined);
      return await this.searchEntities(
        'activities',
        filterCriteria,
        repositoryId,
        limit,
      );
    } catch (error) {
      this.logger.error({ err: error.message }, 'Error filtering activities');
      throw error;
    }
  }

  /**
   * Filter content containers across all repositories.
   * Supports filtering by repository, type, and tags. Uses Garment's indexed
   * search for efficient lookups across large content libraries.
   *
   * @param queryParams.repositoryId - Optional repository to filter within
   * @param queryParams.type - Optional container type (e.g., 'PAGE', 'SECTION')
   * @param queryParams.tags - Optional tag name from recommendation metadata
   * @param queryParams.limit - Maximum results to return (default: 100)
   * @returns Array of search results with entity, type, and repository info
   */
  async findContainers(queryParams: {
    repositoryId?: string;
    parentId?: number;
    type?: string;
    tags?: string;
    limit?: number;
  }): Promise<any[]> {
    this.logger.debug({ queryParams }, 'Filter containers');
    try {
      const { type, tags, repositoryId, parentId, limit = 100 } = queryParams;
      if (tags) {
        return this.findEntitiesByTag(
          tags,
          'ContentContainer',
          limit,
          repositoryId,
        );
      }
      const filterCriteria = pickBy({ type, parentId }, (v) => v !== undefined);
      return await this.searchEntities(
        'containers',
        filterCriteria,
        repositoryId,
        limit,
      );
    } catch (error) {
      this.logger.error({ err: error.message }, 'Error filtering containers');
      throw error;
    }
  }

  /**
   * Get content statistics across all repositories.
   * Returns aggregate counts for repositories, activities, containers,
   * and elements, plus bulk storage metrics showing compression efficiency.
   *
   * @returns Content statistics with entity counts and storage metrics
   */
  async getStats(): Promise<ContentStatsDto> {
    this.logger.debug('Getting content statistics');
    try {
      await this.content.ready;
      void this.content.throttledSync();
      const view = this.getView();
      return view.getStats();
    } catch (error) {
      this.logger.error({ err: error.message }, 'Error getting content stats');
      throw error;
    }
  }

  /**
   * Force re-analysis of content.
   * Synchronizes any changed repositories from Tailor CMS, then regenerates
   * content metadata including tag distributions, difficulty analysis, and
   * profiling questions. Use sparingly as this is resource-intensive.
   *
   * @returns Analysis results with counts of repositories, tags, and questions
   */
  async forceAnalysis() {
    this.logger.info('Force re-analysis requested');
    await this.content.ready;
    await this.content.syncChangedRepositories();
    return this.runAnalysis({ force: true });
  }

  /**
   * Get content analysis and profiling questions.
   * Returns aggregated analysis data including tag distribution across
   * categories (topic, skill, concept, industry, tool), difficulty breakdown,
   * and auto-generated profiling questions for learner onboarding.
   *
   * @returns Analysis summary with tag/difficulty distributions and profiling
   * questions
   */
  async getAnalysis() {
    this.logger.debug('Getting content analysis and profiling data');
    try {
      await this.content.ready;
      const { repositoryIds, generatedAt, profilingQuestions, ...rest } =
        this.content.getAnalysisSummary();

      return {
        ...rest,
        analysisRepositoryIds: repositoryIds,
        generatedAt: generatedAt?.toISOString() || null,
        profilingQuestions: profilingQuestions.map(toSurveyResponse),
      };
    } catch (error) {
      this.logger.error(
        { err: error.message },
        'Error getting content analysis',
      );
      throw error;
    }
  }

  /**
   * Get learning goals (problems and outcomes) across repositories.
   * Returns searchable problems (what learners will solve) and outcomes
   * (what learners will achieve). Used for search bar discovery and
   * goal-based content navigation.
   *
   * @param queryParams.query - Optional text search filter
   * @param queryParams.type - Optional filter: 'problem' or 'outcome'
   * @param queryParams.limit - Maximum results (default: 100)
   * @returns Learning goals with section navigation paths
   */
  async getLearningGoals(
    queryParams?: LearningGoalsQueryDto,
  ): Promise<LearningGoalsResponseDto> {
    this.logger.debug('Getting learning goals for search');
    try {
      await this.content.ready;
      const view = this.getView();
      const { query, type, limit = 100 } = queryParams || {};
      const result = view.getLearningGoals({ query, type, limit });
      this.logger.debug(
        {
          count: result.items.length,
          totalProblems: result.totalProblems,
          totalOutcomes: result.totalOutcomes,
        },
        'Learning goals fetched',
      );
      return result;
    } catch (error) {
      this.logger.error({ err: error.message }, 'Error getting learning goals');
      throw error;
    }
  }

  /**
   * Handle content publish webhook from Tailor CMS.
   * Triggered when repository metadata or activity content is published.
   * Synchronizes changed repositories to update local cache.
   *
   * @param context.repositoryId - Repository ID from Tailor CMS
   * @param context.activityId - Optional activity ID if activity was published
   */
  async onContentPublish(context: {
    repositoryId: number;
    activityId?: number;
  }): Promise<void> {
    const { repositoryId, activityId } = context;
    this.logger.info({ repositoryId, activityId }, 'Publish webhook received');
    await this.content.syncChangedRepositories();
  }

  /**
   * Handle access rights update webhook from Tailor CMS.
   * Updates repository access data when user permissions change.
   * Rebuilds local access indices for authorization checks.
   *
   * @param accessData - Access payload with users, groups, and their roles
   */
  async onAccessUpdate(accessData: any): Promise<void> {
    this.logger.info(
      { repositoryId: accessData.id },
      'Access webhook received',
    );
    try {
      await this.content.ready;
      this.content.updateRepositoryAccess(accessData.id, accessData);
      this.logger.info({ repositoryId: accessData.id }, 'Access updated');
    } catch (error) {
      this.logger.error({ err: error.message }, 'Error updating access');
      throw error;
    }
  }

  /**
   * Find entities by tag name using sectionIds from recommendation metadata
   * Tags contain sectionIds pointing to activities/containers associated
   */
  private async findEntitiesByTag(
    tagName: string,
    entityType:
      | 'Repository'
      | 'Activity'
      | 'ContentContainer'
      | 'ContentElement',
    limit: number = 100,
    repositoryUid?: string,
  ): Promise<any[]> {
    try {
      await this.content.ready;
      const view = this.getView();
      const sectionIds = new Set<string>();
      let repositories;
      if (repositoryUid) {
        const repo = view.all().find(repositoryUid);
        repositories = repo ? [repo] : [];
      } else {
        repositories = Array.from(view.all());
      }
      for (const it of repositories) {
        if (!it?.recommendationMetadata?.tags) continue;
        // Find tags with matching name
        for (const tag of it.recommendationMetadata.tags) {
          if (tag.name === tagName && tag.sectionIds) {
            // Add all sectionIds from this tag
            for (const sectionId of tag.sectionIds) {
              sectionIds.add(sectionId);
            }
          }
        }
      }
      this.logger.debug(
        {
          count: sectionIds.size,
          tagName,
        },
        'Found sectionIds for tag',
      );
      // Use findNode to get each entity
      const results: any[] = [];
      for (const uid of Array.from(sectionIds).slice(0, limit)) {
        const result = view.findNode(uid);
        if (result && result.entityType === entityType) {
          await result.entity.makePublic();
          results.push({
            entity: result.entity.toJSON(),
            entityType: result.entityType,
            repositoryId: result.repositoryUid,
          });
        }
      }
      this.logger.debug(
        {
          count: results.length,
          entityType,
          tagName,
        },
        'Returning entities for tag',
      );
      return results;
    } catch (error) {
      this.logger.error(
        { err: error.message, tagName },
        'Error finding entities by tag',
      );
      throw error;
    }
  }

  /**
   * Generic entity search with signing
   * Delegates to TailorContent.search() for efficient indexed lookup
   */
  private async searchEntities(
    entityType: 'activities' | 'containers',
    criteria: Record<string, any>,
    repositoryId?: string,
    limit: number = 100,
  ): Promise<any[]> {
    try {
      await this.content.ready;
      const view = this.getView();
      const garmentEntityType =
        entityType === 'activities'
          ? ('Activity' as const)
          : ('ContentContainer' as const);
      const results = view.search(garmentEntityType, criteria, {
        repositoryUid: repositoryId,
        limit: Math.min(limit, 100),
      });
      await Promise.all(
        results.map((r) => r.entity.makePublic(this.getSignatureTTL())),
      );
      // Return plain objects matching controller DTOs
      return results.map((r) => ({
        entity: r.entity.toJSON(),
        entityType: r.entityType,
        repositoryId: r.repositoryUid,
      }));
    } catch (error) {
      this.logger.error(
        { err: error.message, entityType },
        'Error searching entities',
      );
      throw error;
    }
  }

  /**
   * Get personalized content recommendations based on user profile
   * @param profile - User's learner profile
   * @param options - Recommendation options
   * @returns Personalized content recommendations
   */
  async getRecommendations(
    profile: LearnerProfile,
    options?: {
      limit?: number;
      includeCompleted?: boolean;
      onlyInProgress?: boolean;
      boostRecent?: boolean;
      recentBoostWeight?: number;
      recentDays?: number;
    },
  ): Promise<any> {
    this.logger.debug('Getting personalized recommendations');
    try {
      await this.content.ready;
      // Get recommendations using TailorContent
      const suggestions = await this.content.suggestContent(profile, {
        limit: options?.limit || 10,
        includeCompleted: options?.includeCompleted,
        onlyInProgress: options?.onlyInProgress,
        boostRecent: options?.boostRecent ?? true,
        recentBoostWeight: options?.recentBoostWeight,
        recentDays: options?.recentDays,
      });
      this.logger.debug(
        { count: suggestions.length },
        'Recommendations generated',
      );

      const totalRepositories = this.content.contentAnalysis
        ? this.content.contentAnalysis.repositoryIds.length
        : this.content.repositories.length;

      return {
        recommendations: suggestions,
        totalRepositories,
        count: suggestions.length,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        { err: error.message },
        'Error getting recommendations',
      );
      throw error;
    }
  }

  /**
   * Get "more like this" suggestions for a specific repository
   * @param repositoryId - Repository UID to find similar content for
   * @param profile - User's learner profile for personalization
   * @param options - Options for matching (sectionId, limit)
   * @returns Similar content recommendations
   */
  async getMoreLikeThis(
    repositoryId: string,
    profile: LearnerProfile,
    options?: { sectionId?: string; limit?: number },
  ): Promise<any> {
    this.logger.debug({ repositoryId }, 'Getting similar content');
    try {
      await this.content.ready;
      const suggestions = await this.content.getSimilarActivities(
        repositoryId,
        options?.sectionId || repositoryId,
        profile,
        { limit: options?.limit },
      );
      this.logger.debug(
        { repositoryId, count: suggestions.length },
        'Similar content found',
      );
      const totalRepositories = this.content.contentAnalysis
        ? this.content.contentAnalysis.repositoryIds.length
        : this.content.repositories.length;
      return {
        recommendations: suggestions,
        totalRepositories,
        count: suggestions.length,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        { err: error.message, repositoryId },
        'Error getting similar content',
      );
      throw error;
    }
  }

  /**
   * Record a user activity and update their profile
   * Tracks visit history and 6D affinities
   * @param profile - User's current learner profile
   * @param nodeId - Content node UID
   * @param action - Type of interaction
   * @param duration - Optional duration in ms
   * @param context - Optional visit context (session, entry point)
   * @param engagement - Optional engagement metrics (scroll depth)
   * @param device - Optional device info (type, browser, OS)
   * @returns Updated profile and changes
   */
  async recordActivity(
    profile: LearnerProfile,
    nodeId: string,
    action: ActivityAction,
    duration?: number,
    context?: Partial<VisitContext>,
    engagement?: Partial<VisitEngagement>,
    device?: Partial<DeviceInfo>,
  ): Promise<{
    profile: LearnerProfile;
    updates: InterestUpdate[];
    visit?: VisitEntry;
  }> {
    await this.content.ready;

    // Ensure content analysis exists before recording activity
    if (!this.content.hasAnalysis) {
      this.logger.warn('Content analysis not ready, triggering analysis');
      await this.runAnalysis({ force: false });
    }

    const updater = this.content.activity;
    this.logger.debug({
      msg: 'Recording activity with ProfileUpdater',
      nodeId,
      action,
      hasProfile: !!profile,
      hasAffinities: !!profile.affinities,
      hasContext: !!context,
      hasEngagement: !!engagement,
    });

    // Update profile with visit history
    const result = updater.track(
      profile,
      nodeId,
      action,
      duration,
      context,
      engagement,
      device,
    );

    this.logger.debug({
      msg: 'Activity recorded',
      nodeId,
      action,
      duration,
      changesCount: result.updates.length,
      hasVisit: !!result.visit,
      visitHistoryCount: result.profile.visitHistory?.length || 0,
      topChanges: result.updates.slice(0, 3).map((u) => ({
        tag: u.tag,
        delta: u.delta.toFixed(3),
      })),
    });

    return result;
  }

  /**
   * Run content analysis across all repositories
   * @param options - Analysis options
   */
  private async runAnalysis(options?: {
    force?: boolean;
    repositoryIds?: string[];
  }) {
    const view = this.getView();
    const repositoryIds =
      options?.repositoryIds || view.all().map((r) => r.uid);
    await this.content.analyzeContent({
      ...options,
      repositoryIds,
      onProgress: (completed, total) => {
        this.logger.info({ completed, total }, 'Analysis progress');
      },
    });
    const repositoriesAnalyzed = this.content.getMetadataCount();
    const tags = this.content.contentAnalysis
      ? Object.keys(this.content.contentAnalysis.tagDistribution).length
      : 0;
    const questions = this.content.profilingQuestions?.length || 0;
    this.logger.info(
      { repositoriesAnalyzed, tags, questions },
      'Analysis complete',
    );
    return { repositoriesAnalyzed, tags, questions };
  }

  private getSignatureTTL(): number {
    return this.config.get('cache').signatureTTL;
  }
}
