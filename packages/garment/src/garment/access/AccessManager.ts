import type {
  RepositoryAccessGroup,
  RepositoryAccessGroupMember,
  RepositoryAccessUser,
} from '../interfaces';
import { Repository } from '../entities/repository/Repository';

// Type aliases for enriched data structures
type EnrichedUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  repositories: Repository[];
  accessDetails: Map<number, Array<{ groupId?: number; role: string }>>;
};

type EnrichedGroup = RepositoryAccessGroup & {
  repositories: Repository[];
};

/**
 * Manages access control aggregation across repositories
 * Provides utility methods for querying users, groups, and permissions
 */
export class AccessManager {
  private repositories: Repository[];
  private _allUsers?: Map<number, EnrichedUser>;
  private _allGroups?: Map<number, EnrichedGroup>;

  constructor(repositories: Repository[]) {
    this.repositories = repositories;
  }

  /**
   * Load access data for all repositories
   */
  async loadAll(): Promise<void> {
    await Promise.all(
      this.repositories.map(async (it) => {
        if (!it.access) {
          it.access = await Repository.api.getRepositoryAccess(it.id);
        }
      }),
    );
    this._buildIndices();
  }

  /**
   * Reload access data
   */
  async reloadAll(): Promise<void> {
    this._clearIndices();
    await Promise.all(this.repositories.map((it) => it.reloadAccess()));
    this._buildIndices();
  }

  /**
   * Get all unique groups across repositories
   */
  getGroups(): EnrichedGroup[] {
    this._ensureIndices();
    return Array.from(this._allGroups!.values());
  }

  /**
   * Get all users, optionally filtered by group
   * @param groupId - Optional group id to filter by
   */
  getUsers(groupId?: number): EnrichedUser[] {
    this._ensureIndices();
    const users = Array.from(this._allUsers!.values());
    return groupId === undefined
      ? users
      : users.filter((user) => this._userHasGroupAccess(user, groupId));
  }

  /**
   * Check if a user has any repository access via a specific group
   */
  private _userHasGroupAccess(user: EnrichedUser, groupId: number): boolean {
    for (const grants of user.accessDetails.values()) {
      if (grants.some((grant) => grant.groupId === groupId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a user has access to a repository
   * @param userId - User ID to check
   * @param repositoryId - Repository ID to check access for
   * @param groupId - Optional group ID to check group-specific access
   */
  hasRepositoryAccess(
    userId: number,
    repositoryId: number,
    groupId?: number,
  ): boolean {
    // If groupId is specified, check for that specific grant
    if (groupId !== undefined) {
      return this.getUserRole(userId, repositoryId, groupId) !== undefined;
    }
    // Otherwise, check if there are any access grants
    return this.getUserRoles(userId, repositoryId).length > 0;
  }

  /**
   * Get repositories a user has access to
   * @param userId - User id
   */
  getUserRepositories(userId: number): Repository[] {
    return this.getUser(userId)?.repositories || [];
  }

  /**
   * Get repositories a group has access to
   * @param groupId - Group id
   */
  getGroupRepositories(groupId: number): Repository[] {
    return this.getGroup(groupId)?.repositories || [];
  }

  /**
   * Get user details with their accessible repositories
   * @param userId - User ID
   */
  getUser(userId: number): EnrichedUser | undefined {
    this._ensureIndices();
    return this._allUsers!.get(userId);
  }

  /**
   * Get group details with accessible repositories
   * @param groupId - Group ID
   */
  getGroup(groupId: number): EnrichedGroup | undefined {
    this._ensureIndices();
    return this._allGroups!.get(groupId);
  }

  /**
   * Get all roles a user has for a specific repository
   * @param userId - User ID
   * @param repositoryId - Repository ID
   */
  getUserRoles(
    userId: number,
    repositoryId: number,
  ): Array<{ groupId?: number; role: string }> {
    return this.getUser(userId)?.accessDetails.get(repositoryId) || [];
  }

  /**
   * Get user's role for a specific repository access grant
   * @param userId - User ID
   * @param repositoryId - Repository ID
   * @param groupId - Group ID for group-specific role, or undefined for direct access
   */
  getUserRole(
    userId: number,
    repositoryId: number,
    groupId: number | undefined,
  ): string | undefined {
    const grants = this.getUserRoles(userId, repositoryId);
    return grants.find((g) => g.groupId === groupId)?.role;
  }

  /**
   * Ensure indices are built before access
   */
  private _ensureIndices(): void {
    if (!this._allUsers || !this._allGroups) {
      this._buildIndices();
    }
  }

  /**
   * Build indices for fast lookups
   */
  private _buildIndices(): void {
    this._allUsers = new Map();
    this._allGroups = new Map();

    for (const repository of this.repositories) {
      if (!repository.access) continue;
      this._indexRepositoryUsers(repository);
      this._indexRepositoryGroups(repository);
    }
  }

  /**
   * Index users with direct repository access
   */
  private _indexRepositoryUsers(repository: Repository): void {
    for (const user of repository.access!.users) {
      const existing = this._allUsers!.get(user.id);
      if (existing) {
        this._addDirectAccess(existing, repository, user);
      } else {
        this._createUserWithDirectAccess(user, repository);
      }
    }
  }

  /**
   * Index groups and their members
   */
  private _indexRepositoryGroups(repository: Repository): void {
    for (const group of repository.access!.groups) {
      // Index the group
      const existing = this._allGroups!.get(group.id);
      if (existing) {
        existing.repositories.push(repository);
      } else {
        this._allGroups!.set(group.id, {
          ...group,
          repositories: [repository],
        });
      }

      // Index group members
      for (const member of group.members) {
        this._indexGroupMember(member, group.id, repository);
      }
    }
  }

  /**
   * Index a group member
   */
  private _indexGroupMember(
    member: RepositoryAccessGroupMember,
    groupId: number,
    repository: Repository,
  ): void {
    const existing = this._allUsers!.get(member.id);
    if (existing) {
      // User already exists - add group access
      if (!existing.repositories.some((r) => r.id === repository.id)) {
        existing.repositories.push(repository);
      }
      this._addOrUpdateGrant(existing.accessDetails, repository.id, {
        groupId,
        role: member.role,
      });
    } else {
      // Create new user with group access only
      const accessDetails = new Map<
        number,
        Array<{ groupId?: number; role: string }>
      >();
      accessDetails.set(repository.id, [{ groupId, role: member.role }]);
      this._allUsers!.set(member.id, {
        id: member.id,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        repositories: [repository],
        accessDetails,
      });
    }
  }

  /**
   * Add direct repository access to existing user
   */
  private _addDirectAccess(
    existing: EnrichedUser,
    repository: Repository,
    user: RepositoryAccessUser,
  ): void {
    if (!existing.repositories.some((r) => r.id === repository.id)) {
      existing.repositories.push(repository);
    }
    this._addOrUpdateGrant(existing.accessDetails, repository.id, {
      groupId: undefined,
      role: user.role,
    });
  }

  /**
   * Add or update an access grant for a repository
   */
  private _addOrUpdateGrant(
    accessDetails: Map<number, Array<{ groupId?: number; role: string }>>,
    repositoryId: number,
    newGrant: { groupId?: number; role: string },
  ): void {
    const grants = accessDetails.get(repositoryId);

    if (!grants) {
      accessDetails.set(repositoryId, [newGrant]);
      return;
    }

    const existingIndex = grants.findIndex(
      (g) => g.groupId === newGrant.groupId,
    );

    if (existingIndex < 0) {
      grants.push(newGrant);
    } else {
      grants[existingIndex] = newGrant;
    }
  }

  /**
   * Create new user with direct repository access
   */
  private _createUserWithDirectAccess(
    user: RepositoryAccessUser,
    repository: Repository,
  ): void {
    const accessDetails = new Map<
      number,
      Array<{ groupId?: number; role: string }>
    >();
    accessDetails.set(repository.id, [
      { groupId: undefined, role: user.role },
    ]);

    this._allUsers!.set(user.id, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      repositories: [repository],
      accessDetails,
    });
  }

  /**
   * Rebuild indices from existing repo.access data (no S3 calls)
   * Call this after updating repo.access in-memory (e.g., from webhook)
   *
   * @example
   * // After webhook updates repo.access
   * repository.access = newAccessData;
   * accessManager.rebuild();
   */
  rebuild(): void {
    this._clearIndices();
    this._buildIndices();
  }

  /**
   * Clear cached indices
   */
  private _clearIndices(): void {
    this._allUsers = undefined;
    this._allGroups = undefined;
  }
}
