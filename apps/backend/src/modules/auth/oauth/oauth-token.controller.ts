import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthTokenResponseDto, TokenRequestDto } from './dto/oauth-token.dto';
import { extractOAuthCredentials } from './utils/extract-credentials.util';
import { OAuthClientService } from './oauth-client.service';
import { OAuthTokenService } from './oauth-token.service';
import { Public } from '../common/decorators/public.decorator';
import { RawResponse } from '@/common/decorators/raw-response.decorator';

@ApiTags('oauth')
@Controller('oauth')
export class OAuthTokenController {
  constructor(
    private readonly oauthClientService: OAuthClientService,
    private readonly oauthTokenService: OAuthTokenService,
  ) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @Public()
  @RawResponse()
  @ApiOperation({
    summary: 'OAuth 2.0 Token Endpoint (Client Credentials Flow)',
    description:
      'Supports both Basic Authentication (Authorization header) ' +
      'and request body credentials per RFC 6749 Section 2.3.1',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token generated successfully',
    type: OAuthTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (missing parameters or invalid grant type)',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid client credentials',
  })
  async token(
    @Body() body: TokenRequestDto,
    @Headers('authorization') authHeader?: string,
  ) {
    // Extract credentials from either Basic Auth header or request body
    const { clientId, clientSecret, scope } = extractOAuthCredentials(
      authHeader,
      body,
    );

    // Validate client credentials
    const client = await this.oauthClientService.validateCredentials(
      clientId,
      clientSecret,
    );
    if (!client) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    // Parse requested scopes (space-separated)
    const requestedScopes = scope
      ? scope.split(' ').filter(Boolean)
      : undefined;

    // Generate access token
    const tokenResponse = await this.oauthTokenService.generateAccessToken(
      client,
      requestedScopes,
    );

    // Track client usage
    await this.oauthClientService.trackUsage(client);
    return tokenResponse;
  }
}
