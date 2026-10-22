import type {
  AccessCheck,
  ContentStats,
  SearchCriteria,
  SearchEntityType,
  SearchOptions,
  SearchPredicate,
  SearchResult,
} from './types';
import type {
  LearningGoalsQuery,
  LearningGoalsResult,
} from '../../../ai/types';
import type { Activity } from '../activity';
import type { ContentContainer } from '../content-container';
import type { ContentElement } from '../content-element';
import type { CatalogCollection } from '../catalog-entry/CatalogCollection';
import type { Repository } from '../repository';
import { RepositoryCollection } from '../repository';
import type { TailorContent } from './TailorContent';

/**
 * Lightweight view that filters all TailorContent queries by access permissions
 * Delegates to parent TailorContent instance - no cloning, no index rebuilding
 * Memory cost: ~1KB regardless of content size
 *
 * @example
 * Create filtered view
 * const content = await TailorContent.load(config);
 * await content.init();
 * const userView = content.forUser(123);
 *
 * @example
 * All queries automatically filtered
 * const repos = userView.all();
 * const videos = userView.findElements({ type: 'MUX_VIDEO' });
 * const catalog = await userView.getCatalog();
 */
export class TailorContentView {
  private readonly _accessibleRepoIds: Set<number>;

  constructor(
    private readonly _parent: TailorContent,
    private readonly _check: AccessCheck,
    accessibleRepos: Repository[],
  ) {
    // Only store the Set of IDs (~80 bytes for 10 repos)
    this._accessibleRepoIds = new Set(accessibleRepos.map((r) => r.id));
  }

  /**
   * Get all accessible repositories
   * @returns RepositoryCollection with only accessible repositories
   */
  all(): RepositoryCollection {
    const filtered = this._parent.repositories.filter((r) =>
      this._accessibleRepoIds.has(r.id),
    );
    return new RepositoryCollection(filtered);
  }

  /**
   * Get catalog filtered by access and excluding detached entries
   * @param options - Load options
   * @returns Promise resolving to filtered CatalogCollection
   */
  async getCatalog(options?: { force?: boolean }): Promise<CatalogCollection> {
    const catalog = await this._parent.getCatalog(options);
    const filtered = catalog
      .all()
      .filter((e) => this._accessibleRepoIds.has(e.id) && !e.detachedAt);
    // @ts-expect-error - CatalogCollection constructor is accessible
    return new catalog.constructor(filtered);
  }

  /**
   * Find node by UID - returns null if not accessible
   * @param uid - Entity UID
   * @returns SearchResult or null if not found or not accessible
   */
  findNode(uid: string): SearchResult | null {
    try {
      const result = this._parent.findNode(uid);
      return this._accessibleRepoIds.has(result.repositoryId) ? result : null;
    } catch {
      return null;
    }
  }

  /**
   * Generic search - automatically filtered by access
   * @param entityType - Type of entity to search for
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (repositoryUid filter, limit)
   * @returns Array of search results filtered by access
   */
  search(
    entityType: SearchEntityType,
    criteria: SearchCriteria | SearchPredicate<any>,
    options?: SearchOptions,
  ): SearchResult[] {
    // Use parent's indices (no rebuilding!)
    const results = this._parent.search(entityType, criteria, options);
    // Filter by accessible repositories
    return results.filter((r) => this._accessibleRepoIds.has(r.repositoryId));
  }

  /**
   * Find elements - automatically filtered by access
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (repositoryUid filter, limit)
   * @returns Array of search results with ContentElement entities
   */
  findElements(
    criteria: SearchCriteria | SearchPredicate<ContentElement>,
    options?: SearchOptions,
  ): SearchResult<ContentElement>[] {
    return this.search(
      'ContentElement',
      criteria,
      options,
    ) as SearchResult<ContentElement>[];
  }

  /**
   * Find containers - automatically filtered by access
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (repositoryUid filter, limit)
   * @returns Array of search results with ContentContainer entities
   */
  findContainers(
    criteria: SearchCriteria | SearchPredicate<ContentContainer>,
    options?: SearchOptions,
  ): SearchResult<ContentContainer>[] {
    return this.search(
      'ContentContainer',
      criteria,
      options,
    ) as SearchResult<ContentContainer>[];
  }

  /**
   * Find activities - automatically filtered by access
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (repositoryUid filter, limit)
   * @returns Array of search results with Activity entities
   */
  findActivities(
    criteria: SearchCriteria | SearchPredicate<Activity>,
    options?: SearchOptions,
  ): SearchResult<Activity>[] {
    return this.search(
      'Activity',
      criteria,
      options,
    ) as SearchResult<Activity>[];
  }

  /**
   * Find repositories - automatically filtered by access
   * @param criteria - Object with properties to match, or predicate function
   * @param options - Search options (limit)
   * @returns Array of search results with Repository entities
   */
  findRepositories(
    criteria: SearchCriteria | SearchPredicate<Repository>,
    options?: SearchOptions,
  ): SearchResult<Repository>[] {
    return this.search(
      'Repository',
      criteria,
      options,
    ) as SearchResult<Repository>[];
  }

  /**
   * Get statistics for accessible content only
   * @returns ContentStats with counts for accessible entities
   */
  getStats(): ContentStats {
    const repos = Array.from(this.all());

    // Use parent's indices but filter by accessible repos
    const activities = this._parent['activityIndex'].filter((a) =>
      this._accessibleRepoIds.has(a.repository.id),
    );
    const containers = this._parent['containerIndex'].filter((c) =>
      this._accessibleRepoIds.has(c.repository.id),
    );
    const elements = this._parent['elementIndex'].filter((e) =>
      this._accessibleRepoIds.has(e.repository.id),
    );

    return {
      repositories: repos.length,
      activities: activities.length,
      containers: containers.length,
      elements: elements.length,
    };
  }

  /**
   * Get the access check used by this view
   * @returns Copy of the AccessCheck used to create this view
   */
  getAccessCheck(): AccessCheck {
    return { ...this._check };
  }

  /**
   * Get learning goals filtered by view's access permissions
   * @param options - Query options for filtering
   * @returns LearningGoalsResult with items from accessible repositories only
   *
   * @example
   * const userView = content.forUser(123);
   * const { items, totalProblems } = userView.getLearningGoals();
   *
   * @example
   * Search with type filter
   * const { items } = userView.getLearningGoals({ type: 'problem', query: 'api' });
   */
  getLearningGoals(
    options?: LearningGoalsQuery & { repositoryId?: string | string[] },
  ): LearningGoalsResult {
    // Get only accessible repositories
    const accessibleRepos = this._parent.repositories.filter((r) =>
      this._accessibleRepoIds.has(r.id),
    );
    // Delegate to parent's internal method with filtered repos
    return this._parent._getLearningGoalsFromRepos(accessibleRepos, options);
  }
}
