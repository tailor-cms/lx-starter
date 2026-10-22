import type { Repository } from '../repository';

/**
 * Entity type for search filtering
 */
export type SearchEntityType =
  | 'Activity'
  | 'ContentContainer'
  | 'ContentElement'
  | 'Repository';

/**
 * Predicate function for filtering entities
 */
export type SearchPredicate<T> = (entity: T) => boolean;

/**
 * Object-style where clause for filtering entities
 */
export type SearchCriteria = Record<string, any>;

/**
 * Access check for filtering by user or a group
 */
export type AccessCheck =
  | { userId: number }
  | { groupId: number }
  | { userEmail: string };

/**
 * Options for search operations
 */
export interface SearchOptions {
  /**
   * Filter results to specific repository by UID
   * Only returns results from the specified repository
   */
  repositoryUid?: string;

  /**
   * Limit number of results returned
   * Results are sliced after filtering
   */
  limit?: number;
}

/**
 * Search result with entity and its context
 */
export interface SearchResult<T = any> {
  entity: T;
  repository: Repository;
  repositoryId: number;
  repositoryUid: string;
  entityType: SearchEntityType;
}

/**
 * Statistics about content entities
 */
export interface ContentStats {
  repositories: number;
  activities: number;
  containers: number;
  elements: number;
  bulk?: {
    jsonSize: number;
    compressedSize: number;
    compressionRatio: string;
  };
}
