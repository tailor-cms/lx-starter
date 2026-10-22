import { compressJSON, decompressJSON } from '../../compression';
import {
  arrayOf,
  dateOf,
  parseMetadata,
  serializeMetadata,
} from '../serializable';
import type {
  AggregatedLearningGoal,
  AIProvider,
  AggregatedContentAnalysis,
  ContentMeta,
  LearnerProfile,
  LearningGoalsQuery,
  LearningGoalsResult,
  ProfileMatchOptions,
  ProfileQuestion,
  RelatedContent,
  SectionNode,
} from '../../../ai/types';
import type {
  ContentStats,
  SearchCriteria,
  SearchEntityType,
  SearchOptions,
  SearchPredicate,
  SearchResult,
} from './types';
import {
  ContentAnalyzer,
  LearnerProfiler,
  MetadataGenerator,
  ProfileUpdater,
} from '../../../ai';
import {
  extractActivities,
  extractContainers,
  extractElements,
  getEntityType,
  searchIndex,
} from './search-utils';
import type { LoadOptions, MakePublicOptions } from '../serializable';
import { Repository, RepositoryCollection } from '../repository';
import { AccessManager } from '../../access/AccessManager';
import type { RepositoryAccessData } from '../../interfaces';
import { TailorContentView } from './TailorContentView';

import type { Activity } from '../activity';
import { BaseEntity } from '../base';
import type { CatalogCollection } from '../catalog-entry/CatalogCollection';
import type { CatalogEntry } from '../catalog-entry';
import type { ContentContainer } from '../content-container';
import type { ContentElement } from '../content-element';
import { ContentEntity } from '../ContentEntity';
import type Garment from '../../index';
import { GarmentEnv } from '../../enums';
import type { AnyIndexedEntity, IndexedEntity } from './search-utils';

/**
 * Options for creating TailorContent instance
 */
export interface TailorContentOptions {
  // Garment instance to use for storage operations
  garment: Garment;
  // Environment to load from (defaults to Source)
  env?: GarmentEnv;
  // Path for the environment (defaults to garment.config[env])
  envPath?: string;
  // AI provider for recommendation engine (optional)
  aiProvider?: AIProvider;
}

/**
 * Options for content suggestion
 */
export interface SuggestContentOptions extends ProfileMatchOptions {
  // Maximum number of recommendations to return (default: 10)
  limit?: number;
  // Include already completed content in suggestions (default: false)
  includeCompleted?: boolean;
  // Only suggest content that is in progress (default: false)
  onlyInProgress?: boolean;
}

/**
 * TailorContent - Collection wrapper for all repositories
 * Provides unified content access for entire Tailor CMS instance
 * Features global content graph for O(1) entity lookups and efficient search
 * Supports bulk save/load for efficient full-content operations
 *
 * @example
 * Create instance (synchronous)
 * const content = new TailorContent({ garment: myGarment });
 *
 * @example
 * Initialize when ready
 * await content.init();
 *
 * @example
 * Custom environment
 * const content = new TailorContent({
 *   garment: myGarment,
 *   env: GarmentEnv.Preview,
 *   envPath: 'custom/path'
 * });
 */
export class TailorContent extends BaseEntity<TailorContent> {
  readonly garment: Garment;
  readonly env: GarmentEnv;
  readonly envPath: string;
  readonly aiProvider?: AIProvider;

  // All repositories in this env
  repositories: Repository[];
  // Determined by the latest publishedAt from all repositories
  publishedAt?: Date;

  // Cross-repository content analysis (computed and persisted)
  contentAnalysis?: AggregatedContentAnalysis;
  // Global profiling questions for learner assessment (computed and persisted)
  profilingQuestions?: ProfileQuestion[];
  // Timestamp when recommendation data was last computed and persisted
  contentAnalysisAt?: Date;

  // Minimum interval between catalog freshness checks (1 minutes)
  private static readonly CATALOG_CHECK_INTERVAL = 1 * 60 * 1000;

  // Whether repositories have been initialized
  private _initialized = false;

  // Promise tracking ongoing initialization (for idempotent init)
  private _initPromise?: Promise<void>;

  // Promise tracking ongoing analysis (for blocking concurrent analysis)
  private _analysisPromise?: Promise<void>;
  private _analyzer?: ContentAnalyzer;
  private _profiler?: LearnerProfiler;
  private _tracking?: ProfileUpdater;

  // Timestamp of the last time we checked the catalog for updates
  private _lastCatalogCheckAt?: Date;

  // Cache for catalog collection
  private _catalog?: CatalogCollection;

  // Entity UID → IndexedEntity map for O(1) access to entity by UID
  // Built lazily on first access from per-type indices
  // Reuses IndexedEntity objects to avoid duplication
  private _entityIndex?: Map<string, AnyIndexedEntity>;

  // Indexed entity collections for efficient search
  // Built lazily when first accessed, flattened from repository tree structure
  // Each entry maintains repository context for search results
  private _activityIndex?: IndexedEntity<Activity>[];
  private _containerIndex?: IndexedEntity<ContentContainer>[];
  private _elementIndex?: IndexedEntity<ContentElement>[];

  // Bulk storage size metrics
  private _bulkJsonSize?: number;
  private _bulkCompressedSize?: number;

  // Access manager for permission filtering
  private _accessManager?: AccessManager;

  readonly serializableProps = [
    'env',
    'envPath',
    ['publishedAt', dateOf()],
    ['repositories', arrayOf(Repository)],
    'contentAnalysis',
    'profilingQuestions',
    ['contentAnalysisAt', dateOf()],
  ] as const;

  constructor(options?: TailorContentOptions) {
    super();
    // Initialize repositories array
    this.repositories = [];
    // For deserialization (fromJSON/clone), options may be undefined
    if (options) {
      this.garment = options.garment;
      this.env = options.env ?? GarmentEnv.Source;
      this.envPath = options.envPath ?? options.garment.config[this.env];
      this.aiProvider = options.aiProvider;
    } else {
      // Temporary instance for deserialization - will be discarded
      this.garment = null as any;
      this.env = GarmentEnv.Source;
      this.envPath = '';
    }
  }

  // ============================================================================
  // INITIALIZATION & LOADING
  // ============================================================================

  /**
   * Initialize TailorContent by loading repositories
   *
   * Two loading modes:
   *
   * **Default mode (no force):**
   * 1. Load from bulk cache (repository/bulk.json)
   * 2. Check catalog for changes
   * 3. If changes: incrementally sync only changed repositories (efficient)
   * 4. If no changes: use cache as-is
   *
   * **Force mode (force: true):**
   * 1. Skip bulk cache entirely (optimization)
   * 2. Load all repositories from catalog
   * 3. Save new bulk cache
   *
   * @param options - Load options
   * @param options.force - Skip cache and always reload from source
   * @returns Promise resolving when initialized
   *
   * @example
   * Default: Fast startup with smart incremental sync
   * await content.init()
   *
   * @example
   * Force: Full reload (after deploy, cache invalidation)
   * await content.init({ force: true })
   *
   * @example
   * Skip access manager initialization
   * await content.init({ initAccess: false })
   */
  async init(options?: LoadOptions & { initAccess?: boolean }): Promise<void> {
    // Return cached promise if already initializing (unless force mode)
    if (this._initPromise && !options?.force) {
      return this._initPromise;
    }

    // Skip if already initialized (unless force mode)
    if (this._initialized && !options?.force) {
      const context = this.getLogContext();
      this.logger.debugOperation(context, 'Already initialized, skipping');
      void this.throttledSync();
      return;
    }

    // Start new initialization and cache promise
    this._initPromise = this._init(options);

    try {
      await this._initPromise;

      // Auto-init access manager after repositories loaded (default: true)
      if (options?.initAccess !== false) {
        try {
          await this.initAccessManager();
        } catch (err) {
          this.logger.warn('Failed to initialize access manager:', err);
        }
      }
    } finally {
      // Clear promise after completion (success or failure)
      this._initPromise = undefined;
    }
  }

  /**
   * Internal initialization logic
   * Separated to allow promise caching in init()
   */
  private async _init(options?: LoadOptions): Promise<void> {
    const start = Date.now();
    const context = this.getLogContext();
    const msg = options?.force ? 'Force reload requested' : 'Initializing';
    this.logger.debug(`${context} ${msg}`);

    // Clear all caches on force=true
    if (options?.force) {
      this.rebuildIndices();
      this._catalog = undefined;
    }

    // Skip bulk load if force=true
    if (options?.force) {
      this.logger.debug(`${context} Force reload from storage`);
      await this.loadFromCatalog(options);
      await this.save({ force: true });
      this.logInitComplete(context, start, 'Loaded from storage');
      this._initialized = true;
      this._lastCatalogCheckAt = new Date();
      return;
    }

    // Try to load from bulk cache
    const bulkLoaded = await this.loadFromBulk();
    if (!bulkLoaded) {
      // No bulk file exists, must load from catalog
      this.logger.debug(`${context} No cache, loading from storage`);
      await this.loadFromCatalog(options);
      await this.save({ force: true });
      this.logInitComplete(context, start, 'Loaded from storage');
      this._initialized = true;
      this._lastCatalogCheckAt = new Date();
      return;
    }

    // Bulk loaded successfully, check for changes
    const needsUpdate = await this.hasPublishedChanges();
    if (!needsUpdate) {
      // No changes detected, use bulk cache
      this.logInitComplete(context, start, 'Loaded from cache');
      this._initialized = true;
      this._lastCatalogCheckAt = new Date();
      return;
    }

    // Changes detected - perform incremental sync
    this.logger.debug(`${context} Changes detected, syncing incrementally`);
    await this.syncChangedRepositories();
    this.logInitComplete(context, start, 'Synced updates');
    this._initialized = true;
    this._lastCatalogCheckAt = new Date();
  }

  /**
   * Promise that resolves when TailorContent is ready to use
   * Returns immediately if already initialized
   * Returns pending promise if initialization is in progress
   * Rejects if not initialized and no initialization is in progress
   *
   * @example
   * await content.ready; // Wait for initialization
   * Now ready to use
   */
  get ready(): Promise<void> {
    if (this._initialized) return Promise.resolve();
    if (this._initPromise) return this._initPromise;
    return Promise.reject(
      new Error('TailorContent not initialized. Call init() first.'),
    );
  }

  get analyzer(): ContentAnalyzer {
    if (this._analyzer) return this._analyzer;
    if (!this.contentAnalysis) throw new Error('No content analysis!');
    const analysisTarget = new Set(this.contentAnalysis.repositoryIds);
    const repos = this.all()
      .where((r) => analysisTarget.has(r.uid))
      .where((r) => r.hasRecommendationMetadata());
    const metaByRepoId = new Map<string, ContentMeta>();
    for (const repo of repos) {
      metaByRepoId.set(repo.uid, repo.recommendationMetadata!);
    }
    this._analyzer = new ContentAnalyzer(metaByRepoId, this.contentAnalysis);
    return this._analyzer;
  }

  get profiler(): LearnerProfiler {
    if (this._profiler) return this._profiler;
    if (!this.aiProvider) throw new Error('No AI provider configured.');
    this._profiler = new LearnerProfiler(
      this.analyzer, this.aiProvider, { logger: this.logger },
    );
    return this._profiler;
  }

  get activity(): ProfileUpdater {
    if (this._tracking) return this._tracking;
    const typeMap: Record<string, string> = {
      Repository: 'repository',
      Activity: 'activity',
      ContentContainer: 'container',
    };
    const nodeResolver = (nodeId: string) => {
      try {
        const result = this.findNode(nodeId);
        return {
          repositoryId: result.repository.uid,
          nodeType: (typeMap[result.entityType] || 'element') as any,
        };
      } catch {
        return undefined;
      }
    };
    this._tracking = new ProfileUpdater(this.analyzer.getContentMeta(), {
      nodeResolver,
      trackDifficulty: false,
      maxRecentTags: 10,
    });
    return this._tracking;
  }

  /**
   * Check if content analysis is complete and ready
   * Analysis is ready when all three components exist:
   * - contentAnalysis (tag distribution, difficulty, etc.)
   * - profilingQuestions (generated survey questions)
   * - contentAnalysisAt (timestamp of analysis)
   */
  get hasAnalysis(): boolean {
    return !!(
      this.contentAnalysis &&
      this.profilingQuestions &&
      this.contentAnalysisAt
    );
  }

  // ============================================================================
  // REPOSITORY ACCESS
  // ============================================================================

  /**
   * Get all repositories as a collection
   * Returns a RepositoryCollection with query methods for filtering and lookup
   *
   * @returns RepositoryCollection with helper methods
   *
   * @example
   * Get all repositories
   * const repos = content.all()
   *
   * @example
   * Get repositories accessible by user (use view)
   * const userView = content.forUser(123)
   * const userRepos = userView.all()
   */
  all(): RepositoryCollection {
    return new RepositoryCollection(this.repositories);
  }

  /**
   * Get the catalog collection for querying repository metadata
   * The catalog is cached after first load for performance
   * Use force option to reload from source
   *
   * @param options - Load options
   * @param options.force - Force reload the catalog from source
   * @returns Promise resolving to CatalogCollection
   *
   * @example
   * Get all catalog entries
   * const catalog = await content.getCatalog()
   *
   * @example
   * Get catalog filtered by user access (use view)
   * const userView = content.forUser(123)
   * const catalog = await userView.getCatalog()
   */
  async getCatalog(options?: { force?: boolean }): Promise<CatalogCollection> {
    if (this._catalog && !options?.force) {
      return this._catalog;
    }
    const catalog = await this.garment.api.getCatalog();
    this._catalog = catalog;
    return catalog;
  }

  // ============================================================================
  // SYNC & REFRESH
  // ============================================================================

  /**
   * Check if any repositories have newer publishedAt in the catalog
   * Fetches fresh catalog and caches it for subsequent operations
   * @returns Promise resolving to true if there are published changes
   */
  async hasPublishedChanges(): Promise<boolean> {
    try {
      // Fetch fresh catalog to detect changes
      const catalog = await this.getCatalog({ force: true });
      const hasNewerPublishedAt = this.repositories.some((it) => {
        const entry = catalog.find(it.id);
        if (!entry) return true;
        return entry.isUpdated(it);
      });
      if (hasNewerPublishedAt) return true;
      return this.repositories.length !== catalog.count();
    } catch (err) {
      this.logger.error('Failed to check for published changes');
      this.logger.error(err);
      // If we can't check, assume we need update
      return true;
    }
  }

  /**
   * Sync repositories that have changed based on catalog publishedAt
   * Force-refreshes catalog to ensure we detect all changes
   */
  async syncChangedRepositories(): Promise<void> {
    const log = this.scopedLog('Sync changed repositories');
    const formatDate = (d?: string | Date | null) =>
      d ? new Date(d).toISOString().slice(0, 19) : 'never';

    const catalog = await this.getCatalog({ force: true });
    const catalogEntries = catalog.all();
    const toStatusId = (it) => `${it?.uid}@${formatDate(it?.publishedAt)}`;
    const catalogIds = catalogEntries.map(toStatusId);
    const instanceIds = this.repositories.map(toStatusId);
    const summary = [
      `Catalog: ${catalogEntries.length}, Instance: ${this.repositories.length}`,
      `Catalog: ${catalogIds.join(', ') || 'empty'}`,
      `Instance: ${instanceIds.join(', ') || 'empty'}`,
    ];
    log.info(summary.join(' | '));

    const entriesToLoad: CatalogEntry[] = [];
    const updates: string[] = [];
    const additions: string[] = [];
    const deletions: string[] = [];

    // Check existing repositories for updates or deletions
    const getVersionChangeDesc = (v1, v2) =>
      `${v1.uid} ${formatDate(v1.publishedAt)} → ${formatDate(v2.publishedAt)}`;

    for (const it of this.repositories) {
      const entry = catalog.find(it.id);
      if (!entry) {
        deletions.push(toStatusId(it));
        continue;
      }
      if (entry.isUpdated(it)) {
        entriesToLoad.push(entry);
        updates.push(getVersionChangeDesc(it, entry));
      }
    }

    // Check for new repositories in catalog
    for (const entry of catalogEntries) {
      const existing = this.all().find(entry.id);
      if (!existing) {
        entriesToLoad.push(entry);
        additions.push(toStatusId(entry));
      }
    }

    // Log detection results
    if (updates.length) log.info(`Updates: ${updates.join(', ')}`);
    if (additions.length) log.info(`New: ${additions.join(', ')}`);
    if (deletions.length) log.info(`Removed: ${deletions.join(', ')}`);

    const hasChanges = entriesToLoad.length > 0 || deletions.length > 0;
    if (!hasChanges) {
      log.info('No changes detected');
      return;
    }

    const failedIds = new Set<number>();
    let successful: Repository[] = [];

    // Load updated/new repositories
    if (entriesToLoad.length > 0) {
      log.info(`Loading ${entriesToLoad.length} repositories...`);
      const loadingRepositories = entriesToLoad.map(async (entry) => {
        try {
          log.debug(`Loading repository ${entry.id}`);
          return await entry.load({ force: true });
        } catch (err: any) {
          log.warn(`Failed to load repository ${entry.id}: ${err?.message}`);
          failedIds.add(entry.id);
          return null;
        }
      });

      const loaded = await Promise.all(loadingRepositories);
      successful = loaded.filter((r) => r !== null) as Repository[];

      // NOTE: recommendationMetadata is persisted in S3 bulk but
      // CatalogEntry.load() fetches from Tailor CMS (not S3 bulk),
      // so it's never present on the fresh instance. Carry over from
      // the old in-memory instance to preserve analysis data until
      // re-analysis is triggered (see forceAnalysis / runAnalysis).
      for (const updated of successful) {
        const index = this.repositories.findIndex((r) => r.id === updated.id);
        if (index >= 0) {
          const old = this.repositories[index];
          if (old.recommendationMetadata) {
            updated.recommendationMetadata = old.recommendationMetadata;
          }
          this.repositories[index] = updated;
        } else {
          this.repositories.push(updated);
        }
      }
    }

    // Remove repositories that failed or are no longer in catalog
    const keepCond = (it) => catalog.find(it.id) && !failedIds.has(it.id);
    this.repositories = this.repositories.filter(keepCond);

    this.rebuildIndices();
    this.updatePublishedAt();
    await this.refreshAccessManager();
    await this.save({ force: true });

    const completionDesc: string[] = [];
    if (successful.length) completionDesc.push(`${successful.length} loaded`);
    if (failedIds.size) completionDesc.push(`${failedIds.size} failed`);
    if (deletions.length) completionDesc.push(`${deletions.length} removed`);
    log.info(`Complete - ${completionDesc.join(', ')}`);
  }

  /**
   * Refresh content if stale (rate-limited to every 10 minutes)
   * Checks for published changes and syncs if needed
   * Can be called in non-blocking mode (void promise) or awaited
   * @returns Promise that resolves when refresh check completes
   *
   * @example
   * Non-blocking refresh (fire and forget)
   * void content.throttledSync()
   *
   * @example
   * Blocking refresh (wait for completion)
   * await content.throttledSync()
   */
  async throttledSync(): Promise<void> {
    const log = this.scopedLog('throttledSync');
    const now = Date.now();
    const intervalSec = TailorContent.CATALOG_CHECK_INTERVAL / 1000;
    const isFirstCheck = !this._lastCatalogCheckAt;

    if (!isFirstCheck) {
      const timeSinceCheck = now - this._lastCatalogCheckAt!.getTime();
      const sinceSec = Math.round(timeSinceCheck / 1000);
      if (timeSinceCheck < TailorContent.CATALOG_CHECK_INTERVAL) {
        log.info(`Skipped ${sinceSec}s since last (interval: ${intervalSec}s)`);
        return;
      }
      log.info(`Proceeding - ${sinceSec}s since last check`);
    } else {
      log.info('First check');
    }

    this._lastCatalogCheckAt = new Date(now);
    try {
      const needsUpdate = await this.hasPublishedChanges();
      if (needsUpdate) {
        await this.syncChangedRepositories();
      }
    } catch (err) {
      // Don't re-throw - this runs in background (void), so unhandled rejection would crash
      log.error(`Failed: ${err}`);
    }
  }

  /**
   * Log init completion with telemetry stats
   * @param context - Logger context
   * @param start - Start timestamp
   * @param message - Simple message for non-telemetry mode
   */
  private logInitComplete(
    context: string,
    start: number,
    message: string,
  ): void {
    if (!this.logger.isTelemetryEnabled) {
      this.logger.debug(`${context} ${message}`);
      return;
    }
    const duration = Date.now() - start;
    const stats = this.getStats();
    const total = stats.activities + stats.containers + stats.elements;
    this.logger.debug(
      `${context} ${message} in ` +
        `${this.logger.formatDuration(duration)} ` +
        `(${stats.repositories} repos, ${total} entities)`,
    );
  }

  /**
   * Update publishedAt to the latest publishedAt from all repositories
   * Called after loading or updating repositories
   */
  private updatePublishedAt(): void {
    this.publishedAt = this.all().getMaxPublishedAt();
  }

  // ============================================================================
  // PRIVATE LOADING & STATE MANAGEMENT
  // ============================================================================

  /**
   * Load content data from bulk export with zstd compression
   * @returns true if bulk exists and was loaded, false otherwise
   */
  private async loadFromBulk(): Promise<boolean> {
    try {
      const path = `${this.envPath}/bulk.json.zst`;
      const context = this.getLogContext();
      this.logger.debugOperation(context, `Attempting bulk load from ${path}`);
      const { raw } = await this.garment.api.getObject(path);
      const decompressed = decompressJSON(raw);
      const loadedContent = TailorContent.fromJSON(decompressed);
      // Copy loaded data to this instance
      this.repositories = loadedContent.repositories;
      this.publishedAt = loadedContent.publishedAt;
      this.contentAnalysis = loadedContent.contentAnalysis;
      this.profilingQuestions = loadedContent.profilingQuestions;
      this.contentAnalysisAt = loadedContent.contentAnalysisAt;
      // Track size metrics
      this._bulkCompressedSize = raw.length;
      // Calculate JSON size from the parsed object
      this._bulkJsonSize = Buffer.byteLength(JSON.stringify(decompressed));

      this.handleBulkLoadState();
      this.logger.debugOperation(context, 'Bulk load successful');
      return true;
    } catch (err: any) {
      // Bulk doesn't exist or failed to load
      const context = this.getLogContext();
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        this.logger.debugOperation(context, 'Bulk file not found');
      } else {
        const errMsg = `Bulk load failed: ${err.message || err}`;
        this.logger.debugOperation(context, errMsg);
        if (err.stack) {
          this.logger.debugOperation(context, `Stack: ${err.stack}`);
        }
      }
      return false;
    }
  }

  /**
   * Load all repositories from catalog entries
   * Fetches fresh catalog and caches it for subsequent operations
   * If catalog doesn't exist, initializes with empty repositories array
   */
  private async loadFromCatalog(options?: LoadOptions): Promise<void> {
    try {
      // Fetch fresh catalog and cache for subsequent use
      const catalog = await this.getCatalog({ force: true });
      // Load all repos (deep load by default)
      this.repositories = await catalog.load({
        force: true,
        ...options,
      });
    } catch (err: any) {
      // If catalog doesn't exist (NoSuchKey), initialize with empty array
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        const msg = 'Catalog not found, initializing with empty list';
        console.log(`[TailorContent] ${msg}`);
        this.repositories = [];
        // Clear catalog cache since there's no catalog
        this._catalog = undefined;
        return;
      }
      // Re-throw other errors
      throw err;
    }
    // Update publishedAt to the latest from all repos
    this.updatePublishedAt();
  }

  /**
   * Handle loading state for content and all nested entities after bulk
   * loading. Marks TailorContent as clean and delegates to each Repository
   * to handle its own state
   */
  private handleBulkLoadState(): void {
    this.markClean();
    this.clearSigningState();
    // Let each repository handle its own bulk load state
    if (!this.repositories?.length) return;
    for (const repository of this.repositories) {
      repository.handleBulkLoadState();
    }
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  /**
   * Save the entire content with all repositories to S3 as bulk export
   * Ensures content is fully loaded before saving
   * Stores as 'repository/bulk.json.zst' with zstd compression
   * Skips saving if entity is not dirty unless force is true
   *
   * @param options - Save options
   * @param options.force - Force save even if not dirty (default: false)
   * @param options.raw - Save raw JSON alongside compressed (default: false)
   * @returns Promise that resolves when saved
   *
   * @example
   * Save with zstd compression (~18-20MB for 100MB JSON)
   * await content.save()
   *
   * @example
   * Save both compressed and raw JSON for debugging
   * await content.save({ raw: true })
   */
  async save(options: { force?: boolean; raw?: boolean } = {}): Promise<void> {
    // Skip if not dirty unless force is true
    if (!this.isDirty && !options.force) {
      const context = this.getLogContext();
      this.logger.debug(`${context} Skipping save - no changes`);
      return;
    }

    const start = Date.now();
    const context = this.getLogContext();
    this.logger.debug(`${context} Saving bulk export to S3`);

    const data = this.toStorage();
    const json = JSON.stringify(data);
    const compressed = compressJSON(json);

    // Save compressed and optionally raw in parallel
    const saves = [
      this.garment.api.saveObject(`${this.envPath}/bulk.json.zst`, compressed),
    ];

    if (options.raw) {
      saves.push(
        this.garment.api.saveObject(`${this.envPath}/bulk.json`, json),
      );
    }

    await Promise.all(saves);

    // Track size metrics
    this._bulkJsonSize = Buffer.byteLength(json);
    this._bulkCompressedSize = compressed.length;

    // Mark as clean after successful save
    this.markClean();

    if (!this.logger.isTelemetryEnabled) {
      this.logger.debug(`${context} Saved bulk export to S3`);
      return;
    }
    const duration = Date.now() - start;
    const jsonSize = Buffer.byteLength(json);
    const ratio = ((1 - compressed.length / jsonSize) * 100).toFixed(0);
    const rawInfo = options.raw ? ' + raw JSON' : '';
    this.logger.debug(
      `${context} Saved in ${this.logger.formatDuration(duration)} ` +
        `(${this.logger.formatSize(jsonSize)} → ` +
        `${this.logger.formatSize(compressed.length)}, ${ratio}%)${rawInfo}`,
    );
  }

  // ============================================================================
  // SEARCH & TRAVERSAL
  // ============================================================================

  /**
   * Search for ContentElements across all repositories
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (repositoryUid filter, limit)
   * @returns Array of search results with entity and context
   *
   * @example
   * Find all MUX_VIDEO elements
   * const videos = content.findElements({ type: 'MUX_VIDEO' })
   *
   * @example
   * Find elements with predicate and limit
   * const recent = content.findElements(
   *   el => el.type === 'MUX_VIDEO' && el.createdAt > new Date('2024-01-01'),
   *   { limit: 10 }
   * )
   *
   * @example
   * Find elements in specific repository
   * const videos = content.findElements(
   *   { type: 'MUX_VIDEO' },
   *   { repositoryUid: 'repo_abc123' }
   * )
   */
  findElements(
    criteria: SearchCriteria | SearchPredicate<ContentElement>,
    options?: SearchOptions,
  ): SearchResult<ContentElement>[] {
    return this.search('ContentElement', criteria, options);
  }

  /**
   * Search for ContentContainers across all repositories
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (repositoryUid filter, limit)
   * @returns Array of search results with entity and context
   *
   * @example
   * Find all ASSESSMENT containers
   * const assessments = content.findContainers({ type: 'ASSESSMENT' })
   *
   * @example
   * Find containers with limit
   * const containers = content.findContainers({ type: 'ASSESSMENT' }, { limit: 5 })
   */
  findContainers(
    criteria: SearchCriteria | SearchPredicate<ContentContainer>,
    options?: SearchOptions,
  ): SearchResult<ContentContainer>[] {
    return this.search('ContentContainer', criteria, options);
  }

  /**
   * Search for Activities across all repositories
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (repositoryUid filter, limit)
   * @returns Array of search results with entity and context
   *
   * @example
   * Find all activities of specific type
   * const lessons = content.findActivities({ type: 'LESSON' })
   *
   * @example
   * Find activities in specific repository
   * const lessons = content.findActivities(
   *   { type: 'LESSON' },
   *   { repositoryUid: 'repo_abc123', limit: 10 }
   * )
   */
  findActivities(
    criteria: SearchCriteria | SearchPredicate<Activity>,
    options?: SearchOptions,
  ): SearchResult<Activity>[] {
    return this.search('Activity', criteria, options);
  }

  /**
   * Search for Repositories in content
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (limit only, repositoryUid doesn't apply)
   * @returns Array of search results with entity and context
   *
   * @example
   * Find repositories by schema
   * const courses = content.findRepositories({ schema: 'course' })
   *
   * @example
   * Find repositories with limit
   * const courses = content.findRepositories({ schema: 'course' }, { limit: 5 })
   */
  findRepositories(
    criteria: SearchCriteria | SearchPredicate<Repository>,
    options?: SearchOptions,
  ): SearchResult<Repository>[] {
    return this.search('Repository', criteria, options);
  }

  /**
   * Generic search across all repositories
   * @param entityType - Type of entity to search for
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (repositoryUid filter, limit)
   * @returns Array of search results with entity and context
   *
   * @example
   * Search for specific entity type
   * const results = content.search('ContentElement', { type: 'MUX_VIDEO' })
   *
   * @example
   * Complex search with predicate
   * const results = content.search('ContentElement', element =>
   *   element.type === 'HTML' &&
   *   element.data?.content?.includes('special-class')
   * )
   *
   * @example
   * Search with repository filter and limit
   * const results = content.search(
   *   'ContentElement',
   *   { type: 'MUX_VIDEO' },
   *   { repositoryUid: 'repo_abc123', limit: 10 }
   * )
   */
  search(
    entityType: SearchEntityType,
    criteria: SearchCriteria | SearchPredicate<any>,
    options?: SearchOptions,
  ): SearchResult[] {
    const predicate = this.buildPredicate(criteria);
    // Use indexed entity collections for efficient O(m) search
    // where m = entities of the specified type (not all entities)
    let results: SearchResult[];
    switch (entityType) {
      case 'Repository':
        // Special case: Repository is entity and repository context
        results = this.repositories.filter(predicate).map((entity) => ({
          entity,
          repository: entity,
          repositoryId: entity.id,
          repositoryUid: entity.uid,
          entityType: 'Repository' as const,
        }));
        break;
      case 'Activity':
        results = searchIndex(this.activityIndex, predicate, 'Activity');
        break;
      case 'ContentContainer':
        results = searchIndex(
          this.containerIndex,
          predicate,
          'ContentContainer',
        );
        break;
      case 'ContentElement':
        results = searchIndex(this.elementIndex, predicate, 'ContentElement');
        break;
      default:
        results = [];
    }

    // Apply repository filter
    if (options?.repositoryUid) {
      results = results.filter(
        (r) => r.repositoryUid === options.repositoryUid,
      );
    }

    // Apply limit
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Build predicate function from criteria
   */
  private buildPredicate<T>(
    cond: SearchCriteria | SearchPredicate<T>,
  ): (entity: T) => boolean {
    if (typeof cond === 'function') return cond as SearchPredicate<T>;
    // Object-style criteria - match all properties
    return (entity: T) => {
      return Object.entries(cond).every(([key, value]) => {
        return (entity as any)[key] === value;
      });
    };
  }

  /**
   * Get total count of all entities by type
   * Useful for statistics and monitoring
   * Uses pre-built indices for O(1) counting
   * @returns Object with counts for each entity type
   */
  getStats(): ContentStats {
    const stats: ContentStats = {
      repositories: this.repositories.length,
      activities: this.activityIndex.length,
      containers: this.containerIndex.length,
      elements: this.elementIndex.length,
    };
    // Add bulk storage metrics if available
    if (this._bulkJsonSize && this._bulkCompressedSize) {
      const ratio = (1 - this._bulkCompressedSize / this._bulkJsonSize) * 100;
      stats.bulk = {
        jsonSize: this._bulkJsonSize,
        compressedSize: this._bulkCompressedSize,
        compressionRatio: ratio.toFixed(1),
      };
    }
    return stats;
  }

  // ============================================================================
  // ENTITY INDEX OPERATIONS
  // ============================================================================

  /**
   * Get indexed activities with repository context
   * Builds index lazily on first access for optimal performance
   * Flattens repo.structure arrays and maintains repository references
   */
  private get activityIndex(): IndexedEntity<Activity>[] {
    if (!this._activityIndex) {
      this._activityIndex = extractActivities(this.repositories);
    }
    return this._activityIndex;
  }

  /**
   * Get indexed containers with repository context
   * Builds index lazily on first access for optimal performance
   * Recursively flattens all containers (including nested) from all activities
   */
  private get containerIndex(): IndexedEntity<ContentContainer>[] {
    if (!this._containerIndex) {
      this._containerIndex = extractContainers(this.repositories);
    }
    return this._containerIndex;
  }

  /**
   * Get indexed elements with repository context
   * Builds index lazily on first access for optimal performance
   * Recursively flattens all elements from all containers (including nested)
   */
  private get elementIndex(): IndexedEntity<ContentElement>[] {
    if (!this._elementIndex) {
      this._elementIndex = extractElements(this.repositories);
    }
    return this._elementIndex;
  }

  /**
   * Get entity index for O(1) entity access by UID
   * Builds map lazily from per-type entity indices
   * Reuses IndexedEntity objects from indices to avoid wrapper object
   * duplication
   */
  private get entityIndex(): Map<string, AnyIndexedEntity> {
    if (!this._entityIndex) {
      this._entityIndex = new Map();
      // Index repositories by UID
      for (const repository of this.repositories) {
        if (!repository?.uid) continue;
        // Create IndexedEntity where repository is both entity and context
        this._entityIndex.set(repository.uid, {
          entity: repository,
          repository,
        });
      }
      // Index activities by UID
      for (const item of this.activityIndex) {
        if (item.entity.uid) this._entityIndex.set(item.entity.uid, item);
      }
      // Index containers by UID
      for (const item of this.containerIndex) {
        if (item.entity.uid) this._entityIndex.set(item.entity.uid, item);
      }
      // Index elements by UID
      for (const item of this.elementIndex) {
        if (item.entity.uid) this._entityIndex.set(item.entity.uid, item);
      }
    }
    return this._entityIndex;
  }

  /**
   * Rebuild entity indices (call after adding/removing/updating repositories)
   * Clears all cached indices including the entity UID index
   * Forces rebuild on next access
   * Note: Does not clear catalog cache - catalog is repository metadata,
   * not entity indices
   */
  rebuildIndices(): void {
    this._activityIndex = undefined;
    this._containerIndex = undefined;
    this._elementIndex = undefined;
    this._entityIndex = undefined;
  }

  /**
   * Find any entity (node) by UID across all repositories with O(1) lookup
   * Uses entity index for fast retrieval with repository context
   *
   * @param uid - Entity UID to search for
   * @returns The entity with repository context
   * @throws Error if entity not found
   *
   * @example
   * Find element by UID
   * const result = content.findNode('ce_abc123')
   */
  findNode(uid: string): SearchResult {
    // Use entity index for O(1) lookup with repository context
    const result = this.entityIndex.get(uid);
    if (!result) throw new Error(`Entity with UID ${uid} not found`);

    const { entity, repository } = result;
    return {
      entity,
      repository,
      repositoryId: repository.id,
      repositoryUid: repository.uid,
      entityType: getEntityType(entity),
    };
  }

  // ============================================================================
  // ACCESS CONTROL
  // ============================================================================

  /**
   * Get access manager for querying users, groups, and permissions
   * @returns AccessManager instance with utility methods
   *
   * @example
   * Get all users across repositories
   * const access = content.getAccessManager()
   * await access.loadAll()
   * const users = access.getUsers()
   *
   * @example
   * Check if user has repository access
   * const hasAccess = access.hasRepositoryAccess(userId, repositoryId)
   *
   * @example
   * Get users in a specific group
   * const groupUsers = access.getUsers(groupId)
   */
  getAccessManager(): AccessManager {
    return new AccessManager(this.repositories);
  }

  /**
   * Initialize access manager for permission filtering
   * Loads access data for all repositories
   * Automatically called by init() unless initAccess: false
   *
   * @example
   * Manual initialization
   * await content.initAccessManager()
   */
  async initAccessManager(): Promise<void> {
    if (!this._accessManager) {
      this._accessManager = new AccessManager(this.repositories);
      await this._accessManager.loadAll();
      this.logger.debug('Access manager initialized');
    }
  }

  /**
   * Refresh access manager after repository changes
   * Loads access data for new repositories and rebuilds indices
   * Initializes access manager if not already initialized
   */
  private async refreshAccessManager(): Promise<void> {
    if (!this._accessManager) {
      this._accessManager = new AccessManager(this.repositories);
    }
    await this._accessManager.loadAll();
  }

  /**
   * Update repository access from payload (e.g. webhook)
   * Updates in-memory state and rebuilds AccessManager indices
   *
   * @param repositoryId - Repository ID to update
   * @param accessData - New access data from webhook payload
   */
  updateRepositoryAccess(
    repositoryId: number,
    accessData: RepositoryAccessData,
  ): void {
    const repo = this.repositories.find((r) => r.id === repositoryId);
    if (!repo) {
      this.logger.warn(
        `Repository ${repositoryId} not found, skipping access update`,
      );
      return;
    }
    repo.access = accessData;
    void repo.save({ force: true });

    if (this._accessManager) this._accessManager.rebuild();
    this.logger.debug(`Updated access for repository ${repositoryId}`);
  }

  /**
   * Create filtered view for user
   * Returns lightweight wrapper (~1KB) that filters all queries
   *
   * @param userId - User ID to filter by
   * @returns TailorContentView with automatic access filtering
   *
   * @example
   * const userView = content.forUser(123);
   * const repos = userView.all();
   * const videos = userView.findElements({ type: 'VIDEO' });
   */
  forUser(userId: number): TailorContentView {
    if (!this._accessManager) {
      throw new Error('Access manager not initialized');
    }
    const repos = this._accessManager.getUserRepositories(userId);
    return new TailorContentView(this, { userId }, repos);
  }

  /**
   * Create filtered view for group
   *
   * @param groupId - Group ID to filter by
   * @returns TailorContentView with automatic access filtering
   *
   * @example
   * const groupView = content.forGroup(5);
   * const repos = groupView.all();
   */
  forGroup(groupId: number): TailorContentView {
    if (!this._accessManager) {
      throw new Error('Access manager not initialized');
    }
    const repos = this._accessManager.getGroupRepositories(groupId);
    return new TailorContentView(this, { groupId }, repos);
  }

  /**
   * Create filtered view for user by email
   *
   * @param email - User email to filter by
   * @returns TailorContentView with automatic access filtering
   *
   * @example
   * const emailView = content.forEmail('user@example.com');
   * const repos = emailView.all();
   */
  forEmail(email: string): TailorContentView {
    if (!this._accessManager) {
      throw new Error('Access manager not initialized');
    }
    const user = this._accessManager.getUsers().find((u) => u.email === email);
    const repos = user ? this._accessManager.getUserRepositories(user.id) : [];
    return new TailorContentView(this, { userEmail: email }, repos);
  }

  // ============================================================================
  // CONTENT ANALYSIS & RECOMMENDATION ENGINE
  // ============================================================================
  //
  // The recommendation engine provides AI-powered content analysis, learner
  // profiling, and personalized recommendations.
  //
  // IMPORTANT: AI Provider Required
  // Must pass aiProvider in constructor to use recommendation features:
  //
  //   const content = new TailorContent({ garment, aiProvider });
  //   await content.analyzeContent();
  //
  // All methods throw an error if no AI provider is configured.
  //
  // ============================================================================

  /**
   * Generate recommendation metadata for all repositories
   * Call this once after loading repositories to enable recommendations
   * Only generates metadata for repositories that don't have it yet
   *
   * @param options - Generation options (progress callback, concurrency)
   * @returns Promise that resolves when generation is complete
   * @throws Error if no AI provider is configured in constructor
   *
   * @example
   * const content = new TailorContent({ garment, aiProvider });
   * await content.analyzeContent();
   *
   * @example
   * With progress tracking
   * await content.analyzeContent({
   *   onProgress: (done, total) => console.log(`${done}/${total}`)
   * });
   */
  async analyzeContent(options?: {
    onProgress?: (completed: number, total: number) => void;
    repositoryIds?: string[];
    force?: boolean;
    concurrency?: number;
  }): Promise<void> {
    // If force analysis requested, wait for any ongoing analysis to finish
    // then run the force analysis (don't deduplicate force into non-force)
    if (this._analysisPromise) {
      if (options?.force) {
        const msg = 'Analysis already in progress, will force after completion';
        this.logger.info(msg);
        try {
          await this._analysisPromise;
        } catch {
          // Ignore errors from ongoing analysis
        }
      } else {
        this.logger.info('Analysis already in progress, waiting for completion');
        return this._analysisPromise;
      }
    }
    // Check if analysis is needed (unless force is true)
    if (!options?.force) {
      const reason = await this._checkAnalysisNeeded(options?.repositoryIds);
      if (!reason) {
        this.logger.info('Content analysis up to date, skipping');
        return;
      }
      this.logger.info(`Starting analysis (${reason})`);
    }
    // Create analysis promise and store it
    this._analysisPromise = this._analyzeContent(options);
    try {
      await this._analysisPromise;
    } finally {
      this._analysisPromise = undefined;
    }
  }

  /**
   * Check if analysis is needed based on repository changes
   * @returns Reason string if analysis needed, null if up to date
   */
  private async _checkAnalysisNeeded(
    repositoryIds?: string[],
  ): Promise<string | null> {
    await this.ready;
    // No existing analysis
    if (!this.contentAnalysis || !this.contentAnalysisAt) {
      return 'no existing analysis';
    }
    const currentRepoIds = repositoryIds?.length
      ? repositoryIds
      : this.all().map((r) => r.uid);
    const previousRepoIds = new Set(this.contentAnalysis.repositoryIds || []);
    const currentRepoSet = new Set(currentRepoIds);

    // Repository set changed
    const idsChanged =
      previousRepoIds.size !== currentRepoSet.size ||
      !currentRepoIds.every((id) => previousRepoIds.has(id));
    if (idsChanged) return 'repository set changed';

    // Check if any repository was published after analysis
    const analysisTimestamp = this.contentAnalysisAt.getTime();
    const filter = currentRepoIds.length ? new Set(currentRepoIds) : null;
    const repos = filter
      ? this.all().where((r) => filter.has(r.uid))
      : this.all();
    for (const repo of repos) {
      if (
        repo.publishedAt &&
        new Date(repo.publishedAt).getTime() > analysisTimestamp
      ) {
        return `repository ${repo.uid} published after analysis`;
      }
    }
    return null;
  }

  private async _analyzeContent(options?: {
    onProgress?: (completed: number, total: number) => void;
    repositoryIds?: string[];
    force?: boolean;
    concurrency?: number;
  }): Promise<void> {
    if (!this.aiProvider) throw new Error('No AI provider configured');

    const start = Date.now();
    const context = this.getLogContext();

    // Ensure content is loaded
    await this.ready;

    // Filter repositories by IDs if specified
    const filter = options?.repositoryIds?.length
      ? new Set(options.repositoryIds)
      : null;
    const repos = filter
      ? this.all().where((r) => filter.has(r.uid))
      : this.all();

    if (repos.isEmpty()) {
      const suffix = filter
        ? ` with specified IDs ${[...filter].join(', ')}`
        : '';
      this.logger.warn('No repositories found' + suffix);
      return;
    }
    if (filter) {
      this.logger.info(`${context} Targeting ${repos.count()} repositories`);
    }

    // Split repos by metadata status
    const needsMetadata = options?.force
      ? repos
      : repos.where((r) => !r.hasRecommendationMetadata());
    const hasMetadataCount = options?.force
      ? 0
      : repos.where((r) => r.hasRecommendationMetadata()).count();

    // Step 1: Generate metadata for repositories
    let successCount = 0;
    let failCount = 0;
    if (!needsMetadata.isEmpty() || options?.force) {
      const action = !hasMetadataCount
        ? 'all'
        : `${needsMetadata.count()} repositories out of ${repos.count()}`;
      this.logger.info(`${context} Generating metadata for ${action}`);
      const metaGenerationStart = Date.now();
      const generator = new MetadataGenerator(
        this.aiProvider,
        { concurrency: options?.concurrency },
        this.logger,
      );
      const metadataMap = await generator.generateBatch([...needsMetadata], {
        onProgress: options?.onProgress,
        force: options?.force,
      });
      const metaGenerationDuration = Date.now() - metaGenerationStart;
      successCount = metadataMap.size;
      failCount = needsMetadata.count() - successCount;
      this.logger.debug(
        `${context} Metadata: ${successCount} success / ${failCount} failed ` +
          `in ${this.logger.formatDuration(metaGenerationDuration)}`,
      );
      // NOTE: Only assign metadata when generation succeeded. If metadataMap
      // doesn't contain an entry (generation failed), skip to avoid overriding
      // existing recommendationMetadata with undefined.
      for (const repository of needsMetadata) {
        const meta = metadataMap.get(repository.uid);
        if (meta) {
          repository.recommendationMetadata = meta;
          await repository.save({ force: true });
        }
      }
    } else {
      const msg = `${context} All ${repos.count()} repositories have metadata`;
      this.logger.info(msg);
    }

    // Step 2: Generate profiling survey if not present (per repository)
    let profilingSurveyCount = 0;
    if (!needsMetadata.isEmpty()) {
      const msg = `Generating survey for ${needsMetadata.count()} repositories`;
      this.logger.debug(`${context} ${msg}`);
      for (const repository of needsMetadata) {
        if (!repository.recommendationMetadata) continue;
        try {
          const singleRepoMeta = new Map([
            [repository.uid, repository.recommendationMetadata],
          ]);
          const analyzer = new ContentAnalyzer(singleRepoMeta);
          const profiler = new LearnerProfiler(
            analyzer, this.aiProvider, { logger: this.logger },
          );
          const questions = await profiler.generateQuestions();
          repository.profilingQuestions = questions;
          await repository.save({ force: true });
          profilingSurveyCount++;
          this.logger.debugOperation(
            context,
            `Generated ${questions.length} questions for ${repository.uid}`,
          );
        } catch (error) {
          const msg = `Failed to generate questions for ${repository.uid}`;
          this.logger.warn(`${context} ${msg}: ${error}`);
        }
      }
    }

    // Step 3: Compute global/aggregated analysis
    const withMetadata = repos.where((r) => r.hasRecommendationMetadata());
    if (withMetadata.isEmpty()) {
      const msg = `No repositories have metadata, skipping global analysis...`;
      this.logger.warn(`${context} ${msg}`);
      return;
    }
    const msg = `Global 📊 from ${withMetadata.count()} repositories`;
    this.logger.info(`${context} ${msg}`);
    // This will generate and store top-level contentAnalysis and profiling
    // questions based on the tag/category/difficulty distribution
    const analysis = await this.generateDistributedAnalysis({
      repositoryIds: repos.map((r) => r.uid),
    });
    if (!analysis.contentAnalysis) {
      this.logger.warn(`${context} Global analysis generation failed`);
    }
    this.profilingQuestions = analysis.profilingQuestions;
    this.contentAnalysis = analysis.contentAnalysis;
    this.contentAnalysisAt = new Date();
    this._analyzer = undefined;
    this._profiler = undefined;
    this._tracking = undefined;
    await this.save({ force: true });
    const duration = Date.now() - start;
    const totalAnalyzed = withMetadata.count();
    const newlyProcessed = needsMetadata.count();
    this.logger.info(
      `${context} Complete: ${totalAnalyzed} repos analyzed ` +
        `(${newlyProcessed} newly processed) ` +
        `in ${this.logger.formatDuration(duration)} ` +
        `(${profilingSurveyCount} with questions)`,
    );
  }

  /**
   * TODO: Currently repository filtering is not going to be used unless
   * force is true. Later we may want to support partial analysis
   *
   * Get recommendation engine with analyzer and profiler
   * Builds analyzer and profiler on-demand from repository metadata
   * Computes and caches contentAnalysis and profilingQuestions if not present
   *
   * @returns Promise resolving to { analyzer, profiler, contentAnalysis, profilingQuestions }
   * @throws Error if no metadata found (call analyzeContent first)
   * @throws Error if no AI provider configured in constructor
   *
   * @example
   * const content = new TailorContent({ garment, aiProvider });
   * const { profiler, contentAnalysis } = await content.generateDistributedAnalysis();
   */
  async generateDistributedAnalysis({
    repositoryIds,
  }: {
    repositoryIds?: string[];
  }): Promise<{
    contentAnalysis: AggregatedContentAnalysis;
    profilingQuestions: ProfileQuestion[];
  }> {
    const context = this.getLogContext();
    if (!this.aiProvider) throw new Error('No AI provider configured');

    // Filter repositories by IDs if specified
    const filter = repositoryIds?.length ? new Set(repositoryIds) : null;
    const repos = filter
      ? this.all().where((r) => filter.has(r.uid))
      : this.all();

    if (filter && repos.isEmpty()) {
      throw new Error(`No repositories found for: ${[...filter].join(', ')}`);
    }

    // Build metadata map from target repositories
    const withMetadata = repos.where((r) => r.hasRecommendationMetadata());
    if (withMetadata.isEmpty()) throw new Error('No recommendation metadata');

    // Log warning if some repos lack metadata
    const withoutMetadata = repos.where((r) => !r.hasRecommendationMetadata());
    if (!withoutMetadata.isEmpty()) {
      this.logger.warn(
        `${context} Computing analysis without metadata from ` +
          `${withoutMetadata.count()} repositories: ` +
          `${withoutMetadata.map((r) => r.uid).join(', ')}`,
      );
    }

    // Build metadata map
    const metaByRepoId = new Map<string, ContentMeta>();
    for (const repo of withMetadata) {
      metaByRepoId.set(repo.uid, repo.recommendationMetadata!);
    }

    // Create analyzer and profiler
    // analyzer holds distribution of tags, categories, difficulties
    // which is a input for onboarding survey generation in profiler
    const analyzer = new ContentAnalyzer(metaByRepoId);
    const profiler = new LearnerProfiler(
      analyzer, this.aiProvider, { logger: this.logger },
    );

    // Compute contentAnalysis and profilingQuestions
    const start = Date.now();
    const startMsg = `Computing recommendation data for ${metaByRepoId.size}`;
    this.logger.info(`${context} ${startMsg} repositories`);

    // Generate content analysis
    const analysisStart = Date.now();
    const contentAnalysis = analyzer.analyze();
    const analysisDuration = Date.now() - analysisStart;
    const tagCount = Object.keys(contentAnalysis.tagDistribution).length;
    this.logger.info(
      `${context} Analysis complete: ${tagCount} unique tags, ` +
        `${Object.keys(contentAnalysis.categoryDistribution).length} ` +
        `categories in ${this.logger.formatDuration(analysisDuration)}`,
    );

    // Generate profiling questions
    this.logger.debug(`${context} Generating profiling questions`);
    const questionStart = Date.now();
    const profilingQuestions = await profiler.generateQuestions();
    const questionDuration = Date.now() - questionStart;
    this.logger.info(
      `${context} Generated ${profilingQuestions.length} profiling questions ` +
        `in ${this.logger.formatDuration(questionDuration)}`,
    );

    const totalDuration = Date.now() - start;
    this.logger.debug(
      `${context} Recommendation data computed: ${metaByRepoId.size} repos, ` +
        `${Object.keys(contentAnalysis.tagDistribution).length} tags, ` +
        `${profilingQuestions.length} questions ` +
        `(total: ${this.logger.formatDuration(totalDuration)})`,
    );
    return {
      contentAnalysis,
      profilingQuestions,
    };
  }

  /**
   * Suggest content for a learner based on their profile
   * Uses learner's interests, preferences, and history to recommend content
   *
   * @param profile - Learner profile with interests and history
   * @param options - Recommendation options (limit, filters, etc.)
   * @returns Promise resolving to content suggestions
   *
   * @example
   * const suggestions = await content.suggestContent(learnerProfile);
   * for (const item of suggestions) {
   *   console.log(item.name, item.score, item.reason);
   * }
   *
   * @example
   * With filters
   * const suggestions = await content.suggestContent(learnerProfile, {
   *   limit: 5,
   *   includeCompleted: false,
   *   onlyInProgress: false,
   * });
   */
  async suggestContent(
    profile: LearnerProfile,
    options?: SuggestContentOptions,
  ): Promise<RelatedContent[]> {
    const context = this.getLogContext();
    const limit = options?.limit ?? 10;
    this.logger.debug(
      `${context} Generating recommendations for learner profile ` +
        `(experienceLevel: ${profile.experienceLevel ?? 'N/A'}, ` +
        `limit: ${limit})`,
    );
    const start = Date.now();
    const suggestions = this.profiler.suggestContent(profile, options);
    const duration = Date.now() - start;
    this.logger.debug(
      `${context} Generated ${suggestions.length} recommendations ` +
        `in ${this.logger.formatDuration(duration)}`,
    );
    return suggestions;
  }

  /**
   * Filter recommendations by repository IDs and other criteria
   * Utility method to refine recommendation results
   *
   * @param recommendations - Recommendations to filter
   * @param filters - Filter criteria
   * @param filters.repositoryIds - Only include these repository IDs
   * @param filters.excludeRepositoryIds - Exclude these repository IDs
   * @param filters.minScore - Minimum match score (0-100)
   * @param filters.maxResults - Maximum number of results to return
   * @returns Filtered recommendations
   *
   * @example
   * Filter by repository
   * const allRecs = await content.suggestContent(profile, aiProvider);
   * const jsRecs = content.filterRecommendations(allRecs, {
   *   repositoryIds: ['js-repo-1', 'js-repo-2']
   * });
   *
   * @example
   * Filter by score
   * const highQuality = content.filterRecommendations(allRecs, {
   *   minScore: 70
   * });
   */
  filterRecommendations(
    recommendations: RelatedContent[],
    filters: {
      repositoryIds?: string[];
      excludeRepositoryIds?: string[];
      minScore?: number;
      maxResults?: number;
    },
  ): RelatedContent[] {
    let filtered = recommendations;

    // Filter by repository IDs (include)
    if (filters.repositoryIds && filters.repositoryIds.length > 0) {
      filtered = filtered.filter((rec) =>
        filters.repositoryIds!.includes(rec.id),
      );
    }

    // Filter by repository IDs (exclude)
    if (
      filters.excludeRepositoryIds &&
      filters.excludeRepositoryIds.length > 0
    ) {
      filtered = filtered.filter(
        (rec) => !filters.excludeRepositoryIds!.includes(rec.id),
      );
    }

    // Filter by minimum score
    if (filters.minScore !== undefined) {
      filtered = filtered.filter((rec) => rec.score >= filters.minScore!);
    }

    // Limit results
    if (filters.maxResults !== undefined && filters.maxResults > 0) {
      filtered = filtered.slice(0, filters.maxResults);
    }

    return filtered;
  }

  /**
   * Get activity-level recommendations for specific content
   * Uses section-level matching to recommend similar activities
   *
   * @param repositoryId - Repository containing the activity
   * @param activityId - Activity to find similar content for
   * @param profile - Learner profile
   * @param options - Recommendation options
   * @returns Activity-level recommendations
   *
   * @example
   * const similarActivities = await content.getSimilarActivities(
   *   'repo-123',
   *   'activity-456',
   *   learnerProfile,
   *   { limit: 5 }
   * );
   */
  async getSimilarActivities(
    repositoryId: string,
    activityId: string,
    profile: LearnerProfile,
    options?: { limit?: number },
  ): Promise<RelatedContent[]> {
    const context = this.getLogContext();
    this.logger.debug(
      `${context} Finding similar activities to ${activityId} in ${repositoryId}`,
    );
    return this.profiler.getMoreLikeThis(repositoryId, profile, {
      sectionId: activityId,
      limit: options?.limit ?? 5,
    });
  }

  /**
   * Check if any repositories have recommendation metadata
   * @returns True if at least one repository has metadata
   */
  hasRecommendationMetadata(): boolean {
    return this.repositories.some((r) => r.hasRecommendationMetadata());
  }

  /**
   * Get count of repositories with metadata
   * @returns Number of repositories that have recommendation metadata
   */
  getMetadataCount(): number {
    return this.repositories.filter((r) => r.recommendationMetadata).length;
  }

  /**
   * Get analysis coverage statistics
   * Returns metadata coverage scoped to analysis when it exists,
   * or global coverage when no analysis is available.
   *
   * @returns Coverage statistics with total, withMetadata count, and percentage
   *
   * @example
   * const coverage = content.getAnalysisCoverage();
   * console.log(
   *   `${coverage.withMetadata}/${coverage.total} repositories ` +
   *   `(${coverage.percentage.toFixed(1)}%)`
   * );
   */
  getAnalysisCoverage(): {
    total: number;
    withMetadata: number;
    percentage: number;
  } {
    if (!this.hasAnalysis) {
      // No analysis: use all repositories
      const total = this.repositories.length;
      const withMetadata = this.getMetadataCount();
      return {
        total,
        withMetadata,
        percentage: total > 0 ? (withMetadata / total) * 100 : 0,
      };
    }

    // Analysis exists: scope to analyzed repositories
    const scopeIds = new Set(this.contentAnalysis!.repositoryIds);
    const total = scopeIds.size;
    const withMetadata = this.repositories.filter(
      (r) => scopeIds.has(r.uid) && r.recommendationMetadata,
    ).length;

    return {
      total,
      withMetadata,
      percentage: total > 0 ? (withMetadata / total) * 100 : 0,
    };
  }

  /**
   * Get comprehensive analysis summary
   * Returns complete analysis data including coverage, distributions, and questions.
   * When no analysis exists, returns empty/null values with coverage stats.
   *
   * @returns Complete analysis summary with all distributions and metadata
   *
   * @example
   * const summary = content.getAnalysisSummary();
   * if (summary.hasAnalysis) {
   *   console.log(`Analyzed ${summary.repositoryIds.length} repositories`);
   *   console.log(`Top tags:`, summary.tagDistribution.slice(0, 5));
   * }
   */
  getAnalysisSummary() {
    const coverage = this.getAnalysisCoverage();

    if (!this.hasAnalysis) {
      return {
        hasAnalysis: false,
        analyzedRepositories: coverage.withMetadata,
        totalRepositories: coverage.total,
        coveragePercentage: Math.round(coverage.percentage),
        repositoryIds: [],
        generatedAt: null,
        tagDistribution: [],
        categoryDistribution: [],
        difficultyDistribution: [],
        profilingQuestions: [],
      };
    }

    return {
      hasAnalysis: true,
      analyzedRepositories: coverage.withMetadata,
      totalRepositories: coverage.total,
      coveragePercentage: Math.round(coverage.percentage),
      repositoryIds: this.contentAnalysis!.repositoryIds,
      generatedAt: this.contentAnalysisAt!,
      tagDistribution: this.analyzer.getFormattedTagDistribution(),
      categoryDistribution: this.analyzer.getFormattedCategoryDistribution(),
      difficultyDistribution:
        this.analyzer.getFormattedDifficultyDistribution(),
      profilingQuestions: this.profilingQuestions!,
    };
  }

  /**
   * Get recommendation statistics
   * @returns Statistics about metadata coverage and data status
   *
   * @example
   * const stats = content.getAnalysisStats();
   * console.log(`Coverage: ${stats.metadataCount}/${stats.totalRepositories}`);
   */
  getAnalysisStats(): {
    dataComputed: boolean;
    totalRepositories: number;
    metadataCount: number;
    metadataPercentage: number;
    dataAge?: number;
  } {
    const metadataCount = this.getMetadataCount();
    const total = this.repositories.length;
    return {
      dataComputed: !!(
        this.contentAnalysis &&
        this.profilingQuestions &&
        this.contentAnalysisAt
      ),
      totalRepositories: total,
      metadataCount,
      metadataPercentage: total > 0 ? (metadataCount / total) * 100 : 0,
      dataAge: this.contentAnalysisAt
        ? Date.now() - this.contentAnalysisAt.getTime()
        : undefined,
    };
  }

  // ============================================================================
  // LEARNING GOALS (PROBLEMS & OUTCOMES)
  // ============================================================================

  /**
   * Get aggregated learning goals (problems and outcomes) across repositories
   * Supports filtering by type, search query, and repository
   *
   * @param options - Query options
   * @param options.type - Filter by 'problem' or 'outcome'
   * @param options.query - Case-insensitive search on title/description
   * @param options.repositoryId - Filter by repository uid(s)
   * @param options.limit - Maximum results to return
   * @returns LearningGoalsResult with items and counts
   *
   * @example
   * Get all learning goals
   * const { items, totalProblems } = content.getLearningGoals();
   *
   * @example
   * Search for specific goals
   * const { items } = content.getLearningGoals({ query: 'api', type: 'problem' });
   */
  getLearningGoals(
    options?: LearningGoalsQuery & { repositoryId?: string | string[] },
  ): LearningGoalsResult {
    return this._getLearningGoalsFromRepos(this.repositories, options);
  }

  /**
   * Internal method to get learning goals from a set of repositories
   * Used by both TailorContent and TailorContentView
   */
  _getLearningGoalsFromRepos(
    repositories: Repository[],
    options?: LearningGoalsQuery & { repositoryId?: string | string[] },
  ): LearningGoalsResult {
    const { type, query, limit = 100, repositoryId } = options || {};
    const items: AggregatedLearningGoal[] = [];
    let totalProblems = 0;
    let totalOutcomes = 0;
    // Filter repositories if repositoryId specified
    const repoIds = repositoryId
      ? Array.isArray(repositoryId)
        ? repositoryId
        : [repositoryId]
      : null;
    const repos = repoIds
      ? repositories.filter((r) => repoIds.includes(r.uid))
      : repositories;
    for (const repo of repos) {
      for (const goal of repo.getLearningGoals({ type, query })) {
        if (goal.type === 'problem') totalProblems++;
        else totalOutcomes++;
        items.push({
          ...goal,
          ...this._resolveSectionNodes(goal.sectionIds),
        });
      }
    }

    // Interleave items from different repositories for diversity (when no query)
    let result = items;
    if (!query && items.length > 0) {
      result = this._interleaveByRepository(items);
    }

    return {
      items: result.slice(0, limit),
      totalProblems,
      totalOutcomes,
    };
  }

  /**
   * Interleave items from different repositories for better
   * diversity Round-robin selects from each repository
   */
  private _interleaveByRepository(
    items: AggregatedLearningGoal[],
  ): AggregatedLearningGoal[] {
    const byRepo = new Map<string, AggregatedLearningGoal[]>();
    for (const item of items) {
      const existing = byRepo.get(item.repositoryId) || [];
      existing.push(item);
      byRepo.set(item.repositoryId, existing);
    }
    const interleaved: AggregatedLearningGoal[] = [];
    const repoArrays = Array.from(byRepo.values());
    let index = 0;
    while (interleaved.length < items.length) {
      for (const repoItems of repoArrays) {
        if (index < repoItems.length) {
          interleaved.push(repoItems[index]);
        }
      }
      index++;
    }
    return interleaved;
  }

  /**
   * Resolve all section nodes from sectionIds
   * Returns array of sections, each with id, type, name, and parent (if exists)
   */
  private _resolveSectionNodes(sectionIds?: string[]): {
    sections?: SectionNode[];
  } {
    if (!sectionIds || sectionIds.length === 0) return {};
    const sections: SectionNode[] = [];
    for (const sectionId of sectionIds) {
      try {
        const result = this.findNode(sectionId);
        const entity = result.entity;
        // Resolve parent if parentId exists
        let parent: SectionNode | undefined;
        if (entity.parentId) {
          try {
            const parentResult = this.findNode(String(entity.parentId));
            const parentEntity = parentResult.entity;
            parent = {
              id: parentEntity.uid,
              type: parentEntity.type || parentResult.entityType,
              entity: parentResult.entityType,
              name: parentEntity.name,
            };
          } catch {
            // Parent not found
          }
        }
        sections.push({
          id: entity.uid,
          type: entity.type || result.entityType,
          entity: result.entityType,
          name: entity.name,
          parent,
        });
      } catch {
        // Section not found, skip
      }
    }
    return sections.length > 0 ? { sections } : {};
  }

  // ============================================================================
  // CORE ENTITY METHODS
  // ============================================================================

  /**
   * Make all content publicly accessible by signing URLs
   * Forces all repositories to re-sign to ensure aligned expiration times
   * @param interval - Signature validity interval in seconds (optional)
   * @param options - Options including force re-signing
   * @returns Promise resolving to the content itself for chaining
   */
  async makePublic(
    interval?: number,
    options?: MakePublicOptions,
  ): Promise<TailorContent> {
    // Check if content is stale (approaching expiration)
    const isStale = this.isStale();
    const needsResigning = this.needsResigning();

    // If stale but not expired and not forced, trigger deferred re-signing
    if (!options?.force && isStale && !needsResigning) {
      void this.triggerDeferredResigning(interval);
      return this;
    }

    // Skip re-signing if fresh (unless force option is set)
    if (!options?.force && !needsResigning) return this;

    // At this point we've determined signing is needed (either forced or stale)
    // Force all repositories to re-sign to align signature expiration times
    // This ensures all entities have consistent expiration, even if some
    // individual repos/entities were signed at different times
    await Promise.all(
      this.repositories.map((repo) =>
        repo.makePublic(interval, {
          force: true,
          deferred: options?.deferred,
        }),
      ),
    );

    this.trackSigning(interval, options?.deferred);
    return this;
  }

  /**
   * Serialize content collection to JSON
   */
  toJSON(): any {
    return {
      __type: this.constructor.name,
      ...this.serializeWithProps(),
      _metadata: serializeMetadata(this),
    };
  }

  /**
   * Serialize content for storage (S3, disk, etc.)
   * Excludes operational metadata
   * Use this for persisting content state, use toJSON() for caching
   */
  toStorage(): any {
    return {
      __type: this.constructor.name,
      repositories: this.repositories.map((repo) => repo.toStorage()),
      publishedAt: this.publishedAt?.toISOString(),
      contentAnalysis: this.contentAnalysis,
      profilingQuestions: this.profilingQuestions,
      contentAnalysisAt: this.contentAnalysisAt?.toISOString(),
    };
  }

  /**
   * Deserialize content from JSON data
   * Handles both string (from Redis) and object (from memory cache) formats
   */
  static fromJSON(data: any): TailorContent {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const content = new TailorContent();
    content.deserializeWithProps(parsed);
    const metadata = parseMetadata(parsed._metadata);
    content.signedAt = metadata.signedAt;
    content.signedInterval = metadata.signedInterval;
    return content;
  }

  /**
   * Create an in-memory clone of the content collection
   */
  clone(): TailorContent {
    return Object.assign(new TailorContent(), {
      _lastCatalogCheckAt: this._lastCatalogCheckAt,
      publishedAt: this.publishedAt,
      signedAt: this.signedAt,
      signedInterval: this.signedInterval,
      repositories: this.repositories.map((repo) => repo.clone()),
    });
  }

  /**
   * Get all cache keys for repositories and their children
   * Recursively collects keys from all nested entities
   * TailorContent itself has no cache key (it's just a collection wrapper)
   * @param namespace - Cache namespace (defaults to 'tlr')
   * @returns Array of cache key strings
   */
  getCacheKeys(namespace = 'tlr'): string[] {
    const keys: string[] = [];
    if (this.repositories?.length) {
      for (const repository of this.repositories) {
        keys.push(...repository.getCacheKeys(namespace));
      }
    }
    return keys;
  }
}

ContentEntity.register('TailorContent', TailorContent);
