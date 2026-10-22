import { EntityEvent } from '../../interfaces';
import { BaseEntity } from './BaseEntity';

/**
 * Base class for entities with loadable nested content
 * Extends BaseEntity with loading state tracking
 */
export abstract class LoadableEntity<T = any> extends BaseEntity<T> {
  /**
   * Timestamp when entity was last loaded
   */
  loadedAt?: Date;

  /**
   * Whether entity content has been loaded from storage
   * Computed from loadedAt
   */
  get isLoaded(): boolean {
    return !!this.loadedAt;
  }

  /**
   * Load entity content from storage
   * Must be implemented by each entity
   * Subclasses may require additional parameters (e.g., Repository for Activity)
   * @param args - Load arguments (options, repository, etc.)
   * @returns Promise resolving to the entity itself
   */
  abstract load(...args: any[]): Promise<T>;

  /**
   * Check if entity needs to be reloaded based on age
   * @param maxAge - Maximum age in milliseconds (optional)
   * @returns true if needs reload, false otherwise
   */
  needsReload(maxAge?: number): boolean {
    if (!this.isLoaded) {
      return true;
    }
    if (!maxAge || !this.loadedAt) {
      return false;
    }
    const age = Date.now() - this.loadedAt.getTime();
    return age > maxAge;
  }

  /**
   * Track when entity was loaded
   * Should be called by load() implementations
   * Emits LOADED event and marks entity as dirty
   */
  protected trackLoading(): void {
    this.loadedAt = new Date();
    this.markDirty();
    this.emit(EntityEvent.LOADED, {
      uid: this.uid,
      loadedAt: this.loadedAt,
    });
  }
}
