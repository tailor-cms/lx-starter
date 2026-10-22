import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOWED_ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '@/database/entities';

/**
 * Roles Guard
 *
 * Role-based access control for User authentication.
 *
 * - If no @Roles() decorator: pass (no role required)
 * - If OAuth token (aud: 'oauth:api'): pass (uses OAuthScopesGuard)
 * - If User token: check if user has required role
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ALLOWED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!allowedRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    // Check if this is an OAuth token by verifying the audience claim
    // OAuth tokens have aud: 'oauth:api', user tokens have different audience
    const isOAuthToken = user.aud === 'oauth:api';
    if (isOAuthToken) {
      // OAuth authentication - pass through
      // (OAuthScopesGuard handles authorization)
      return true;
    }
    // User authentication - check role
    return allowedRoles.some((role) => user.role === role);
  }
}
