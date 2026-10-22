import type { CanActivate, ExecutionContext } from '@nestjs/common';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAUTH_SCOPES_KEY } from '../../common/decorators/enable-oauth.decorator';
import { OAUTH_ONLY_KEY } from '../../common/decorators/oauth-only.decorator';
import type { OAuthTokenPayload } from '../dto/oauth-token.dto';
import { Reflector } from '@nestjs/core';
import { ScopeValidator } from '../scopes';

/**
 * OAuth Scopes Guard
 *
 * Validates that OAuth client tokens have the required scopes specified
 * by the @EnableOAuth() decorator.
 *
 * **Default Behavior: User-only (OAuth must be explicitly enabled)**
 *
 * Behavior:
 * - If no @EnableOAuth() decorator present:
 *   - User authentication → pass ✅
 *   - OAuth authentication → **reject** ❌ (OAuth not enabled for this route)
 * - If @EnableOAuth() present but req.user is a User entity → pass (user auth)
 * - If @EnableOAuth() present and req.user is OAuthTokenPayload:
 *   - Empty scopes (@EnableOAuth()) → accept any OAuth token
 *   - With scopes (@EnableOAuth('read:users')) → validate scopes
 *
 * Scope validation uses ScopeValidator which supports:
 * - Exact matches: 'read:users' matches 'read:users'
 * - Wildcards: 'write:*' matches 'write:users', 'write:content', etc.
 * - Multiple scopes: All required scopes must be present in token
 *
 * This guard must be registered globally (APP_GUARD) to work properly.
 */
@Injectable()
export class OAuthScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      OAUTH_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isOAuthOnly = this.reflector.getAllAndOverride<boolean>(
      OAUTH_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest();
    // user can be either a User entity or an OAuthTokenPayload
    const user = request.user;
    const isOAuthToken = user?.aud === 'oauth:api';

    // ═══════════════════════════════════════════════════════════════════════
    // SCENARIO 1: OAuth Not Enabled (Default User-Only Routes)
    // Handles: @Get() or @Public() without @EnableOAuth()
    // ═══════════════════════════════════════════════════════════════════════
    // No @EnableOAuth() decorator → OAuth not enabled for this route
    // Note: @EnableOAuth() with no args sets requiredScopes to []
    // (empty array), not undefined
    if (requiredScopes === undefined || requiredScopes === null) {
      // Scenario 1a: Public route, no authentication
      if (!user) return true;
      // Scenario 1b: OAuth token on user-only route → REJECT
      // Check if this is an OAuth token by verifying the audience claim
      // OAuth tokens have aud: 'oauth:api', user tokens have different audience
      if (isOAuthToken) {
        throw new ForbiddenException(
          'OAuth authentication is not enabled for this endpoint',
        );
      }
      // Scenario 1c: User authentication on default route → ALLOW
      return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCENARIO 2: OAuth Enabled but No User
    // Handles: @EnableOAuth() endpoint accessed without authentication
    // ═══════════════════════════════════════════════════════════════════════
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCENARIO 3: OAuth-Only Enforcement
    // Handles: @OAuthOnly() - rejects user cookies, requires Bearer tokens
    // ═══════════════════════════════════════════════════════════════════════
    if (isOAuthOnly && !isOAuthToken) {
      throw new UnauthorizedException(
        'This endpoint requires OAuth authentication',
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCENARIO 4: Dual Authentication - User Allowed
    // Handles: @Roles() + @EnableOAuth() - user with cookie
    // ═══════════════════════════════════════════════════════════════════════
    if (!isOAuthToken && 'role' in user) {
      // This is a User entity, not an OAuth token
      // User authentication uses role-based access, not scopes
      // Pass this check - RolesGuard will handle authorization
      return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SCENARIO 5: OAuth Token Scope Validation
    // Handles: @EnableOAuth('read:users') or @OAuthOnly('webhook:publish')
    // ═══════════════════════════════════════════════════════════════════════
    const tokenScopes = (user as OAuthTokenPayload).scope;

    // Scenario 5a: No specific scopes required - accept any valid OAuth token
    if (requiredScopes.length === 0) {
      return true;
    }

    // Scenario 5b: Validate OAuth token has all required scopes
    if (!ScopeValidator.checkAll(requiredScopes, tokenScopes)) {
      throw new ForbiddenException(
        `Insufficient scopes. Required: ${requiredScopes.join(', ')}`,
      );
    }

    // Scenario 5c: All scopes validated - allow access
    return true;
  }
}
