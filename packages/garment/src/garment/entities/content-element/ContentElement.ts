import type { MakePublicOptions } from '../serializable';
import set from 'set-value';

import camelCase from 'to-camel-case';
import { type GraphNodeArray, NodeType } from '../../content-graph';
import { cloneDeep, pick } from '../../utils';
import { BaseEntity } from '../base';
import { dateOf, parseMetadata, serializeMetadata } from '../serializable';

// Register with ContentEntity factory
import { ContentEntity } from '../ContentEntity';

// seconds, 12 hrs
const DEFAULT_ACCESS_TOKEN_INTERVAL = 12 * 60 * 60;
const INTERNAL_STORAGE_PROTOCOL = 'storage://';
const isAssessment = (type: string) => ['ASSESSMENT', 'REFLECTION'].includes(type);

export class ContentElement extends BaseEntity<ContentElement> {
  static api: any;
  /**
   * Custom processors contain server side methods required for the execution of
   * specific content elements
   */
  static customProcessorRegistry: (
    type: string,
  ) => ((element: ContentElement) => Promise<void>) | undefined;

  contentId: string;
  contentSignature: string;
  type: string;
  position: number;
  refs: { [key: string]: any };
  meta: { [key: string]: any };

  data: {
    assets: { [key: string]: string };
    [key: string]: any;
  };

  createdAt?: Date;
  updatedAt?: Date;

  readonly serializableProps = [
    'id',
    'uid',
    'contentId',
    'contentSignature',
    'type',
    'position',
    'refs',
    'meta',
    'data',
    ['createdAt', dateOf()], // Date with toJSON/fromJSON processors
    ['updatedAt', dateOf()], // Date with toJSON/fromJSON processors
  ] as const;

  get customProcessor():
    | ((element: ContentElement) => Promise<void>)
    | undefined {
    return ContentElement.customProcessorRegistry?.(this.type);
  }

  /**
   * Make content element publicly accessible by signing URLs
   * @param interval - Signature validity interval in seconds (defaults to 12 hours)
   * @param options - Options including force re-signing
   * @returns Promise resolving to the element itself for chaining
   */
  async makePublic(
    interval = DEFAULT_ACCESS_TOKEN_INTERVAL,
    options?: MakePublicOptions,
  ): Promise<ContentElement> {
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

    await Promise.all([
      this.processAssets(interval),
      ContentElement.api.processMeta(this.meta, interval),
    ]);

    if (this.customProcessor) {
      await this.customProcessor(this);
    }

    this.trackSigning(interval, options?.deferred);
    return this;
  }

  /**
   * Signs all asset urls within the data.assets key-value pair definition;
   * adds token param which enables access for a limited time.
   * Key denotes location within the data property where the resolved asset url
   * should be set (e.g. assets['deep.url'] = 'storage://test.png' should
   * result in signed 'storage://test.png' url set on data['deep.url'] path).
   */
  private async processAssets(interval: number) {
    if (!this.data?.assets) {
      // Support legacy image format
      if (this.type === 'IMAGE' && this.data?.url?.startsWith('repository/'))
        this.processLegacyImageElement();
      else
        return;
    }

    const assets = Object.entries(this.data.assets);
    return Promise.all(assets.map(async ([keyWithinData, url = '']) => {
      url = this.isStorageAsset(url)
        ? await this.getSignedAssetUrl(url, interval)
        : url;
      set(this.data, keyWithinData, url);
    }));
  }

  private async processLegacyImageElement() {
    this.data.assets = { url: `${INTERNAL_STORAGE_PROTOCOL}${this.data.url}` };
  }

  private getSignedAssetUrl(url: string, interval: number) {
    return ContentElement.api.getSignedUrl(this.getAssetPath(url), interval);
  }

  private isStorageAsset(url: string) {
    return url.startsWith(INTERNAL_STORAGE_PROTOCOL);
  }

  private getAssetPath(url: string) {
    return url.substring(INTERNAL_STORAGE_PROTOCOL.length);
  }

  getNodeDescriptor(
    parentActivityId: number,
    positionInAggregate: number,
  ): GraphNodeArray {
    return [
      this.id,
      this.uid,
      NodeType.CONTENT_ELEMENT,
      parentActivityId,
      positionInAggregate,
    ];
  }

  /**
   * Serialize content element to JSON
   * Uses serializableProps with automatic date processing
   * Injects @type for protobuf compatibility in data field
   */
  toJSON(): any {
    const serialized = this.serializeWithProps();
    if (serialized.data) {
      serialized.data = {
        ...serialized.data,
        '@type': camelCase(isAssessment(this.type)
          ? `${this.type}_${this.data?.type}`
          : this.type, { pascalCase: true }),
      };
    }
    return {
      __type: this.constructor.name,
      ...serialized,
      _metadata: serializeMetadata(this),
    };
  }

  /**
   * Serialize element for storage (S3, disk, etc.)
   * Excludes operational metadata
   */
  toStorage(): any {
    const serialized = this.serializeWithProps();
    // Inject @type into data field for protobuf compatibility
    if (serialized.data) {
      serialized.data = {
        ...serialized.data,
        '@type': camelCase(isAssessment(this.type)
          ? `${this.type}_${this.data?.type}`
          : this.type, { pascalCase: true }),
      };
    }
    return {
      __type: this.constructor.name,
      ...serialized,
    };
  }

  /**
   * Deserialize content element from JSON data
   * Uses serializableProps with automatic date processing
   */
  static fromJSON(data: any): ContentElement {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const element = new ContentElement();
    element.deserializeWithProps(parsed);
    const metadata = parseMetadata(parsed._metadata);
    element.signedAt = metadata.signedAt;
    element.signedInterval = metadata.signedInterval;
    return element;
  }

  /**
   * Create a deep clone of the content element
   */
  clone(): ContentElement {
    return Object.assign(new ContentElement(), {
      ...pick(this, this.serializableProps as any, 'clone'),
      refs: cloneDeep(this.refs),
      meta: cloneDeep(this.meta),
      data: cloneDeep(this.data),
      signedAt: this.signedAt,
      signedInterval: this.signedInterval,
    });
  }
}

ContentEntity.register('ContentElement', ContentElement);
