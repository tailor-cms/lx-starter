import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { OAuthConfig } from '@/config';
import { OAuthService } from '../../oauth/oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const oauthConfig = configService.get<OAuthConfig>('oauth');
    const googleConfig = oauthConfig?.google;
    // Always initialize with valid config
    // Use safe defaults if not configured (strategy won't be used anyway)
    super({
      clientID: googleConfig?.clientId || 'not-configured',
      clientSecret: googleConfig?.clientSecret || 'not-configured',
      callbackURL: googleConfig?.callbackUrl,
      scope: ['email', 'profile', 'openid'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    // Runtime check if Google OAuth is enabled
    const oauthConfig = this.configService.get<OAuthConfig>('oauth');
    if (!oauthConfig?.google?.enabled) {
      return done(new Error('Google OAuth is not enabled'), false);
    }
    // Validate credentials are properly configured
    if (
      !oauthConfig.google.clientId ||
      !oauthConfig.google.clientSecret ||
      oauthConfig.google.clientId === 'not-configured'
    ) {
      return done(new Error('Google OAuth is not configured'), false);
    }
    try {
      // Parse Google profile to our format
      const googleProfile = this.oauthService.parseGoogleProfile(profile);
      const user = await this.oauthService.findOrCreateUser(googleProfile);
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
