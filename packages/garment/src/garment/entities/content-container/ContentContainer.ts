import type { LoadOptions, MakePublicOptions } from '../serializable';

import { type GraphNodeArray, NodeType } from '../../content-graph';
import { cloneDeep, pick } from '../../utils';
import { LoadableEntity } from '../base';
import { ContentElement } from '../content-element';
import { arrayOf, dateOf, parseMetadata, serializeMetadata } from '../serializable';

// Register with ContentEntity factory
import { ContentEntity } from '../ContentEntity';

export class ContentContainer extends LoadableEntity<ContentContainer> {
  static api: any;

  parentId: number;
  type: string;
  position: number;
  publishedAs: string;
  data: { [key: string]: any };
  containers: ContentContainer[];
  elements: ContentElement[];
  createdAt?: Date;
  updatedAt?: Date;

  readonly serializableProps = [
    'id',
    'uid',
    'parentId',
    'type',
    'position',
    'publishedAs',
    'data',
    ['containers', arrayOf(ContentContainer)],
    ['elements', arrayOf(ContentElement)],
    ['createdAt', dateOf()],
    ['updatedAt', dateOf()],
  ] as const;

  get fileExtension(): string {
    return `${this.publishedAs}.json`;
  }

  async load(options?: LoadOptions): Promise<ContentContainer> {
    // ContentContainer doesn't have nested loadable content currently
    // But implements the interface for consistency
    if (this.isLoaded && !options?.force) {
      return this;
    }
    this.trackLoading();
    return this;
  }

  /**
   * Make container content publicly accessible by signing URLs
   * @param interval - Signature validity interval in seconds (optional)
   * @param options - Options including force re-signing
   * @returns Promise resolving to the container itself for chaining
   */
  async makePublic(
    interval?: number,
    options?: MakePublicOptions,
  ): Promise<ContentContainer> {
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

    // Parallelize all signing operations (meta, elements, nested containers)
    const tasks = [ContentContainer.api.processMeta(this.data)];
    if (this.elements?.length) {
      tasks.push(
        ...this.elements.map((it) => it.makePublic(interval, options)),
      );
    }
    if (this.containers?.length) {
      tasks.push(
        ...this.containers.map((it) => it.makePublic(interval, options)),
      );
    }

    await Promise.all(tasks);
    this.trackSigning(interval, options?.deferred);
    return this;
  }

  getSubtreeDescriptors(
    parentActivityId: number,
    positionInAggregate: number,
  ): Array<GraphNodeArray> {
    const node = [
      this.id,
      this.uid,
      NodeType.CONTENT_CONTAINER,
      parentActivityId,
      positionInAggregate,
    ];
    const childElements = this.elements?.length
      ? this.elements.map((it, i) => it.getNodeDescriptor(this.id, i))
      : [];
    const childContainers = this.containers?.length
      ? this.containers.reduce(
          (acc, it, i) => acc.concat(it.getSubtreeDescriptors(this.id, i)),
          [] as any,
        )
      : [];
    return [node, ...childElements, ...childContainers];
  }

  /**
   * Serialize content container to JSON
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
   * Serialize container for storage (S3, disk, etc.)
   * Excludes operational metadata
   */
  toStorage(): any {
    return {
      __type: this.constructor.name,
      ...this.serializeWithProps(),
    };
  }

  /**
   * Deserialize content container from JSON data
   * Uses serializableProps with automatic processing
   */
  static fromJSON(data: any): ContentContainer {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const container = new ContentContainer();
    container.deserializeWithProps(parsed);
    const metadata = parseMetadata(parsed._metadata);
    container.loadedAt = metadata.loadedAt;
    container.signedAt = metadata.signedAt;
    container.signedInterval = metadata.signedInterval;
    return container;
  }

  /**
   * Create a deep clone of the content container
   */
  clone(): ContentContainer {
    return Object.assign(new ContentContainer(), {
      ...pick(this, this.serializableProps as any, 'clone'),
      data: cloneDeep(this.data),
      elements: this.elements?.map((el) => el.clone()) || [],
      containers: this.containers?.map((cc) => cc.clone()) || [],
      loadedAt: this.loadedAt,
      signedAt: this.signedAt,
      signedInterval: this.signedInterval,
    });
  }

  /**
   * Get all cache keys for this container and its children
   * Recursively collects keys from all nested entities
   * @param namespace - Cache namespace (defaults to 'tlr')
   * @returns Array of cache key strings
   */
  getCacheKeys(namespace = 'tlr'): string[] {
    const keys = [this.getCacheKey(namespace)];
    if (this.elements?.length) {
      for (const element of this.elements) {
        keys.push(element.getCacheKey(namespace));
      }
    }
    if (this.containers?.length) {
      for (const container of this.containers) {
        keys.push(...container.getCacheKeys(namespace));
      }
    }
    return keys;
  }
}

ContentEntity.register('ContentContainer', ContentContainer);
