import type {
  EntityEventData,
  ExpirationConfig,
  FileKey,
} from '../../interfaces';
import type {
  MakePublicOptions,
  Serializable,
  SignableMetadata,
} from '../serializable';
import { deserializeProps, serializeProps } from '../serializable';

import bytes from 'bytes';
import sizeof from 'object-sizeof';
import { ExpirationState } from '../../enums';
import { EventEmitter } from '../../EventEmitter';
import { EntityEvent } from '../../interfaces';
import { defaultLogger, type GarmentLogger } from '../../logger';
import { isString } from '../../utils';

/**
 * Default expiration configuration (12 hours expiration, stale after 8 hours)
 */
const DEFAULT_EXPIRATION_CONFIG: ExpirationConfig = {
  staleThreshold: 8 * 60 * 60 * 1000, // 8 hours in ms
  expirationTime: 12 * 60 * 60 * 1000, // 12 hours in ms
};

/**
 * Base class for all Garment entities
 * Provides common functionality for serialization, expiration tracking, and events
 */
export abstract class BaseEntity<T = any>
implements Serializable<T>, SignableMetadata {
  /**
   * File key property to use for sourceKey getter
   * Can be overridden by subclasses
   */
  static fileKeyProp: FileKey = 'id';

  /**
   * Logger instance set by Garment constructor
   * Defaults to silent logger until configured
   */
  static logger: GarmentLogger = defaultLogger;

  /**
   * Numeric ID of the entity
   */
  id: number;

  /**
   * String UID of the entity
   */
  uid: string;

  /**
   * Timestamp when entity was last signed (makePublic called)
   */
  signedAt?: Date;

  /**
   * Interval in seconds that was used when signing
   */
  signedInterval?: number;

  /**
   * Dirty flag - indicates if entity state has changed since last cache write
   */
  private _isDirty = false;

  /**
   * Event emitter for entity state changes
   */
  private _events = new EventEmitter();

  /**
   * Promise that resolves when all deferred operations complete
   * Null when no deferred operations are in progress
   */
  private _deferredPromise: Promise<this> | null = null;

  /**
   * Check if entity has unsaved changes
   */
  get isDirty(): boolean {
    return this._isDirty;
  }

  /**
   * Mark entity as dirty (state changed)
   */
  protected markDirty(): void {
    if (!this._isDirty) {
      this._isDirty = true;
      this.emit(EntityEvent.DIRTY, { uid: this.uid, timestamp: new Date() });
    }
  }

  /**
   * Mark entity as clean (state persisted to cache)
   */
  markClean(): void {
    this._isDirty = false;
  }

  /**
   * Drop the signing state for the entity.
   */
  clearSigningState(): void {
    this.signedAt = undefined;
    this.signedInterval = undefined;
  }

  /**
   * Get entity context for logging
   * Override in subclasses for custom context
   * @returns Entity context string (e.g., "Repository:123")
   */
  protected getLogContext(): string {
    const className = this.constructor.name.replace(/^_/, '');
    const key = this.id || this.uid;
    return key ? `${className}:${key}` : className;
  }

  /**
   * Get logger instance for this entity class
   * @returns GarmentLogger instance
   */
  protected get logger(): GarmentLogger {
    return (this.constructor as typeof BaseEntity).logger;
  }

  /**
   * Create a scoped logger for a specific operation
   * Prefixes all log messages with entity context and scope
   * @param scope - Operation scope (e.g., 'sync', 'init', 'refresh')
   * @returns Scoped logger with info, debug, warn, error methods
   *
   * @example
   * const log = this.scopedLog('sync');
   * log.info('Starting'); // [Repository:123] [sync] Starting
   * log.debug('Details'); // [Repository:123] [sync] Details
   */
  protected scopedLog(scope: string) {
    const prefix = `${this.getLogContext()} [${scope}]`;
    return {
      info: (msg: string) => this.logger.info(`${prefix} ${msg}`),
      debug: (msg: string) => this.logger.debug(`${prefix} ${msg}`),
      warn: (msg: string) => this.logger.warn(`${prefix} ${msg}`),
      error: (msg: string) => this.logger.error(`${prefix} ${msg}`),
    };
  }

  /**
   * Subscribe to entity events
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on(event: string, handler: (data: EntityEventData) => void): () => void {
    return this._events.on(event, handler);
  }

  /**
   * Subscribe to entity event for one-time execution
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  once(event: string, handler: (data: EntityEventData) => void): () => void {
    return this._events.once(event, handler);
  }

  /**
   * Unsubscribe from entity event
   * @param event - Event name
   * @param handler - Event handler function
   */
  off(event: string, handler: (data: EntityEventData) => void): void {
    this._events.off(event, handler);
  }

  /**
   * Emit an entity event
   * @param event - Event name
   * @param data - Event data
   */
  protected emit(event: string, data: EntityEventData): void {
    this._events.emit(event, data);
  }

  /**
   * Get the source key for this entity
   * Uses the fileKeyProp to determine which property to use
   */
  get sourceKey(): string {
    const Constructor = this.constructor as typeof BaseEntity;
    const key = this[Constructor.fileKeyProp];
    return isString(key) ? key : String(key);
  }

  /**
   * Get the memory size of this entity
   */
  get size(): string {
    return bytes(sizeof(this)) ?? '0B';
  }

  /**
   * Get cache key for this entity
   * @param namespace - Cache namespace (defaults to 'tlr')
   * @returns Cache key string
   */
  getCacheKey(namespace = 'tlr'): string {
    return `${namespace}:n:${this.uid}`;
  }

  /**
   * Properties that should be serialized
   * Must be defined by each entity
   */
  abstract readonly serializableProps: readonly any[];

  /**
   * Helper method to serialize entity using serializableProps
   * Child classes can use this in their toJSON() implementation
   *
   * @returns Object with serialized properties
   *
   * @example
   * toJSON() {
   *   return {
   *     __type: this.constructor.name,
   *     ...this.serializeWithProps(),
   *     _metadata: serializeMetadata(this),
   *   };
   * }
   */
  protected serializeWithProps(): Record<string, any> {
    return serializeProps(this, this.serializableProps);
  }

  /**
   * Helper method to deserialize data into entity using serializableProps
   * Child classes can use this in their fromJSON() static method
   *
   * @param data - Data to deserialize from
   *
   * @example
   * static fromJSON(data: any) {
   *   const entity = new Entity();
   *   entity.deserializeWithProps(data);
   *   Handle metadata...
   *   return entity;
   * }
   */
  protected deserializeWithProps(data: any): void {
    deserializeProps(this, data, this.serializableProps);
  }

  /**
   * Serialize entity to JSON
   * Must be implemented by each entity
   */
  abstract toJSON(): any;

  /**
   * Create a clone of the entity
   * Must be implemented by each entity
   */
  abstract clone(): T;

  /**
   * Make entity content publicly accessible by signing URLs
   * Must be implemented by each entity
   * @param interval - Signature validity interval in seconds
   * @param options - Options including force re-signing
   * @returns Promise resolving to the entity itself for chaining
   */
  abstract makePublic(
    interval?: number,
    options?: MakePublicOptions,
  ): Promise<T>;

  /**
   * Get the expiration config for this entity
   * Uses tracked signedInterval if available, otherwise falls back to provided or default config
   */
  private getExpirationConfig(config?: ExpirationConfig): ExpirationConfig {
    if (this.signedInterval) {
      return {
        expirationTime: this.signedInterval * 1000,
        // 1hr before expiry
        staleThreshold: Math.max(0, this.signedInterval * 1000 - 3600000),
      };
    }
    return config ?? DEFAULT_EXPIRATION_CONFIG;
  }

  /**
   * Get the expiration state of signed content
   * @param config - Custom expiration configuration (optional)
   * @returns Current expiration state (fresh/stale/expired/never_signed)
   */
  getExpirationState(config?: ExpirationConfig): ExpirationState {
    if (!this.signedAt) {
      return ExpirationState.NEVER_SIGNED;
    }

    const expirationConfig = this.getExpirationConfig(config);
    const now = Date.now();
    const signedTime = this.signedAt.getTime();
    const age = now - signedTime;

    if (age >= expirationConfig.expirationTime) {
      return ExpirationState.EXPIRED;
    }

    const timeUntilExpiration = expirationConfig.expirationTime - age;
    if (timeUntilExpiration <= expirationConfig.staleThreshold) {
      return ExpirationState.STALE;
    }

    return ExpirationState.FRESH;
  }

  /**
   * Check if content needs to be re-signed
   * @param config - Custom expiration configuration (optional)
   * @returns true if content is expired or never signed
   */
  needsResigning(config?: ExpirationConfig): boolean {
    const state = this.getExpirationState(config);
    return (
      state === ExpirationState.EXPIRED ||
      state === ExpirationState.NEVER_SIGNED
    );
  }

  /**
   * Get time remaining until content expires
   * @param config - Custom expiration configuration (optional)
   * @returns milliseconds until expiration, or null if never signed
   */
  getTimeUntilExpiration(config?: ExpirationConfig): number | null {
    if (!this.signedAt) {
      return null;
    }

    const expirationConfig = this.getExpirationConfig(config);
    const now = Date.now();
    const signedTime = this.signedAt.getTime();
    const age = now - signedTime;
    const remaining = expirationConfig.expirationTime - age;

    return Math.max(0, remaining);
  }

  /**
   * Track when content was signed
   * Should be called by makePublic() implementations
   * Emits SIGNED event and marks entity as dirty (for cache updates via toJSON)
   * @param interval - Interval in seconds
   * @param deferred - Whether this is a deferred re-signing operation
   */
  protected trackSigning(interval?: number, deferred = false): void {
    this.signedAt = new Date();
    this.signedInterval = interval;
    this.markDirty();
    this.emit(EntityEvent.SIGNED, {
      uid: this.uid,
      signedAt: this.signedAt,
      interval,
      deferred,
    });
  }

  /**
   * Check if content is stale (approaching expiration but not yet expired)
   * @param config - Custom expiration configuration (optional)
   * @returns true if content is stale
   */
  isStale(config?: ExpirationConfig): boolean {
    return this.getExpirationState(config) === ExpirationState.STALE;
  }

  /**
   * Trigger deferred re-signing for stale content
   * Does not block the calling code
   * @param interval - Signature validity interval in seconds
   */
  protected triggerDeferredResigning(interval?: number): void {
    // If already signing in background, don't start another
    if (this._deferredPromise) {
      return;
    }
    // Trigger re-signing in background (don't await)
    // Will emit SIGNED event with deferred: true when complete
    this._deferredPromise = this.makePublic(interval, {
      force: true,
      deferred: true,
    })
      .then(() => {
        this._deferredPromise = null;
        return this as this;
      })
      .catch((error) => {
        // Silently handle errors in deferred signing
        // Users can subscribe to events to monitor this
        console.warn(`Deferred re-signing failed for ${this.uid}:`, error);
        this._deferredPromise = null;
        throw error;
      });
  }

  /**
   * Wait for all deferred operations to complete
   * Returns immediately if no deferred operations are in progress
   * Useful for ensuring entity is fully settled before persisting to cache
   *
   * @returns Promise that resolves to the entity when all operations complete
   *
   * @example
   * Stale content - triggers deferred signing, returns immediately
   * await repository.makePublic()
   * Later: wait for deferred signing to complete, then save
   * await repository.settled().then(r => cache.set(r.getCacheKey(), r.toJSON()))
   *
   * @example
   * Alternative: chain directly
   * await repository.makePublic()
   * await repository.settled()
   * await cache.set(repository.getCacheKey(), repository.toJSON())
   */
  settled(): Promise<this> {
    return this._deferredPromise ?? Promise.resolve(this as this);
  }
}
