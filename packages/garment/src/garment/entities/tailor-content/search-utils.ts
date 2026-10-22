import type { Activity } from '../activity';
import type { ContentContainer } from '../content-container';
import type { ContentElement } from '../content-element';
import type { Repository } from '../repository';
import type { SearchEntityType, SearchPredicate, SearchResult } from './types';

/**
 * Entity with repository context for indexed search
 */
export interface IndexedEntity<T> {
  entity: T;
  repository: Repository;
}

/**
 * Union type for any indexed entity in the system
 * Used for general entity lookup across all types
 */
export type AnyIndexedEntity =
  | IndexedEntity<Repository>
  | IndexedEntity<Activity>
  | IndexedEntity<ContentContainer>
  | IndexedEntity<ContentElement>;

/**
 * Search indexed entities and map to search results
 * @param index - Array of indexed entities with repository context
 * @param predicate - Predicate function to filter entities
 * @param entityType - Type of entity for search results
 * @returns Array of search results
 */
export function searchIndex<T>(
  index: IndexedEntity<T>[],
  predicate: SearchPredicate<T>,
  entityType: SearchEntityType,
): SearchResult<T>[] {
  return index
    .filter((item) => predicate(item.entity))
    .map(({ entity, repository }) => ({
      entity,
      repository,
      repositoryId: repository.id,
      repositoryUid: repository.uid,
      entityType,
    }));
}

/**
 * Determine entity type from entity instance
 * @param entity - Entity instance to inspect
 * @returns SearchEntityType for the entity
 */
export function getEntityType(entity: any): SearchEntityType {
  // Prefer __type property if available (more reliable than constructor.name)
  const typeName = entity.__type || entity.constructor.name;

  // Normalize type name by removing leading underscore if present
  // (class-transformer may prefix constructor names with underscore)
  const normalizedType = typeName.replace(/^_/, '');

  switch (normalizedType) {
    case 'Repository':
      return 'Repository';
    case 'Activity':
      return 'Activity';
    case 'ContentContainer':
      return 'ContentContainer';
    case 'ContentElement':
      return 'ContentElement';
    default:
      throw new Error(`Unknown entity type: ${typeName}`);
  }
}

/**
 * Extract all activities from repositories with repository context
 * Flattens repo.structure arrays and maintains repository references
 * @param repositories - Array of repositories to extract from
 * @returns Flattened array of activities with repository context
 */
export function extractActivities(
  repositories: Repository[],
): IndexedEntity<Activity>[] {
  return repositories.flatMap((repository) =>
    (repository.structure || []).map((entity) => ({ entity, repository })),
  );
}

/**
 * Extract all containers from repositories with repository context
 * Recursively flattens all containers (including nested) from all activities
 * @param repositories - Array of repositories to extract from
 * @returns Flattened array of containers with repository context
 */
export function extractContainers(
  repositories: Repository[],
): IndexedEntity<ContentContainer>[] {
  return repositories.flatMap((repository) =>
    (repository.structure || []).flatMap((activity) =>
      extractContainersRecursive(activity.contentContainers || [], repository),
    ),
  );
}

/**
 * Extract all elements from repositories with repository context
 * Recursively flattens all elements from all containers (including nested)
 * @param repositories - Array of repositories to extract from
 * @returns Flattened array of elements with repository context
 */
export function extractElements(
  repositories: Repository[],
): IndexedEntity<ContentElement>[] {
  return repositories.flatMap((repository) =>
    (repository.structure || []).flatMap((activity) =>
      extractElementsRecursive(activity.contentContainers || [], repository),
    ),
  );
}

/**
 * Recursively extract all containers (including nested) with repository context
 * @param containers - Array of containers to extract from
 * @param repository - Repository these containers belong to
 * @returns Flattened array of containers with repository references
 */
export function extractContainersRecursive(
  containers: ContentContainer[],
  repository: Repository,
): IndexedEntity<ContentContainer>[] {
  return containers.flatMap((entity) => [
    { entity, repository },
    ...extractContainersRecursive(entity.containers || [], repository),
  ]);
}

/**
 * Recursively extract all elements from all containers (including nested)
 * @param containers - Array of containers to extract elements from
 * @param repository - Repository these elements belong to
 * @returns Flattened array of elements with repository references
 */
export function extractElementsRecursive(
  containers: ContentContainer[],
  repository: Repository,
): IndexedEntity<ContentElement>[] {
  return containers.flatMap((container) => [
    ...(container.elements || []).map((entity) => ({ entity, repository })),
    ...extractElementsRecursive(container.containers || [], repository),
  ]);
}
