import {
  arrayOf,
  dateOf,
  parseMetadata,
  serializeMetadata,
} from '../serializable';
import { Activity, ContentContainer } from '..';
import type {
  ContentMeta,
  LearningGoalItem,
  LearningGoalsQuery,
  LearningOutcome,
  Problem,
  ProfileQuestion,
} from '../../../ai/types';
import { cloneDeep, pick } from '../../utils';
import type { LoadOptions, MakePublicOptions } from '../serializable';
import type { RepositoryAccessData } from '../../interfaces';
import { ContentGraph } from '../../content-graph';
import { GarmentEnv } from '../../enums';
import { LoadableEntity } from '../base';

// Register with ContentEntity factory
import { ContentEntity } from '../ContentEntity';

export class Repository extends LoadableEntity<Repository> {
  static api: any;
  static getSnapshotKey = (id: number | string, version: string) =>
    `${id}/${version}`;

  private _access?: RepositoryAccessData;

  env: GarmentEnv;
  envPath: string;
  schema: string;
  version: string;
  name: string;
  description: string;
  meta: { [key: string]: any };
  structure: Activity[];
  publishedAt?: Date;

  // Content analysis
  // Recommendation metadata and learner profiling
  recommendationMetadata?: ContentMeta;
  profilingQuestions?: ProfileQuestion[];

  readonly serializableProps = [
    'env',
    'envPath',
    'id',
    'uid',
    'schema',
    'version',
    'name',
    'description',
    'meta',
    ['structure', arrayOf(Activity)],
    ['publishedAt', dateOf()],
    'recommendationMetadata',
    'profilingQuestions',
  ] as const;

  get snapshotKey(): string {
    return Repository.getSnapshotKey(this.sourceKey, this.version);
  }

  get path(): string {
    return Repository.api.getRepositoryPath(this.sourceKey, this.envPath);
  }

  get activitiesWithContainers(): Activity[] {
    return this.structure.filter((it) => it.contentContainers?.length);
  }

  get containers(): ContentContainer[] {
    const { activitiesWithContainers: activities } = this;
    return activities.map((it) => it.contentContainers).flat();
  }

  get access(): RepositoryAccessData | undefined {
    return this._access;
  }

  set access(value: RepositoryAccessData | undefined) {
    this._access = value;
  }

  async load(options?: LoadOptions): Promise<Repository> {
    if (this.isLoaded && !options?.force) {
      this.logger.debugOperation(this.getLogContext(), 'Already loaded');
      return this;
    }

    const start = Date.now();
    const context = this.getLogContext();
    this.logger.debug(`${context} Loading content from S3`);

    await Promise.all(this.structure.map((it) => it.load(this, options)));
    this.trackLoading();

    if (this.logger.isTelemetryEnabled) {
      const duration = Date.now() - start;
      const containers = this.containers.length;
      const elements = this.containers.reduce(
        (sum, c) => sum + (c.elements?.length || 0),
        0,
      );
      this.logger.debug(
        `${context} Loaded in ${this.logger.formatDuration(duration)} ` +
        `(${this.structure.length} activities, ${containers} containers, ` +
        `${elements} elements)`,
      );
    } else {
      this.logger.debug(`${context} Loaded from S3`);
    }
    return this;
  }

  async getContentGraph(): Promise<ContentGraph> {
    if (!this.isLoaded) await this.load();
    const nodes = this.structure.reduce(
      (acc, it) => acc.concat(it.getSubtreeDescriptors()),
      [] as any[],
    );
    // Pass repository reference for efficient entity loading
    return new ContentGraph(nodes, this.id, this.envPath, this);
  }

  /**
   * Make repository content publicly accessible by signing URLs
   * @param interval - Signature validity interval in seconds (optional)
   * @param options - Options including force re-signing
   * @returns Promise resolving to the repository itself for chaining
   */
  async makePublic(
    interval?: number,
    options?: MakePublicOptions,
  ): Promise<Repository> {
    const context = this.getLogContext();
    const isStale = this.isStale();
    const needsResigning = this.needsResigning();

    // If stale but not expired and not forced, trigger deferred
    if (!options?.force && isStale && !needsResigning) {
      this.logger.debugOperation(context, 'Signatures stale, deferring');
      void this.triggerDeferredResigning(interval);
      return this;
    }

    // Skip re-signing if fresh (unless force option is set)
    if (!options?.force && !needsResigning) {
      this.logger.debugOperation(context, 'Signatures fresh, skipping');
      return this;
    }

    const start = Date.now();
    const elemCount = this.containers.reduce(
      (sum, c) => sum + (c.elements?.length || 0),
      0,
    );
    this.logger.debug(`${context} Signing ${elemCount} elements`);

    await Promise.all([
      ...this.structure.map((it) => it.makePublic(interval, options)),
      Repository.api.processMeta(this.meta),
    ]);
    this.trackSigning(interval, options?.deferred);

    if (this.logger.isTelemetryEnabled) {
      const duration = Date.now() - start;
      this.logger.debug(
        `${context} Signed ${elemCount} elements in ` +
        `${this.logger.formatDuration(duration)}`,
      );
    } else {
      this.logger.debug(`${context} Signed elements`);
    }

    return this;
  }

  copy(dstPath: string) {
    return Repository.api.clone(this.path, dstPath);
  }

  snapshot() {
    const { snapshotKey } = this;
    if (this.env === GarmentEnv.Snapshot) {
      const msg = `Cannot create a snapshot for existing snapshot: ${snapshotKey}`;
      throw new Error(msg);
    }
    return Repository.api.cloneToEnv(this.path, GarmentEnv.Snapshot, snapshotKey);
  }

  async getContainer(id: number | string): Promise<ContentContainer> {
    const container = this.containers.find((it) => it.sourceKey === id);
    if (!container) throw new Error(`Container ${id} does not exist!`);
    if (container.isLoaded) return container;
    const data = await Repository.api.getContainer(
      id,
      this.sourceKey,
      this.envPath,
      container.fileExtension,
    );
    return ContentContainer.fromJSON(data);
  }

  /**
   * Reload access control data from S3
   * Typically called in response to SSE access update events
   * @returns Promise that resolves when access data is reloaded
   */
  async reloadAccess(): Promise<void> {
    const context = this.getLogContext();
    this.access = await Repository.api.getRepositoryAccess(this.id);
    if (this.access) {
      this.logger.debug(`${context} Access data reloaded`);
    } else {
      this.logger.debug(`${context} No access data available`);
    }
  }

  /**
   * Check if repository has valid recommendation metadata
   * @returns True if metadata exists and contains generated tags
   *
   * @example
   * if (repo.hasRecommendationMetadata()) {
   *   console.log('Tags:', repo.recommendationMetadata.tags);
   * }
   */
  hasRecommendationMetadata(): boolean {
    return (
      !!this.recommendationMetadata &&
      Array.isArray(this.recommendationMetadata.tags) &&
      this.recommendationMetadata.tags.length > 0
    );
  }

  /**
   * Get count of problems in repository
   */
  get problemCount(): number {
    return this.recommendationMetadata?.problems?.length || 0;
  }

  /**
   * Get count of learning outcomes in repository
   */
  get outcomeCount(): number {
    return this.recommendationMetadata?.learningOutcomes?.length || 0;
  }

  /**
   * Check if repository has profiling questions
   * @returns True if questions exist
   *
   * @example
   * if (!repo.hasProfilingQuestions()) {
   *   await repo.generateProfilingQuestions(aiProvider);
   * }
   */
  hasProfilingQuestions(): boolean {
    return !!this.profilingQuestions && this.profilingQuestions.length > 0;
  }

  /**
   * Get top tags from repository metadata
   * @param limit - Maximum number of tags to return
   * @returns Array of top tag names sorted by weight
   *
   * @example
   * const topTags = repo.getTopTags(5);
   * console.log('Top 5 tags:', topTags);
   */
  getTopTags(limit = 10): string[] {
    if (!this.recommendationMetadata) return [];
    return this.recommendationMetadata.tags
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map((t) => t.name);
  }

  /**
   * Get problems from repository metadata
   * @param query - Optional case-insensitive search on title/description
   * @returns Array of problems, optionally filtered by query
   *
   * @example
   * const allProblems = repo.getProblems();
   * const cssProblems = repo.getProblems('css');
   */
  getProblems(query?: string): Problem[] {
    if (!this.recommendationMetadata?.problems) return [];
    const problems = this.recommendationMetadata.problems;
    if (!query) return problems;
    const q = query.toLowerCase();
    return problems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  /**
   * Get learning outcomes from repository metadata
   * @param query - Optional case-insensitive search on description
   * @returns Array of learning outcomes, optionally filtered by query
   *
   * @example
   * const allOutcomes = repo.getOutcomes();
   * const applyOutcomes = repo.getOutcomes('apply');
   */
  getOutcomes(query?: string): LearningOutcome[] {
    if (!this.recommendationMetadata?.learningOutcomes) return [];
    const outcomes = this.recommendationMetadata.learningOutcomes;
    if (!query) return outcomes;
    const q = query.toLowerCase();
    return outcomes.filter((o) => o.description.toLowerCase().includes(q));
  }

  /**
   * Get unified learning goals (problems and outcomes)
   * @param options - Query options for filtering
   * @returns Array of learning goal items
   *
   * @example
   * Get all learning goals
   * const goals = repo.getLearningGoals();
   *
   * @example
   * Get only problems matching query
   * const goals = repo.getLearningGoals({ type: 'problem', query: 'api' });
   */
  getLearningGoals(options?: LearningGoalsQuery): LearningGoalItem[] {
    const items: LearningGoalItem[] = [];
    const { type, query, limit } = options || {};

    // Add problems (unless filtering for outcomes only)
    if (type !== 'outcome') {
      for (const problem of this.getProblems(query)) {
        items.push({
          id: problem.id,
          type: 'problem',
          title: problem.title,
          description: problem.description,
          category: problem.category,
          difficulty: problem.difficulty,
          requiredSkills: problem.requiredSkills,
          sectionIds: problem.sectionIds,
          repositoryId: this.uid,
          repositoryName: this.name,
        });
      }
    }
    // Add outcomes (unless filtering for problems only)
    if (type !== 'problem') {
      for (const outcome of this.getOutcomes(query)) {
        items.push({
          id: outcome.id,
          type: 'outcome',
          title: outcome.description,
          category: outcome.bloomLevel,
          sectionIds: outcome.sectionIds,
          repositoryId: this.uid,
          repositoryName: this.name,
        });
      }
    }
    return limit ? items.slice(0, limit) : items;
  }

  /**
   * Save the entire repository with all nested content to S3 as bulk export
   * Ensures repository is fully loaded before saving
   * Loads access data and includes it in the bulk export
   * Stores as 'bulk.json' at repository root for efficient full loading
   * Skips saving if entity is not dirty unless force is true
   *
   * @param options - Save options
   * @param options.force - Force save even if not dirty (default: false)
   * @returns Promise that resolves when saved
   */
  async save(options: { force?: boolean } = {}): Promise<void> {
    if (!Repository.api) throw new Error('Repository.api is not configured');

    // Skip if not dirty unless force is true
    if (!this.isDirty && !options.force) {
      const context = this.getLogContext();
      this.logger.debug(`${context} Skipping save - no changes`);
      return;
    }

    const start = Date.now();
    const context = this.getLogContext();

    // Ensure repository is fully loaded
    if (!this.isLoaded) {
      this.logger.debug(`${context} Not loaded, loading before save`);
      await this.load();
    }

    // Load access data if not already present
    if (!this.access) {
      this.access = await Repository.api.getRepositoryAccess(this.id);
      if (!this.access) {
        this.logger.debug(`${context} No access file found`);
      }
    }

    this.logger.debug(`${context} Saving bulk export to S3`);

    const path = Repository.getBulkPath(this.id, this.envPath);
    const data = this.toStorage();
    const payload = JSON.stringify(data);

    await Repository.api.saveObject(path, payload);

    // Mark as clean after successful save
    this.markClean();

    if (this.logger.isTelemetryEnabled) {
      const duration = Date.now() - start;
      const size = Buffer.byteLength(payload);
      this.logger.debug(
        `${context} Saved bulk in ${this.logger.formatDuration(duration)} ` +
        `(${this.logger.formatSize(size)})`,
      );
    } else {
      this.logger.debug(`${context} Saved bulk export`);
    }
  }

  /**
   * Get S3 path for bulk repository export
   * @param repositoryId - Repository ID
   * @param envPath - Environment path
   * @returns S3 path for bulk export file
   */
  static getBulkPath(repositoryId: number, envPath: string): string {
    return `${envPath}/${repositoryId}/bulk.json`;
  }

  /**
   * Load repository from bulk export file
   * Also loads access control data from separate access.json file
   * @param repositoryId - Repository ID to load
   * @param envPath - Environment path (e.g., 'repository', 'snapshots')
   * @returns Fully loaded Repository instance with isLoaded=true for all entities
   */
  static async loadFromBulk(
    repositoryId: number,
    envPath: string,
  ): Promise<Repository> {
    if (!Repository.api) throw new Error('Repository.api is not configured');

    const start = Date.now();
    const context = `Repository:${repositoryId}`;

    Repository.logger.debug(`${context} Loading from bulk cache`);

    const path = Repository.getBulkPath(repositoryId, envPath);
    const { content } = await Repository.api.getObject(path);

    const repository = Repository.fromJSON(content);

    // Load access data if available
    repository.access = await Repository.api.getRepositoryAccess(repositoryId);
    if (!repository.access) {
      Repository.logger.debug(`${context} No access file found`);
    }

    // Handle loading state for bulk-loaded entities
    repository.handleBulkLoadState();

    if (Repository.logger.isTelemetryEnabled) {
      const duration = Date.now() - start;
      Repository.logger.debug(
        `${context} Loaded from bulk in ` +
        `${Repository.logger.formatDuration(duration)}`,
      );
    } else {
      Repository.logger.debug(`${context} Loaded from bulk`);
    }

    return repository;
  }

  /**
   * Handle loading state after bulk loading
   * Marks repository and all nested entities as clean (not dirty)
   * Sets loadedAt timestamps for tracking
   * Public so TailorContent can call it when loading repositories from bulk
   */
  handleBulkLoadState(): void {
    const now = new Date();
    this.loadedAt = now;
    this.markClean();
    this.clearSigningState();

    // Mark all activities and their nested content as loaded
    if (this.structure?.length) {
      for (const activity of this.structure) {
        activity.loadedAt = now;
        activity.markClean();
        activity.clearSigningState();

        // Handle loading state for all content containers
        if (activity.contentContainers?.length) {
          for (const container of activity.contentContainers) {
            this.handleContainerBulkLoadState(container, now);
          }
        }
      }
    }
  }

  /**
   * Recursively handle loading state for container and nested containers
   * Sets loadedAt timestamps and marks as clean
   * Note: ContentElements don't have loading state (not LoadableEntity)
   * @param container - Container to handle
   * @param timestamp - Timestamp to use for loadedAt
   */
  private handleContainerBulkLoadState(
    container: ContentContainer,
    timestamp: Date,
  ): void {
    container.loadedAt = timestamp;
    container.markClean();
    container.clearSigningState();
    container.elements?.forEach((it) => it.clearSigningState());

    // Recursively handle nested containers
    if (container.containers?.length) {
      for (const nestedContainer of container.containers) {
        this.handleContainerBulkLoadState(nestedContainer, timestamp);
      }
    }
  }

  /**
   * Serialize repository to JSON
   * Uses serializableProps with automatic processing
   */
  toJSON(): any {
    return {
      __type: this.constructor.name,
      ...this.serializeWithProps(),
      _metadata: serializeMetadata(this),
    };
  }

  /**
   * Serialize repository for storage (S3, disk, etc.)
   * Includes access control data for bulk export
   */
  toStorage(): any {
    const data: any = {
      __type: this.constructor.name,
      ...this.serializeWithProps(),
    };
    // Include access only in storage
    if (this._access) {
      data.access = this._access;
    }
    return data;
  }

  /**
   * Deserialize repository from JSON data
   * Uses serializableProps with automatic processing
   */
  static fromJSON(data: any): Repository {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const repository = new Repository();
    repository.deserializeWithProps(parsed);
    if (parsed.access) {
      repository.access = parsed.access;
    }
    repository.structure.forEach((activity) => {
      activity.repositoryId = repository.id;
    });
    const metadata = parseMetadata(parsed._metadata);
    repository.loadedAt = metadata.loadedAt;
    repository.signedAt = metadata.signedAt;
    repository.signedInterval = metadata.signedInterval;
    return repository;
  }

  /**
   * Create an in-memory clone of the repository
   */
  clone(): Repository {
    return Object.assign(new Repository(), {
      ...pick(this, this.serializableProps as any, 'clone'),
      meta: cloneDeep(this.meta),
      structure: this.structure?.map((activity) => activity.clone()) || [],
      loadedAt: this.loadedAt,
      signedAt: this.signedAt,
      signedInterval: this.signedInterval,
    });
  }

  /**
   * Get all cache keys for this repository and its children
   * Recursively collects keys from all nested entities
   * @param namespace - Cache namespace (defaults to 'tlr')
   * @returns Array of cache key strings
   */
  getCacheKeys(namespace = 'tlr'): string[] {
    const keys = [this.getCacheKey(namespace)];
    if (this.structure?.length) {
      for (const activity of this.structure) {
        keys.push(...activity.getCacheKeys(namespace));
      }
    }

    return keys;
  }
}

ContentEntity.register('Repository', Repository);
