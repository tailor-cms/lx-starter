import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_FLAG_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';

/**
 * Authentication Guard
 *
 * Global authentication guard that tries multiple authentication strategies:
 * 1. JWT strategy - for user authentication (cookies only)
 * 2. OAuth JWT strategy - for OAuth client authentication
 *    (Bearer header only, aud: oauth:api)
 *
 * Routes can opt-out using @Public() decorator.
 *
 * Both strategies validate tokens and attach results to req.user:
 * - JWT strategy → req.user = User entity
 * - OAuth JWT strategy → req.user = OAuthTokenPayload
 *
 * Use type guards or JWT audience claim (user.aud) to distinguish between them.
 *
 * @example Flow - User with Cookie
 * 1. canActivate() → check @Public() → no → call super.canActivate()
 * 2. Passport → JwtStrategy.validate()
 *    - Extract from cookie ✅
 *    - Validate user token ✅
 *    - Return User entity
 * 3. handleRequest(null, User)
 *    - User exists ✅
 *    - Return User
 * 4. req.user = User entity
 * 5. Continue to RolesGuard...
 *
 * @example Flow - OAuth Client with Bearer
 * 1. canActivate() → check @Public() → no → call super.canActivate()
 * 2. Passport tries JwtStrategy.validate()
 *    - Extract from cookie ❌ (no cookie)
 *    - Fails
 * 3. Passport tries OAuthJwtStrategy.validate()
 *    - Extract from Bearer header ✅
 *    - Validate OAuth token ✅
 *    - Return OAuthTokenPayload
 * 4. handleRequest(null, OAuthTokenPayload)
 *    - User exists ✅
 *    - Return OAuthTokenPayload
 * 5. req.user = OAuthTokenPayload
 * 6. Continue to OAuthScopesGuard...
 *
 * @example Flow - Public Route (no auth)
 * 1. canActivate() → check @Public() → yes → no Authorization header → return true
 * 2. handleRequest() never called
 * 3. req.user = undefined
 * 4. Continue to controller...
 *
 * @example Flow - Public Route with Bearer Token (@OAuthOnly pattern)
 * 1. canActivate() → check @Public() → yes → Authorization header present →
 *    call super.canActivate()
 * 2. Passport → OAuthJwtStrategy.validate()
 *    - Extract from Bearer header ✅
 *    - Validate OAuth token ✅
 *    - Return OAuthTokenPayload
 * 3. handleRequest(null, OAuthTokenPayload)
 *    - User exists ✅
 *    - Return OAuthTokenPayload
 * 4. req.user = OAuthTokenPayload
 * 5. Continue to OAuthScopesGuard (enforces OAuth-only + scopes)...
 */
@Injectable()
export class AuthenticationGuard extends AuthGuard(['jwt', 'oauth-jwt']) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );
    // For public routes, still attempt authentication if Authorization header
    // is present. This allows @OAuthOnly() to work - it sets public flag but
    // still validates Bearer tokens
    if (isPublic) {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      // Only authenticate if it's a Bearer token (not Basic Auth)
      // Basic Auth is used for OAuth token endpoint to GET tokens, not for authentication
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        return super.canActivate(context);
      }
      // No Bearer token on public route - allow through
      return true;
    }
    // Not public - require authentication
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}
