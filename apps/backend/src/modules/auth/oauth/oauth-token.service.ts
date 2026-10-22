import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthConfig } from '@/config';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuthClient } from './entities/oauth-client.entity';
import type { OAuthClientConfig } from '@/config/oauth-client.config';
import type { OAuthTokenPayload } from './dto/oauth-token.dto';
import { OAuthTokenResponseDto } from './dto/oauth-token.dto';
import { PinoLogger } from 'nestjs-pino';
import { ScopeValidator } from './scopes';

@Injectable()
export class OAuthTokenService {
  private authConfig: AuthConfig;
  private oauthConfig: OAuthClientConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.authConfig = configService.get('auth') as AuthConfig;
    this.oauthConfig = configService.get('oauthClient') as OAuthClientConfig;
    this.logger.setContext(OAuthTokenService.name);
  }

  /**
   * Generate OAuth access token for client credentials flow
   */
  async generateAccessToken(
    client: OAuthClient,
    requestedScopes?: string[],
  ): Promise<OAuthTokenResponseDto> {
    this.logger.debug(`Generating access token for client: ${client.clientId}`);
    const grantedScopes = this.validateAndFilterScopes(
      requestedScopes,
      client.allowedScopes,
    );
    // Generate JWT ID for revocation tracking
    const jti = this.generateJti();
    const ownerType = 'INTEGRATION';
    const ownerId = client.ownerIntegration.id;
    const payload: Partial<OAuthTokenPayload> = {
      sub: client.id,
      client_id: client.clientId,
      owner_type: ownerType,
      owner_id: ownerId,
      scope: grantedScopes,
      jti,
    };
    const expiresInMs = this.oauthConfig.token.accessTokenExpiresIn;
    const expiresIn = Math.floor(expiresInMs / 1000); // seconds
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.authConfig.jwt.secret,
      expiresIn,
      audience: 'oauth:api',
      issuer: this.authConfig.jwt.issuer,
    });
    this.logger.debug(
      `Access token generated for client: ${client.clientId},
      scopes: ${grantedScopes.join(', ')}`,
    );
    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      scope: grantedScopes.join(' '),
    };
  }

  /**
   * Validate requested scopes against allowed scopes
   */
  private validateAndFilterScopes(
    requestedScopes: string[] | undefined,
    allowedScopes: string[],
  ): string[] {
    if (!requestedScopes || requestedScopes.length === 0) {
      // No scopes requested, grant all allowed scopes
      return allowedScopes;
    }
    // Check each requested scope
    const grantedScopes: string[] = [];
    for (const scope of requestedScopes) {
      if (!ScopeValidator.isValidScope(scope)) {
        throw new BadRequestException(`Invalid scope: ${scope}`);
      }
      // Check if client is allowed to request this scope
      if (!ScopeValidator.matches(scope, allowedScopes)) {
        throw new ForbiddenException(
          `Client is not authorized for scope: ${scope}`,
        );
      }
      grantedScopes.push(scope);
    }
    return grantedScopes;
  }

  /**
   * Generate JWT ID for revocation tracking
   */
  private generateJti(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
