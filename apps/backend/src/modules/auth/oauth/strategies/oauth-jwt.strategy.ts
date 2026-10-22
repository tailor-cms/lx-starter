import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthConfig } from '@/config';
import { ConfigService } from '@nestjs/config';
import { OAuthClientService } from '../oauth-client.service';
import type { OAuthTokenPayload } from '../dto/oauth-token.dto';
import { PassportStrategy } from '@nestjs/passport';

/**
 * OAuth 2.0 JWT Strategy
 *
 * Validates OAuth access tokens issued via Client Credentials flow.
 * Used for machine-to-machine API authentication.
 *
 * Token validation checks:
 * - Valid JWT signature
 * - Not expired
 * - Correct audience (oauth:api) - handled by Passport
 * - Correct issuer - handled by Passport
 * - Client still exists and is active
 *
 * The validated token payload is attached to the request as `req.user`.
 */
@Injectable()
export class OAuthJwtStrategy extends PassportStrategy(Strategy, 'oauth-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly clientService: OAuthClientService,
  ) {
    const authConfig = configService.get<AuthConfig>('auth');
    if (!authConfig?.jwt.secret) {
      throw new Error('JWT secret is not configured');
    }
    // Only accept tokens with 'oauth:api' audience
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: authConfig.jwt.secret,
      audience: 'oauth:api',
      issuer: authConfig.jwt.issuer,
      ignoreExpiration: false,
    });
  }

  async validate(payload: OAuthTokenPayload): Promise<OAuthTokenPayload> {
    // Verify client still exists and is active
    const client = await this.clientService.findOne(payload.sub);
    if (!client.canAuthenticate) {
      throw new UnauthorizedException(
        'OAuth client is inactive, expired, or deleted',
      );
    }
    // Return payload - will be attached to request as req.user
    return payload;
  }
}
