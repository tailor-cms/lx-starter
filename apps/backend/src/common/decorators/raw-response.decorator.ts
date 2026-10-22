import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for marking routes that should return raw responses
 * without the standard API wrapper
 */
export const RAW_RESPONSE_KEY = 'raw_response';

/**
 * Decorator to bypass ResponseInterceptor and return raw response
 *
 * Use this decorator when an endpoint needs to return a response
 * that doesn't follow the standard API format, such as OAuth 2.0
 * token endpoints that must comply with RFC 6749.
 *
 * @example
 * ```typescript
 * @Post('oauth/token')
 * @RawResponse()
 * async token() {
 *   return {
 *     access_token: '...',
 *     token_type: 'Bearer',
 *     expires_in: 3600
 *   };
 * }
 * ```
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
