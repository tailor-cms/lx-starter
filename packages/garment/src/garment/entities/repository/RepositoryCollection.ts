import type { Repository } from './Repository';

/**
 * Collection wrapper for Repository arrays with query methods
 * Provides convenient filtering and lookup methods
 * Returned by TailorContent.all() to enable chaining patterns
 *
 * @example
 * const repos = content.all()
 * const repo = repos.find(123)
 */
export class RepositoryCollection {
  private repositories: Repository[];

  constructor(repositories: Repository[]) {
    this.repositories = repositories;
  }

  /**
   * Get the number of repositories in the collection
   */
  count(): number {
    return this.repositories.length;
  }

  /**
   * Find repository by ID (number) or UID (string)
   * Accepts either numeric ID or string UID
   *
   * @param idOrUid - Numeric repository ID or string UID
   * @returns Repository or undefined if not found
   *
   * @example
   * Find by numeric ID
   * const repo = content.all().find(123)
   *
   * @example
   * Find by string UID
   * const repo = content.all().find('repo_abc123')
   */
  find(idOrUid: number | string): Repository | undefined {
    if (typeof idOrUid === 'number') {
      return this.repositories.find((r) => r.id === idOrUid);
    }
    return this.repositories.find((r) => r.uid === idOrUid);
  }

  /**
   * Filter repositories by custom predicate
   * @param predicate - Function that returns true for repositories to include
   * @returns New RepositoryCollection with filtered repositories
   *
   * @example
   * const courses = content.all().where(repo => repo.schema === 'course')
   */
  where(predicate: (repo: Repository) => boolean): RepositoryCollection {
    return new RepositoryCollection(this.repositories.filter(predicate));
  }

  /**
   * Map over repositories and return array of results
   * @param fn - Function to apply to each repository
   */
  map<T>(fn: (repo: Repository) => T): T[] {
    return this.repositories.map(fn);
  }

  /**
   * Get the first repository in the collection
   */
  first(): Repository | undefined {
    return this.repositories[0];
  }

  /**
   * Get the last repository in the collection
   */
  last(): Repository | undefined {
    return this.repositories[this.repositories.length - 1];
  }

  /**
   * Check if collection is empty
   */
  isEmpty(): boolean {
    return this.repositories.length === 0;
  }

  /**
   * Get the maximum publishedAt date across all repositories
   * @returns Max publishedAt date or undefined if no repositories have it set
   *
   * @example
   * const maxDate = content.all().getMaxPublishedAt()
   */
  getMaxPublishedAt(): Date | undefined {
    return this.repositories.reduce<Date | undefined>((max, repo) => {
      if (!repo.publishedAt) return max;
      const repoDate = new Date(repo.publishedAt);
      if (!max || repoDate > max) return repoDate;
      return max;
    }, undefined);
  }

  /**
   * Iterate over repositories
   */
  forEach(fn: (repo: Repository, index: number) => void): void {
    this.repositories.forEach(fn);
  }

  /**
   * Enable iteration with for...of
   */
  [Symbol.iterator](): Iterator<Repository> {
    return this.repositories[Symbol.iterator]();
  }
}
