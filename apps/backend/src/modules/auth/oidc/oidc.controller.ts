import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as passport from 'passport';
import { AuthService } from '../user-auth/auth.service';
import { GoogleOAuthGuard } from '../common/guards/google-oauth.guard';
import { getOAuthErrorCode } from './utils/oauth-redirect.util';
import { Public } from '../common/decorators/public.decorator';
import type { User } from '@/database/entities';

@ApiTags('oidc')
@Controller('oidc')
export class OidcController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Initiate Google OAuth flow or logout',
    description: `
      Redirects to Google for authentication.
      Use ?action=logout to clear session.`,
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['logout'],
    description: 'Action: logout clears session',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth or logout page',
  })
  @ApiResponse({
    status: 404,
    description: 'Google OAuth is not enabled',
  })
  @Public()
  @Get()
  @UseGuards(GoogleOAuthGuard)
  @HttpCode(HttpStatus.FOUND)
  async handleOidc() {
    // GoogleOAuthGuard handles all logic:
    // - logout action check
    // - OAuth enabled check
    // - delegation to Passport's GoogleStrategy
    // This method body never executes - guard intercepts the request
  }

  /**
   * Google OAuth callback handler
   *
   * This endpoint handles the OAuth callback from Google and redirects users
   * to either the home page (success) or auth page with error (failure).
   *
   * Implementation Notes:
   * - Uses manual passport.authenticate() instead of @UseGuards to avoid
   *   conflicts with NestJS interceptors that try to format responses as JSON
   * - Uses passport.default because passport is a CommonJS module - when
   *   imported via ES modules (import * as passport), the actual Authenticator
   *   instance is in the .default property due to CommonJS/ES module interop
   * - All errors are caught and converted to user-friendly redirects
   * - Error codes are passed as query parameters to the frontend auth page
   *
   * Error Handling:
   * - Domain not authorized → /auth?error=domain_not_authorized
   * - Account deactivated → /auth?error=account_deactivated
   * - No email provided → /auth?error=no_email
   * - Token creation failed → /auth?error=token_creation_failed
   * - Other errors → /auth?error=oauth_failed
   */
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: `
      Handles Google OAuth callback.
      Validates user, issues JWT, and redirects to app.`,
  })
  @ApiResponse({
    status: 302,
    description: 'Sets auth cookie and redirects to home or error page',
  })
  @Public()
  @Get('callback')
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // Manually invoke passport authentication with custom callback
      // This approach prevents exceptions from reaching the exception filters
      await new Promise((resolve, reject) => {
        // Use passport.default because passport is a CommonJS module
        // When imported via ES modules, the actual instance is in .default
        passport.default.authenticate('google', (err: Error, user: User) => {
          if (err) return reject(err);
          if (!user) return reject(new Error('User not found'));
          req.user = user;
          resolve(user);
        })(req, res);
      });
      const user = req.user as User;
      const { accessToken, expiresInMs } =
        await this.authService.createAccessToken(user);
      this.authService.setAuthCookie(res, accessToken, expiresInMs);
      res.redirect('/');
    } catch (error) {
      const errorCode = getOAuthErrorCode(error as Error);
      res.redirect(`/auth?error=${errorCode}`);
    }
  }
}
