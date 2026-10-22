import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for OAuth scopes
 */
export const OAUTH_SCOPES_KEY = 'oauth:scopes';

/**
 * Enable OAuth Decorator
 *
 * Marks an endpoint as accessible via OAuth client authentication
 * and specifies required scopes.
 *
 * When used alone, the endpoint accepts BOTH user tokens AND OAuth tokens:
 * @EnableOAuth('read:users')
 * → User with appropriate role OR OAuth client with 'read:users' scope
 *
 * When combined with @Public(), the endpoint accepts ONLY OAuth tokens:
 * @Public()
 * @EnableOAuth('read:users')
 * → Only OAuth clients with 'read:users' scope
 *
 * Scope validation is handled by OAuthScopesGuard (must be registered globally).
 *
 * @param scopes - Required OAuth scopes (e.g., 'read:users', 'write:content')
 *
 * @example
 * Dual authentication: User OR OAuth
 * @Get('/api/users')
 * @Roles(UserRole.ADMIN)
 * @EnableOAuth('read:users')
 * async getUsers(@CurrentUser() userOrClient: User | OAuthTokenPayload) { }
 *
 * @example
 * OAuth-only authentication
 * @Get('/api/users')
 * @Public()
 * @EnableOAuth('read:users')
 * async getUsers(@CurrentUser() client: OAuthTokenPayload) { }
 */
export const EnableOAuth = (...scopes: string[]) =>
  SetMetadata(OAUTH_SCOPES_KEY, scopes);
