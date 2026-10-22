import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { OAuthTokenPayload } from '../../oauth/dto/oauth-token.dto';

/**
 * Current OAuth Client Decorator
 *
 * Extracts the OAuth client token payload from the request.
 *
 * When an endpoint is accessed with an OAuth bearer token, the validated
 * OAuthTokenPayload is attached to req.user by the OAuthJwtStrategy.
 *
 * This decorator provides type-safe access to the OAuth client information.
 *
 * @example
 * @Get('/api/data')
 * @Public()
 * @EnableOAuth('read:data')
 * async getData(@CurrentOAuthClient() client: OAuthTokenPayload) {
 *   console.log(client.client_id);
 *   console.log(client.scope);
 *   console.log(client.owner_type);
 * }
 *
 * @returns OAuthTokenPayload containing client_id, scope, owner info, etc.
 */
export const CurrentOAuthClient = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): OAuthTokenPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as OAuthTokenPayload;
  },
);
