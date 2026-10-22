import type { FileStorageConfig } from '../storage/interfaces';
import type { FileKeyType, GarmentConfig } from './interfaces';

import API from '../api';
import {
  Activity,
  CatalogCollection,
  CatalogEntry,
  ContentContainer,
  ContentElement,
  Repository,
  TailorContent,
} from './entities';
import { instanceProcessor, literalProcessor } from './entities/repository';
import { GarmentEnv } from './enums';
import { GarmentLogger } from './logger';

interface GetOptions { eager?: boolean }

class Garment {
  config: GarmentConfig;
  api: API;

  constructor(
    storageConfig: FileStorageConfig,
    garmentConfig: Partial<GarmentConfig> = {},
  ) {
    // Merge provided config with defaults
    const defaults: GarmentConfig = {
      [GarmentEnv.Source]: 'repository',
      [GarmentEnv.Snapshot]: 'snapshots',
      fileKeyProp: 'id',
    };
    this.config = { ...defaults, ...garmentConfig } as GarmentConfig;
    this.api = new API(storageConfig, this.config);

    // Initialize logger
    const logger = new GarmentLogger(this.config.logger || {});

    // Set static properties on entities
    CatalogEntry.api
      = Repository.api
        = Activity.api
          = ContentElement.api
            = ContentContainer.api
              = this.api;

    CatalogEntry.logger
      = Repository.logger
        = Activity.logger
          = ContentElement.logger
            = ContentContainer.logger
              = TailorContent.logger
                = logger;

    Repository.fileKeyProp
      = ContentContainer.fileKeyProp
        = this.config.fileKeyProp;
  }

  source = () => ({
    list: () => this.list(),
    get: (id: FileKeyType, options: GetOptions = {}) => {
      return this.get(id, GarmentEnv.Source, options.eager);
    },
    getContainer: (id: string, repositoryId: string) =>
      this.getContainer(id, repositoryId, GarmentEnv.Source),
  });

  snapshot = () => ({
    get: (id: FileKeyType, version: string, options: GetOptions = {}) => {
      const snapshotKey = Repository.getSnapshotKey(id, version);
      return this.get(snapshotKey, GarmentEnv.Snapshot, options.eager);
    },
    getContainer: (id: string, repositoryId: string) =>
      this.getContainer(id, repositoryId, GarmentEnv.Snapshot),
  });

  addContentElementProcessor = (
    processorRegistry: (
      type: string,
    ) => ((element: ContentElement) => Promise<void>) | undefined,
  ) => {
    ContentElement.customProcessorRegistry = processorRegistry;
  };

  toRepositoryInstance = (repository: any) => {
    const instance = Repository.fromJSON(repository);
    return instanceProcessor(instance);
  };

  private list(): Promise<CatalogCollection> {
    return this.api.list()
      .then((items) => items.map((item: any) => CatalogEntry.fromJSON(item)))
      .then((entries) => new CatalogCollection(entries));
  }

  private get(id: FileKeyType, env: GarmentEnv, eager = false): Promise<Repository> {
    const location = this.config[env];
    return this.api.get(id, location)
      .then((item) => literalProcessor(item, { env, config: this.config }))
      .then((repository) => Repository.fromJSON(repository))
      .then((repository) => instanceProcessor(repository))
      .then((repository) => eager ? repository.load() : repository);
  }

  private getContainer(id: string, repositoryId: string, env: GarmentEnv) {
    const location = this.config[env];
    return this.api.getContainer(id, repositoryId, location);
  }
}

export default Garment;
