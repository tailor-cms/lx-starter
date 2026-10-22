export enum ScopeResource {
  USERS = 'users',
  CONTENT = 'content',
  WEBHOOK = 'webhook',
}

export enum ScopeAction {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  PUBLISH = 'publish',
  ACCESS = 'access',
  ADMIN = 'admin',
}

export interface ScopeDefinition {
  description: string;
  requiresAdmin: boolean;
}

export const SCOPE_DEFINITIONS: Record<string, ScopeDefinition> = {
  // Users
  'read:users': {
    description: 'Read user information',
    requiresAdmin: true,
  },
  'write:users': {
    description: 'Create and update users',
    requiresAdmin: true,
  },
  'delete:users': {
    description: 'Delete users',
    requiresAdmin: true,
  },
  // Content
  'read:content': {
    description: 'Read content repositories and nodes',
    requiresAdmin: false,
  },
  // Webhooks
  'webhook:publish': {
    description: 'Receive content publish webhook notifications',
    requiresAdmin: false,
  },
  'webhook:access': {
    description: 'Receive access rights update webhook notifications',
    requiresAdmin: false,
  },
  // Wildcard
  'admin:*': {
    description: 'Full administrative access',
    requiresAdmin: true,
  },
};

export class ScopeValidator {
  static getAvailableScopes(): string[] {
    return Object.keys(SCOPE_DEFINITIONS);
  }

  static getScopeDefinition(scope: string): ScopeDefinition | undefined {
    return SCOPE_DEFINITIONS[scope];
  }

  static isValidScope(scope: string): boolean {
    return scope in SCOPE_DEFINITIONS;
  }

  static matches(required: string, available: string[]): boolean {
    // Check for exact match
    if (available.includes(required)) {
      return true;
    }
    // Check for admin wildcard
    if (available.includes('admin:*')) {
      return true;
    }
    // Check for resource wildcard (e.g., write:* matches write:users)
    const [action, _resource] = required.split(':');
    if (available.includes(`${action}:*`)) {
      return true;
    }
    return false;
  }

  static checkAll(requiredScopes: string[], grantedScopes: string[]): boolean {
    return requiredScopes.every((required) =>
      this.matches(required, grantedScopes),
    );
  }

  static filterValid(scopes: string[]): string[] {
    return scopes.filter((scope) => this.isValidScope(scope));
  }

  static getInvalidScopes(scopes: string[]): string[] {
    return scopes.filter((scope) => !this.isValidScope(scope));
  }

  static getAdminOnlyScopes(scopes: string[]): string[] {
    return scopes.filter((scope) => {
      const definition = this.getScopeDefinition(scope);
      return definition?.requiresAdmin === true;
    });
  }
}
