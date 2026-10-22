import type { Repository } from '../repository';

import type { LoadOptions, MakePublicOptions } from '../serializable';
import { cloneDeep, pick } from '../../utils';
import { BaseEntity } from '../base';
import { parseMetadata, serializeMetadata } from '../serializable';

// Register with ContentEntity factory
import { ContentEntity } from '../ContentEntity';

export class CatalogEntry extends BaseEntity<CatalogEntry> {
  static api: any;

  schema: string;
  name: string;
  description: string;
  meta: { [key: string]: any };
  repository?: Repository;
  publishedAt: string;
  detachedAt: string;

  readonly serializableProps = [
    'id',
    'uid',
    'schema',
    'name',
    'description',
    'meta',
    'publishedAt',
    'detachedAt',
  ] as const;

  /**
   * Make catalog entry content publicly accessible by signing URLs
   * @param interval - Signature validity interval in seconds (optional)
   * @param options - Options including force re-signing
   * @returns Promise resolving to the entry itself for chaining
   */
  async makePublic(
    interval?: number,
    options?: MakePublicOptions,
  ): Promise<CatalogEntry> {
    // Check if content is stale (approaching expiration)
    const isStale = this.isStale();
    const needsResigning = this.needsResigning();

    // If stale but not expired and not forced, trigger deferred re-signing
    if (!options?.force && isStale && !needsResigning) {
      void this.triggerDeferredResigning(interval);
      return this;
    }

    // Skip re-signing if already fresh (unless force option is set)
    if (!options?.force && !needsResigning) {
      return this;
    }

    await CatalogEntry.api.processMeta(this.meta, interval);
    this.trackSigning(interval, options?.deferred);
    return this;
  }

  /**
   * Check if catalog entry has newer publishedAt than given repository
   * @param repository - Repository to compare against
   * @returns true if catalog entry is newer (has updates)
   */
  isUpdated(repository: Repository): boolean {
    const catalogDate = this.publishedAt
      ? new Date(this.publishedAt)
      : new Date(0);
    const repoDate = repository.publishedAt
      ? new Date(repository.publishedAt)
      : new Date(0);
    return catalogDate > repoDate;
  }

  /**
   * Load the full repository for this catalog entry
   * @param options - Load options (force reload, deep load, etc.)
   * @returns Promise resolving to the loaded Repository
   *
   * @example
   * Fetch repository AND load all nested content (Activities, Containers)
   * default behavior
   * const repo = await catalogEntry.load()
   *
   * @example
   * Just fetch repository metadata without loading content
   * const repo = await catalogEntry.load({ deep: false })
   */
  async load(options?: LoadOptions): Promise<Repository> {
    if (this.repository && !options?.force) {
      return this.repository;
    }
    const repository = await CatalogEntry.api.getRepository(
      this.id,
      'repository',
      options,
    );
    this.repository = repository;

    // Deep load by default (can be explicitly disabled with deep: false)
    const shouldDeepLoad = options?.deep !== false;
    if (shouldDeepLoad) {
      await repository.load(options);
    }

    return repository;
  }

  /**
   * Serialize catalog entry to JSON
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
   * Deserialize catalog entry from JSON data
   * Uses serializableProps with automatic processing
   */
  static fromJSON(data: any): CatalogEntry {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const entry = new CatalogEntry();
    entry.deserializeWithProps(parsed);
    const metadata = parseMetadata(parsed._metadata);
    entry.signedAt = metadata.signedAt;
    entry.signedInterval = metadata.signedInterval;
    return entry;
  }

  /**
   * Create a deep clone of the catalog entry
   */
  clone(): CatalogEntry {
    return Object.assign(new CatalogEntry(), {
      ...pick(this, this.serializableProps as any, 'clone'),
      meta: cloneDeep(this.meta),
      signedAt: this.signedAt,
      signedInterval: this.signedInterval,
    });
  }

  /**
   * Get cache key for catalog entry
   * Uses different namespace than Repository to distinguish between
   * lightweight catalog entries and full repository data
   * @param namespace - Cache namespace (defaults to 'tlr')
   * @returns Cache key string
   */
  getCacheKey(namespace = 'tlr'): string {
    return `${namespace}:catalog:${this.uid}`;
  }
}

ContentEntity.register('CatalogEntry', CatalogEntry);
