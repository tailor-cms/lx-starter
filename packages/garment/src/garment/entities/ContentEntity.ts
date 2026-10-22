import type { Activity } from './activity';
import type { CatalogEntry } from './catalog-entry';
import type { ContentContainer } from './content-container';
import type { ContentElement } from './content-element';
import type { Repository } from './repository';

/**
 * Union type of all content entities that can be deserialized polymorphically
 * Used by ContentEntity.from() for type-safe entity deserialization
 */
export type AnyContentEntity =
  | Repository
  | Activity
  | ContentContainer
  | ContentElement
  | CatalogEntry;

/**
 * Entity type discriminators for runtime type checking
 * Maps to the __type field in serialized entity data
 */
export enum ContentEntityType {
  REPOSITORY = 'Repository',
  ACTIVITY = 'Activity',
  CONTENT_CONTAINER = 'ContentContainer',
  CONTENT_ELEMENT = 'ContentElement',
  CATALOG_ENTRY = 'CatalogEntry',
}

/**
 * Registry of entity classes for deserialization
 * Populated automatically when entity modules are imported
 */
const entityRegistry = new Map<string, { fromJSON: (data: any) => any }>();

/**
 * ContentEntity - Factory & Registry for Polymorphic Entity Deserialization
 *
 * Provides infrastructure for working with entities when the specific type is not
 * known at compile time. Uses a registry pattern with __type discriminators to
 * automatically deserialize the correct entity class from JSON data.
 *
 * **Architecture:**
 * - All entities include __type in their toJSON() output
 * - Entities self-register on module load via ContentEntity.register()
 * - Factory method ContentEntity.from() uses __type to instantiate correct class
 * - Type guards provide TypeScript narrowing for type-specific operations
 *
 * **Intended Use Cases:**
 * 1. Generic cache layer storing mixed entity types
 * 2. API responses with polymorphic entity arrays
 * 3. Plugin systems needing runtime entity type detection
 * 4. Entity operations without compile-time type knowledge
 *
 * @example
 * Generic cache deserialization (when entity type unknown)
 * const cached = await redis.get(cacheKey);
 * const entity = ContentEntity.from(cached);
 * await entity.load();
 * await entity.makePublic();
 *
 * @example
 * Type narrowing for type-specific operations
 * const entity = ContentEntity.from(data);
 * if (ContentEntity.isRepository(entity)) {
 *   await entity.load({ deep: true });
 *   const graph = await entity.getContentGraph();
 * } else if (ContentEntity.isActivity(entity)) {
 *   console.log(entity.type);
 * }
 *
 * @example
 * Polymorphic API responses
 * const entities: AnyContentEntity[] = response.items.map(ContentEntity.from);
 * await Promise.all(entities.map(e => e.makePublic()));
 *
 * @example
 * Batch operations on mixed entity types
 * const entities = [repo, activity, container].map(e => e.toJSON());
 * const deserialized = entities.map(ContentEntity.from);
 * for (const entity of deserialized) {
 *   if (entity.needsResigning()) await entity.makePublic();
 * }
 *
 * **Note:** This is infrastructure for polymorphic scenarios. For type-safe
 * operations with known types, use direct class methods:
 * - Repository.fromJSON(data)
 * - Activity.fromJSON(data)
 * - etc.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ContentEntity {
  /**
   * Register an entity class for polymorphic deserialization
   * Called automatically when entity modules are imported
   *
   * @param type - Entity type name (matches __type in serialized data)
   * @param entityClass - Entity class with static fromJSON method
   *
   * @internal This is called automatically by entities, not user code
   */
  static register(
    type: string,
    entityClass: { fromJSON: (data: any) => any },
  ): void {
    entityRegistry.set(type, entityClass);
  }

  /**
   * Deserialize any entity from JSON data using __type discriminator
   * Automatically detects entity type and instantiates the correct class
   *
   * @param data - Serialized entity data (string or object) with __type field
   * @returns Deserialized entity instance of the appropriate type
   * @throws Error if __type is missing or unknown
   *
   * @example
   * const entity = ContentEntity.from({ __type: 'Repository', id: 1, ... });
   * Returns Repository instance
   */
  static from(data: any): AnyContentEntity {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!parsed.__type) {
      throw new Error(
        'Cannot deserialize entity: missing __type discriminator',
      );
    }
    const EntityClass = entityRegistry.get(parsed.__type);
    if (!EntityClass) {
      throw new Error(
        `Cannot deserialize entity: unknown type "${parsed.__type}"`,
      );
    }
    return EntityClass.fromJSON(parsed);
  }

  /**
   * Type guard for Repository entities
   * Enables TypeScript type narrowing for type-specific operations
   *
   * @param entity - Entity to check
   * @returns True if entity is a Repository
   */
  static isRepository(entity: AnyContentEntity): entity is Repository {
    return (
      (entity as any).__type === ContentEntityType.REPOSITORY ||
      entity.constructor.name === ContentEntityType.REPOSITORY
    );
  }

  /**
   * Type guard for Activity entities
   * Enables TypeScript type narrowing for type-specific operations
   *
   * @param entity - Entity to check
   * @returns True if entity is an Activity
   */
  static isActivity(entity: AnyContentEntity): entity is Activity {
    return (
      (entity as any).__type === ContentEntityType.ACTIVITY ||
      entity.constructor.name === ContentEntityType.ACTIVITY
    );
  }

  /**
   * Type guard for ContentContainer entities
   * Enables TypeScript type narrowing for type-specific operations
   *
   * @param entity - Entity to check
   * @returns True if entity is a ContentContainer
   */
  static isContentContainer(
    entity: AnyContentEntity,
  ): entity is ContentContainer {
    return (
      (entity as any).__type === ContentEntityType.CONTENT_CONTAINER ||
      entity.constructor.name === ContentEntityType.CONTENT_CONTAINER
    );
  }

  /**
   * Type guard for ContentElement entities
   * Enables TypeScript type narrowing for type-specific operations
   *
   * @param entity - Entity to check
   * @returns True if entity is a ContentElement
   */
  static isContentElement(entity: AnyContentEntity): entity is ContentElement {
    return (
      (entity as any).__type === ContentEntityType.CONTENT_ELEMENT ||
      entity.constructor.name === ContentEntityType.CONTENT_ELEMENT
    );
  }

  /**
   * Type guard for CatalogEntry entities
   * Enables TypeScript type narrowing for type-specific operations
   *
   * @param entity - Entity to check
   * @returns True if entity is a CatalogEntry
   */
  static isCatalogEntry(entity: AnyContentEntity): entity is CatalogEntry {
    return (
      (entity as any).__type === ContentEntityType.CATALOG_ENTRY ||
      entity.constructor.name === ContentEntityType.CATALOG_ENTRY
    );
  }
}
