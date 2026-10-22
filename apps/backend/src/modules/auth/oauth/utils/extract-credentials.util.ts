import { BadRequestException } from '@nestjs/common';

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  scope?: string;
}

/**
 * Extract OAuth client credentials from HTTP request
 *
 * Per RFC 6749 Section 2.3.1, clients can authenticate via:
 * 1. HTTP Basic Authentication (Authorization: Basic base64(client_id:client_secret))
 * 2. Request body parameters (client_id and client_secret)
 *
 * This utility supports both methods, prioritizing Basic Auth if present.
 *
 * @param authHeader - Authorization header value (optional)
 * @param body - Request body containing client_id, client_secret, and scope (optional)
 * @returns Extracted credentials
 * @throws BadRequestException if credentials are missing or malformed
 *
 * @example Basic Auth
 * const creds = extractOAuthCredentials(
 *   'Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=',
 *   { grant_type: 'client_credentials' }
 * );
 *
 * @example Request Body
 * const creds = extractOAuthCredentials(
 *   undefined,
 *   { grant_type: 'client_credentials', client_id: 'xxx', client_secret: 'yyy' }
 * );
 */
export function extractOAuthCredentials(
  authHeader: string | undefined,
  body: { client_id?: string; client_secret?: string; scope?: string },
): OAuthCredentials {
  let clientId: string | undefined;
  let clientSecret: string | undefined;
  const scope = body.scope;

  // Method 1: Extract from Basic Auth header (preferred by OAuth 2.0 spec)
  if (authHeader && authHeader.toLowerCase().startsWith('basic ')) {
    const base64Credentials = authHeader.slice(6);
    let credentials: string;

    try {
      credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    } catch {
      throw new BadRequestException(
        'Invalid Authorization header: unable to decode base64',
      );
    }

    const separatorIndex = credentials.indexOf(':');
    if (separatorIndex === -1) {
      throw new BadRequestException(
        'Invalid Authorization header format. ' +
          'Expected "Basic base64(client_id:client_secret)"',
      );
    }

    clientId = credentials.substring(0, separatorIndex);
    clientSecret = credentials.substring(separatorIndex + 1);
  } else {
    // Method 2: Extract from request body
    clientId = body.client_id;
    clientSecret = body.client_secret;
  }

  // Validate that credentials were provided
  if (!clientId || !clientSecret) {
    throw new BadRequestException(
      'Client credentials must be provided either in Authorization header ' +
        '(Basic Auth) or request body (client_id and client_secret)',
    );
  }

  return {
    clientId,
    clientSecret,
    scope,
  };
}
