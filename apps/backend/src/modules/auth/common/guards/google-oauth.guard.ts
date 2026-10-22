import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../../user-auth/auth.service';
import { ConfigService } from '@nestjs/config';
import type { OAuthConfig } from '@/config';

/**
 * Google OAuth Guard
 *
 * Custom guard that handles Google OAuth/OIDC authentication flow.
 * Performs pre-checks before delegating to Passport's GoogleStrategy.
 *
 * Pre-checks:
 * 1. Logout action - clears auth cookie and redirects
 * 2. OAuth enabled - returns 404 if Google OAuth is disabled
 * 3. Delegates to GoogleStrategy for actual OAuth flow
 *
 * Used in: oidc.controller.ts for /oidc and /oidc/callback routes
 *
 * @example Flow - Google Sign-in
 * 1. User visits /oidc
 * 2. canActivate() runs
 *    - Check action=logout → no
 *    - Check Google OAuth enabled → yes ✅
 *    - Delegate to GoogleStrategy
 * 3. GoogleStrategy redirects to Google
 * 4. User authenticates with Google
 * 5. Google redirects to /oidc/callback?code=xxx
 * 6. canActivate() runs again
 *    - Check action=logout → no
 *    - Check Google OAuth enabled → yes ✅
 *    - Delegate to GoogleStrategy
 * 7. GoogleStrategy validates code, gets user profile
 * 8. GoogleStrategy.validate() runs
 *    - Find or create user
 *    - Return User entity
 * 9. req.user = User entity
 * 10. Controller handles successful login
 *
 * @example Flow - Logout
 * 1. User visits /oidc?action=logout
 * 2. canActivate() runs
 *    - Check action=logout → yes ✅
 *    - Clear auth cookie
 *    - Redirect to /auth
 *    - Return false (stop processing)
 *
 * @example Flow - OAuth Disabled
 * 1. User visits /oidc
 * 2. canActivate() runs
 *    - Check action=logout → no
 *    - Check Google OAuth enabled → no ❌
 *    - Return 404 response
 *    - Return false (stop processing)
 */
@Injectable()
export class GoogleOAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    if (request.query.action === 'logout') {
      this.authService.clearAuthCookie(response);
      response.redirect('/auth');
      return false;
    }
    const oauthConfig = this.configService.get<OAuthConfig>('oauth');
    if (!oauthConfig?.google?.enabled) {
      response.status(404).json({
        statusCode: 404,
        message: 'Google OAuth is not available',
        error: 'Not Found',
      });
      return false;
    }
    const googleAuthGuard = new (AuthGuard('google'))();
    return googleAuthGuard.canActivate(context) as Promise<boolean>;
  }
}
