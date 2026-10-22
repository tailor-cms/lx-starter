import { applyDecorators, SetMetadata } from '@nestjs/common';
import { OAUTH_SCOPES_KEY } from './enable-oauth.decorator';
import { IS_PUBLIC_FLAG_KEY } from './public.decorator';

/**
 * Marks an endpoint as OAuth-only
 *
 * When this decorator is present:
 * - Bypasses default authentication (acts like @Public())
 * - User authentication (cookies) is rejected
 * - Only OAuth Bearer tokens are accepted
 * - Can specify required scopes
 *
 * @param scopes - OAuth scopes required for this endpoint
 *
 * @example
 * ```typescript
 * // OAuth-only with specific scopes
 * @Post('webhook')
 * @OAuthOnly('webhook:publish')
 * handleWebhook() { }
 *
 * // OAuth-only with any valid token
 * @Post('webhook')
 * @OAuthOnly()
 * handleWebhook() { }
 * ```
 */
export const OAUTH_ONLY_KEY = 'isOAuthOnly';
export const OAuthOnly = (...scopes: string[]) =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_FLAG_KEY, true), // Bypass default auth (allows Bearer tokens)
    SetMetadata(OAUTH_ONLY_KEY, true), // Mark as OAuth-only
    SetMetadata(OAUTH_SCOPES_KEY, scopes), // Set required scopes
  );
