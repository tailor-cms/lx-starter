import type { LoadOptions, MakePublicOptions } from '../serializable';
import type { CatalogEntry } from './CatalogEntry';
import type { Repository } from '../repository';

/**
 * Predicate function for filtering catalog entries
 */
export type WherePredicate = (entry: CatalogEntry) => boolean;

/**
 * Object-style where clause for filtering catalog entries
 */
export type WhereClause =
  Partial<Pick<CatalogEntry, 'id' | 'uid' | 'schema' | 'name' | 'description'>>;

/**
 * Collection wrapper for CatalogEntry arrays with query methods
 * Provides convenient filtering and lookup methods
 */
export class CatalogCollection {
  private entries: CatalogEntry[];

  constructor(entries: CatalogEntry[]) {
    this.entries = entries;
  }

  /**
   * Get all entries in the collection
   */
  all(): CatalogEntry[] {
    return this.entries;
  }

  /**
   * Get the number of entries in the collection
   */
  count(): number {
    return this.entries.length;
  }

  /**
   * Find entry by ID (number) or UID (string)
   * Accepts either numeric ID or string UID
   *
   * @param idOrUid - Numeric entry ID or string UID
   * @returns CatalogEntry or undefined if not found
   *
   * @example
   * Find by numeric ID
   * const entry = catalog.find(123)
   *
   * @example
   * Find by string UID
   * const entry = catalog.find('repo_abc123')
   */
  find(idOrUid: number | string): CatalogEntry | undefined {
    if (typeof idOrUid === 'number') {
      return this.all().find((entry) => entry.id === idOrUid);
    }
    return this.all().find((entry) => entry.uid === idOrUid);
  }

  /**
   * Filter entries by schema
   * @param schema - Schema name to filter by
   * @returns New CatalogCollection with filtered entries
   */
  whereSchema(schema: string): CatalogCollection {
    return new CatalogCollection(
      this.entries.filter((entry) => entry.schema === schema),
    );
  }

  /**
   * Filter entries by custom predicate or object criteria
   * @param criteria - Object with properties to match, or function that
   *  returns true for entries to include
   * @returns New CatalogCollection with filtered entries
   *
   * @example
   * Object-style where
   * collection.where({ schema: 'course' })
   * collection.where({ schema: 'course', name: 'Introduction' })
   *
   * @example
   * Function-style where
   * collection.where(entry => entry.schema === 'course')
   *
   * @example
   * Find entries published after a date
   * collection.where(entry =>
   *   new Date(entry.publishedAt) > new Date('2024-01-01')
   * )
   *
   * @example
   * Chain multiple filters
   * collection
   *   .where({ schema: 'course' })
   *   .where(entry => entry.meta.level === 'advanced')
   */
  where(criteria: WhereClause | WherePredicate): CatalogCollection {
    if (typeof criteria === 'function') {
      return new CatalogCollection(this.entries.filter(criteria));
    }
    return new CatalogCollection(
      this.entries.filter((entry) => {
        return Object.entries(criteria).every(([key, value]) => {
          return entry[key as keyof CatalogEntry] === value;
        });
      }),
    );
  }

  /**
   * Search entries by name (case-insensitive partial match)
   * @param query - Search query (case-insensitive, matches partial names)
   * @returns New CatalogCollection with matching entries
   *
   * @example
   * Search for entries with "intro" in the name
   * collection.search('intro')
   * Matches: "Introduction to React", "Intro Course", etc.
   *
   * @example
   * Return all entries if query is empty or falsy
   * collection.search('')  // Returns all entries
   * collection.search('  ')  // Returns all entries (trimmed)
   *
   * @example
   * Chain with other filters
   * collection
   *   .where({ schema: 'course' })
   *   .search('advanced')
   */
  search(query: string): CatalogCollection {
    // Return all entries if query is empty/falsy after trimming
    const processedQuery = query?.trim();
    if (!processedQuery) {
      return new CatalogCollection(this.entries);
    }
    const normalizedQuery = processedQuery.toLowerCase();
    return new CatalogCollection(
      this.entries.filter((entry) =>
        entry.name?.toLowerCase().includes(normalizedQuery),
      ),
    );
  }

  /**
   * Get the first entry in the collection
   */
  first(): CatalogEntry | undefined {
    return this.entries[0];
  }

  /**
   * Get the last entry in the collection
   */
  last(): CatalogEntry | undefined {
    return this.entries[this.entries.length - 1];
  }

  /**
   * Map over entries and return array of results
   * @param fn - Function to apply to each entry
   */
  map<T>(fn: (entry: CatalogEntry) => T): T[] {
    return this.entries.map(fn);
  }

  /**
   * Check if collection is empty
   */
  isEmpty(): boolean {
    return this.entries.length === 0;
  }

  /**
   * Sort entries by a key
   * @param key - Property to sort by
   * @param order - Sort order (asc or desc)
   */
  sortBy(
    key: keyof CatalogEntry,
    order: 'asc' | 'desc' = 'asc',
  ): CatalogCollection {
    const sorted = [...this.entries].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal == null && bVal == null)
        return 0;
      if (aVal == null)
        return 1;
      if (bVal == null)
        return -1;

      if (aVal < bVal)
        return order === 'asc' ? -1 : 1;
      if (aVal > bVal)
        return order === 'asc' ? 1 : -1;
      return 0;
    });

    return new CatalogCollection(sorted);
  }

  /**
   * Load all repositories for catalog entries
   * @param options - Load options (force reload, deep load, etc.)
   * @returns Promise resolving to array of loaded Repositories
   *
   * @example
   * Load all repositories with nested content (deep load by default)
   * const catalog = await garment.source().list()
   * const repositories = await catalog.load()
   *
   * @example
   * Load only repository metadata without nested content
   * const repositories = await catalog.load({ deep: false })
   */
  async load(options?: LoadOptions): Promise<Repository[]> {
    return Promise.all(
      this.entries.map((entry) => entry.load(options)),
    );
  }

  /**
   * Make all catalog entries publicly accessible by signing URLs
   * @param interval - Signature validity interval in seconds (optional)
   * @param options - Options including force re-signing
   * @returns Promise resolving to array of catalog entries
   *
   * @example
   * Sign all entries in catalog
   * const catalog = await garment.source().list()
   * await catalog.makePublic()
   *
   * @example
   * Force re-sign all entries
   * await catalog.makePublic(3600, { force: true })
   */
  async makePublic(
    interval?: number,
    options?: MakePublicOptions,
  ): Promise<CatalogEntry[]> {
    return Promise.all(
      this.entries.map((entry) => entry.makePublic(interval, options)),
    );
  }
}
