import { Activity } from './activity';
import { CatalogCollection, CatalogEntry } from './catalog-entry';
import { ContentContainer } from './content-container';
import { ContentElement } from './content-element';
import { Repository, RepositoryCollection } from './repository';
import { TailorContent } from './tailor-content';
import { AccessManager } from '../access';

export {
  AccessManager,
  Activity,
  CatalogCollection,
  CatalogEntry,
  ContentContainer,
  ContentElement,
  Repository,
  RepositoryCollection,
  TailorContent,
};

export type { EventHandler } from '../EventEmitter';

export { EntityEvent } from '../interfaces';

export type { EntityEventData } from '../interfaces';

export { BaseEntity, LoadableEntity } from './base';

export type { AnyContentEntity } from './ContentEntity';
export {
  ContentEntity,
  ContentEntityType,
} from './ContentEntity';
export type {
  LoadableMetadata,
  LoadOptions,
  MakePublicOptions,
  ProcessorTuple,
  Serializable,
  SerializableConstructor,
  SerializablePropConfig,
  SignableMetadata,
} from './serializable';
export {
  arrayOf,
  dateOf,
  entityOf,
  parseMetadata,
  serializeMetadata,
} from './serializable';
export type {
  SearchCriteria,
  SearchEntityType,
  SearchPredicate,
  SearchResult,
  TailorContentOptions,
} from './tailor-content';
