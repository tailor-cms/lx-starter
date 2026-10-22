/**
 * Processor tuple for serialization/deserialization
 * [toJSON processor, fromJSON processor]
 */
export type ProcessorTuple = [
  (value: any) => any, // toJSON processor
  (value: any) => any, // fromJSON processor
];

/**
 * Type for serializable property configuration
 * Can be either:
 * - A simple key (string)
 * - A tuple [key, [toJSON, fromJSON]]
 */
export type SerializablePropConfig<T = any> =
  | keyof T
  | readonly [keyof T, ProcessorTuple];

/**
 * Interface for entities that can be serialized to/from JSON
 * Enables consistent caching and state management across all Garment entities
 */
export interface Serializable<T = any> {
  /**
   * Properties that should be serialized when calling toJSON()
   * Can be either simple keys or [key, [toJSON, fromJSON]] tuples
   * Defines the shape of serialized data for this entity
   */
  serializableProps: readonly SerializablePropConfig<this>[];

  /**
   * Serialize entity to plain JSON object
   * Includes all data and metadata needed for reconstruction
   */
  toJSON: () => any;

  /**
   * Create a shallow clone of the entity
   * Useful for creating copies without modifying originals
   */
  clone: () => T;
}

/**
 * Static methods for deserializing entities from JSON
 * Must be implemented as static methods on each class
 */
export interface SerializableConstructor<T> {
  /**
   * Deserialize entity from JSON data
   * Handles both string (from Redis) and object (from memory cache) formats
   */
  fromJSON: (data: any) => T;
}

/**
 * Options for loading entity content
 */
export interface LoadOptions {
  /**
   * Skip cache entirely and always reload from source
   * When true, ignores cached data and performs full reload
   * When false/undefined (default), uses cache with incremental sync if changes detected
   *
   * Use for guaranteed fresh data after deployments or cache invalidation
   *
   * @default false
   *
   * @example
   * Default: Smart mode with incremental sync
   * await content.init()
   *
   * @example
   * Force: Always reload everything
   * await content.init({ force: true })
   */
  force?: boolean;

  /**
   * Load nested content recursively
   * When used with CatalogEntry.load(), also loads Repository content
   * When used with Repository.load(), also loads Activity and Container content
   */
  deep?: boolean;

  /**
   * Concurrency limit for parallel operations
   */
  concurrency?: number;
}

/**
 * Options for making entity content public
 */
export interface MakePublicOptions {
  /**
   * Force re-signing even if signatures are still fresh
   * Useful for cache invalidation scenarios
   */
  force?: boolean;

  /**
   * Internal flag - indicates this is a deferred re-signing operation
   * Set to true when re-signing stale content without blocking
   */
  deferred?: boolean;
}

/**
 * Metadata tracked for all loadable entities
 */
export interface LoadableMetadata {
  /**
   * Whether entity content has been loaded from storage
   */
  isLoaded: boolean;

  /**
   * Timestamp when entity was last loaded
   * Useful for time-based cache invalidation
   */
  loadedAt?: Date;
}

/**
 * Metadata tracked for entities with signed/public URLs
 */
export interface SignableMetadata {
  /**
   * Timestamp when entity was last signed (makePublic called)
   * Useful for tracking signature expiration
   */
  signedAt?: Date;

  /**
   * Interval in seconds that was used when signing
   * Allows calculation of exact expiration time
   */
  signedInterval?: number;
}

/**
 * Helper to create processor tuple for array of nested entities
 */
export function arrayOf(EntityClass: {
  fromJSON: (data: any) => any;
}): ProcessorTuple {
  return [
    (value: any[]) => value?.map((item) => item.toJSON?.() ?? item) || [],
    (value: any[]) => value?.map((item) => EntityClass.fromJSON(item)) || [],
  ];
}

/**
 * Helper to create processor tuple for single nested entity
 */
export function entityOf(EntityClass: {
  fromJSON: (data: any) => any;
}): ProcessorTuple {
  return [
    (value: any) => value?.toJSON?.() ?? value,
    (value: any) => (value ? EntityClass.fromJSON(value) : null),
  ];
}

/**
 * Helper to create processor tuple for Date properties
 * Converts Date to ISO string (toJSON), and ISO string back to Date (fromJSON)
 */
export function dateOf(): ProcessorTuple {
  return [
    (value: Date) => (value instanceof Date ? value.toISOString() : value),
    (value: string) =>
      value && typeof value === 'string' ? new Date(value) : value,
  ];
}

// ============================================================================
// SERIALIZATION HELPERS
// ============================================================================

/**
 * Type guard to check if value is a Date
 */
function isDate(value: any): value is Date {
  return value instanceof Date;
}

/**
 * Type guard to check if value is an entity with toJSON method
 */
function isEntity(value: any): value is { toJSON: () => any } {
  return value && typeof value.toJSON === 'function';
}

/**
 * Type guard to check if value is an array of entities
 */
function isEntityArray(value: any): value is Array<{ toJSON: () => any }> {
  return Array.isArray(value) && value.length > 0 && isEntity(value[0]);
}

/**
 * Parse date from string or return undefined
 */
export function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return undefined;
}

/**
 * Serialize date to ISO string or return undefined
 */
export function serializeDate(value: any): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return undefined;
}

/**
 * Parse array of entities using their fromJSON method
 */
export function parseEntityArray<T>(
  data: any[] | undefined,
  EntityClass: { fromJSON: (data: any) => T },
): T[] {
  if (!data || !Array.isArray(data)) return [];
  return data.map((item) => EntityClass.fromJSON(item));
}

/**
 * Serialize array of entities using their toJSON method
 */
export function serializeEntityArray(entities: any[] | undefined): any[] {
  if (!entities || !Array.isArray(entities)) return [];
  return entities.map((entity) => entity.toJSON?.() ?? entity);
}

/**
 * Parse metadata from JSON
 */
export function parseMetadata(metadata: any): {
  loadedAt?: Date;
  signedAt?: Date;
  signedInterval?: number;
} {
  if (!metadata) return {};
  return {
    loadedAt: parseDate(metadata.loadedAt),
    signedAt: parseDate(metadata.signedAt),
    signedInterval: metadata.signedInterval,
  };
}

/**
 * Serialize metadata to JSON
 */
export function serializeMetadata(entity: {
  isLoaded?: boolean;
  loadedAt?: Date;
  signedAt?: Date;
  signedInterval?: number;
}): any {
  const isLoaded = entity.isLoaded !== undefined
    ? entity.isLoaded
    : !!entity.loadedAt;

  return {
    isLoaded,
    loadedAt: serializeDate(entity.loadedAt),
    signedAt: serializeDate(entity.signedAt),
    signedInterval: entity.signedInterval,
  };
}

// ============================================================================
// CORE SERIALIZATION/DESERIALIZATION
// ============================================================================

/**
 * Type for serializable property configuration
 * Can be a simple key or [key, [toJSONProcessor, fromJSONProcessor]]
 */
type SerializableProp<T> =
  | keyof T
  | readonly [keyof T, readonly [(value: any) => any, (value: any) => any]];

/**
 * Smart serialization using serializableProps array with automatic type detection
 *
 * Processes each property from serializableProps:
 * - Simple keys: Auto-detects Dates/Entities and transforms them
 * - Tuples with processors: Uses the toJSON processor (index 0)
 *
 * @param obj - Object to serialize
 * @param serializableProps - Array of property configs (from entity definition)
 * @returns Object with all properties serialized
 *
 * @example
 * readonly serializableProps = [
 *   'id', 'uid', 'type',
 *   ['createdAt', dateOf()],
 *   ['contentContainers', arrayOf(ContentContainer)]
 * ] as const;
 *
 * toJSON() {
 *   return {
 *     __type: this.constructor.name,
 *     ...serializeProps(this, this.serializableProps),
 *     _metadata: serializeMetadata(this),
 *   };
 * }
 */
export function serializeProps<T extends object>(
  obj: T,
  props: ReadonlyArray<SerializableProp<T>>,
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const prop of props) {
    // Handle [key, [toJSON, fromJSON]] tuple with processor
    if (Array.isArray(prop)) {
      const [key, processors] = prop;
      const value = obj[key as keyof T];
      if (value === undefined) continue;

      // Use the toJSON processor (index 0)
      const toJSONProcessor = processors[0];
      result[key as string] = toJSONProcessor(value);
      continue;
    }

    // Handle simple key - auto-detect type
    const key = prop as keyof T;
    const value = obj[key];
    if (value === undefined) continue;

    // Auto-detect Date objects
    if (isDate(value)) {
      result[key as string] = serializeDate(value);
      continue;
    }

    // Auto-detect entity arrays
    if (isEntityArray(value)) {
      result[key as string] = serializeEntityArray(value);
      continue;
    }

    // Auto-detect single entity
    if (isEntity(value)) {
      result[key as string] = value.toJSON();
      continue;
    }

    // Primitives and plain objects
    result[key as string] = value;
  }

  return result;
}

/**
 * Smart deserialization using serializableProps array
 *
 * Processes each property from serializableProps:
 * - Simple keys: Direct assignment
 * - Tuples with processors: Uses the fromJSON processor (index 1)
 *
 * @param obj - Target object to assign to
 * @param data - Source data
 * @param serializableProps - Array of property configs (from entity definition)
 * @returns The target object with all properties assigned
 *
 * @example
 * static fromJSON(data: any): Activity {
 *   const parsed = typeof data === 'string' ? JSON.parse(data) : data;
 *   const activity = new Activity();
 *   deserializeProps(activity, parsed, activity.serializableProps);
 *   const metadata = parseMetadata(parsed._metadata);
 *   activity.loadedAt = metadata.loadedAt;
 *   return activity;
 * }
 */
export function deserializeProps<T extends object>(
  obj: T,
  data: any,
  props: ReadonlyArray<SerializableProp<T>>,
): T {
  for (const prop of props) {
    // Handle [key, [toJSON, fromJSON]] tuple with processor
    if (Array.isArray(prop)) {
      const [key, processors] = prop;
      const value = data[key as string];
      if (value === undefined) continue;

      // Use the fromJSON processor (index 1)
      const fromJSONProcessor = processors[1];
      (obj as any)[key] = fromJSONProcessor(value);
      continue;
    }

    // Handle simple key - direct assignment
    const key = prop as keyof T;
    const value = data[key as string];
    if (value === undefined) continue;

    (obj as any)[key] = value;
  }

  return obj;
}
