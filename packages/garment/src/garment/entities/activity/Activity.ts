import type { LoadOptions, MakePublicOptions } from '../serializable';
import type { Repository } from '../repository';

import { ContentContainer } from '..';
import { type GraphNodeArray, NodeType } from '../../content-graph';
import { GarmentEnv } from '../../enums';
import { cloneDeep, pick } from '../../utils';
import { LoadableEntity } from '../base';
import { arrayOf, dateOf, parseMetadata, serializeMetadata } from '../serializable';

// Register with ContentEntity factory
import { ContentEntity } from '../ContentEntity';

export class Activity extends LoadableEntity<Activity> {
  static api: any;

  repositoryId: number;
  parentId: number;
  type: string;
  position: number;
  meta: { [key: string]: any };
  relationships: object;
  contentContainers: ContentContainer[];
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;

  readonly serializableProps = [
    'id',
    'uid',
    'repositoryId',
    'parentId',
    'type',
    'position',
    'meta',
    'relationships',
    ['contentContainers', arrayOf(ContentContainer)],
    ['createdAt', dateOf()],
    ['updatedAt', dateOf()],
    ['publishedAt', dateOf()],
  ] as const;

  /**
   * Load activity content from storage
   * @param repository - Repository instance (required for container loading)
   * @param options - Load options
   * @returns Promise resolving to the activity itself
   */
  async load(repository: Repository, options?: LoadOptions): Promise<Activity> {
    // Skip loading if already loaded (unless force option is set)
    if (this.isLoaded && !options?.force) {
      return this;
    }
    const { contentContainers } = this;
    if (repository && contentContainers?.length) {
      const fetch = contentContainers.map((it) =>
        this.getContainer(repository, it.sourceKey),
      );
      await Promise.all(fetch).then((containers) => {
        this.contentContainers = containers;
      });
    }
    this.trackLoading();
    return this;
  }

  /**
   * Make activity content publicly accessible by signing URLs
   * @param interval - Signature validity interval in seconds (optional)
   * @param options - Options including force re-signing
   * @returns Promise resolving to the activity itself for chaining
   */
  async makePublic(
    interval?: number,
    options?: MakePublicOptions,
  ): Promise<Activity> {
    // Check if content is stale (approaching expiration)
    const isStale = this.isStale();
    const needsResigning = this.needsResigning();

    // If stale but not expired and not forced, trigger deferred re-signing
    if (!options?.force && isStale && !needsResigning) {
      void this.triggerDeferredResigning(interval);
      return this;
    }

    // Skip re-signing if fresh (unless force option is set)
    if (!options?.force && !needsResigning) {
      return this;
    }

    const containerPromises = this.contentContainers?.length
      ? this.contentContainers.map((it) => it.makePublic(interval, options))
      : [];
    await Promise.all([
      ...containerPromises,
      Activity.api.processMeta(this.meta, interval),
    ]);

    this.trackSigning(interval, options?.deferred);
    return this;
  }

  /**
   * Get container by loading from storage
   * Note: This method requires repository context. Consider using TailorContent.findNode()
   * for unified entity lookup, or provide repository explicitly.
   *
   * @param repository - Repository instance (required for storage paths)
   * @param id - Container ID or source key
   * @returns Promise resolving to loaded ContentContainer
   */
  async getContainer(
    repository: Repository,
    id: number | string,
  ): Promise<ContentContainer> {
    const containerManifest = this.contentContainers?.find(
      (it) => it.sourceKey === id,
    );
    if (!containerManifest)
      throw new Error(`The container '${id}' does not exist!`);
    const repositoryKey =
      repository.env === GarmentEnv.Source
        ? repository.sourceKey
        : repository.snapshotKey;
    const containerData = await Activity.api.getContainer(
      id,
      repositoryKey,
      repository.envPath,
      containerManifest.fileExtension,
    );
    const container = ContentContainer.fromJSON({
      ...containerManifest,
      ...containerData,
    });
    // Mark as loaded by setting loadedAt (isLoaded is a computed getter)
    container.loadedAt = new Date();
    return container;
  }

  getSubtreeDescriptors(): Array<GraphNodeArray> {
    const node = [this.id, this.uid, NodeType.ACTIVITY, this.parentId];
    const children = this.contentContainers?.length
      ? this.contentContainers.reduce(
          (acc, it, i) => acc.concat(it.getSubtreeDescriptors(this.id, i)),
          [] as any,
        )
      : [];
    return [node, ...children];
  }

  /**
   * Serialize activity to JSON
   * Includes all data and metadata needed for reconstruction
   * Uses serializableProps for automatic transformation
   */
  toJSON(): any {
    return {
      __type: this.constructor.name,
      ...this.serializeWithProps(),
      _metadata: serializeMetadata(this),
    };
  }

  /**
   * Serialize activity for storage (S3, disk, etc.)
   * Excludes operational metadata like isLoaded, loadedAt, signedAt
   */
  toStorage(): any {
    return {
      __type: this.constructor.name,
      ...this.serializeWithProps(),
    };
  }

  /**
   * Deserialize activity from JSON data
   * Uses serializableProps for automatic transformation
   */
  static fromJSON(data: any): Activity {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const activity = new Activity();
    activity.deserializeWithProps(parsed);
    // Filter out i18n containers (keep only default language)
    // TODO: Remove when full i18n support is implemented
    if (activity.contentContainers?.length) {
      activity.contentContainers = activity.contentContainers.filter(
        (cc) => !cc.data?._i18n || cc.data._i18n === 'en',
      );
    }
    const metadata = parseMetadata(parsed._metadata);
    activity.loadedAt = metadata.loadedAt;
    activity.signedAt = metadata.signedAt;
    activity.signedInterval = metadata.signedInterval;
    return activity;
  }

  /**
   * Create a deep clone of the activity
   */
  clone(): Activity {
    return Object.assign(new Activity(), {
      ...pick(this, this.serializableProps as any, 'clone'),
      relationships: cloneDeep(this.relationships),
      meta: cloneDeep(this.meta),
      contentContainers: this.contentContainers?.map((cc) => cc.clone()) || [],
      loadedAt: this.loadedAt,
      signedAt: this.signedAt,
      signedInterval: this.signedInterval,
    });
  }

  /**
   * Get all cache keys for this activity and its children
   * Recursively collects keys from all nested entities
   * @param namespace - Cache namespace (defaults to 'tlr')
   * @returns Array of cache key strings
   */
  getCacheKeys(namespace = 'tlr'): string[] {
    const keys = [this.getCacheKey(namespace)];
    if (this.contentContainers?.length) {
      for (const container of this.contentContainers) {
        keys.push(...container.getCacheKeys(namespace));
      }
    }
    return keys;
  }
}

ContentEntity.register('Activity', Activity);
