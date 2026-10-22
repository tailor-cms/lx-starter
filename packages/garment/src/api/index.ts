import type {
  FileKeyType,
  GarmentConfig,
  RepositoryAccessData,
} from '../garment/interfaces';

import type { FileStorage, FileStorageConfig } from '../storage/interfaces';
import path from 'node:path';
import {
  CatalogCollection,
  CatalogEntry,
  Repository,
} from '../garment/entities';
import {
  instanceProcessor,
  literalProcessor,
} from '../garment/entities/repository';
import { GarmentEnv } from '../garment/enums';
import initStorageAdapter from '../storage';
import initProcessMeta from './process-meta';

const CATALOG_FILENAME = 'index.json';
const REPOSITORY_ROOT_FILENAME = 'index.json';
const CONTAINER_EXTENSION = 'container.json';

class StorageAPI {
  #storage: FileStorage;
  #config: GarmentConfig;
  processMeta: (meta: any, interval?: number) => Promise<unknown[]>;

  constructor(storageConfig: FileStorageConfig, garmentConfig: GarmentConfig) {
    this.#storage = initStorageAdapter(storageConfig);
    this.#config = garmentConfig;
    this.processMeta = initProcessMeta(this, garmentConfig);
  }

  list(): Promise<[any]> {
    return this.#storage.getJSON(this.getCatalogPath());
  }

  /**
   * Get catalog collection with CatalogEntry instances
   */
  getCatalog(): Promise<CatalogCollection> {
    return this.list()
      .then((items) => items.map((item: any) => CatalogEntry.fromJSON(item)))
      .then((entries) => new CatalogCollection(entries));
  }

  get(id: FileKeyType, location = this.#config.sourcePath): Promise<any> {
    const repositoryPath = this.getRepositoryPath(id, location);
    const key = this.path(repositoryPath, REPOSITORY_ROOT_FILENAME);
    return this.#storage.getJSON(key);
  }

  /**
   * Get repository and process it into a Repository instance
   * This is used by CatalogEntry.load() to fetch full repository data
   * @param id - Repository ID
   * @param location - Storage location (default: 'repository')
   * @param _options - Load options (unused, for API compatibility)
   * @returns Promise resolving to processed Repository instance
   */
  async getRepository(
    id: FileKeyType,
    location = this.#config.sourcePath,
    _options?: any,
  ): Promise<Repository> {
    const item = await this.get(id, location);
    const processed = literalProcessor(item, {
      env: GarmentEnv.Source,
      config: this.#config,
    });
    const repository = Repository.fromJSON(processed);
    return instanceProcessor(repository);
  }

  /**
   * Get object from storage (returns both content string and raw buffer)
   * Used for compressed/binary data
   */
  getObject(key: string) {
    return this.#storage.getObject(key);
  }

  /**
   * Get repository access control data
   * Fetches the access file containing users and tenants associated with a repository
   * @param repositoryId - Repository ID
   * @returns Promise resolving to repository access data, or undefined if not found
   */
  async getRepositoryAccess(
    repositoryId: FileKeyType,
  ): Promise<RepositoryAccessData | undefined> {
    try {
      const accessPath = this.path(
        this.#config.sourcePath,
        `${repositoryId}`,
        'access.json',
      );
      const { raw } = await this.#storage.getObject(accessPath);
      return JSON.parse(raw.toString('utf8'));
    } catch {
      // Access file might not exist yet
      return undefined;
    }
  }

  /**
   * Save object to storage (string or buffer)
   * Used for compressed/binary data
   */
  saveObject(key: string, data: string | Buffer): Promise<void> {
    return this.#storage.saveObject(key, data);
  }

  getSignedUrl(key: string, secondsAvailable: number) {
    return this.#storage.getSignedObjectUrl(key, secondsAvailable);
  }

  clone(src: string, dst: string) {
    return this.#storage.copyDirectory(src, dst);
  }

  cloneToEnv(src: string, env: GarmentEnv, directory: '') {
    const dst = this.path(this.#config[env], directory);
    return this.#storage.copyDirectory(src, dst);
  }

  getContainer(
    id: string,
    repositoryId: string,
    location = this.#config.sourcePath,
    ext = CONTAINER_EXTENSION,
  ) {
    return this.#storage.getJSON(
      this.getContainerPath(id, repositoryId, location, ext),
    );
  }

  private getCatalogPath() {
    return this.path(this.#config.sourcePath, CATALOG_FILENAME);
  }

  private getRepositoryPath(
    id: FileKeyType,
    location = this.#config.sourcePath,
  ) {
    return this.path(location, `${id}`, '/');
  }

  private getContainerPath(
    containerId: string,
    repositoryId: string,
    location = this.#config.sourcePath,
    ext = CONTAINER_EXTENSION,
  ) {
    return this.path(location, repositoryId, `${containerId}.${ext}`);
  }

  private path(...segments: string[]): string {
    return path.join(...segments);
  }
}

export default StorageAPI;
