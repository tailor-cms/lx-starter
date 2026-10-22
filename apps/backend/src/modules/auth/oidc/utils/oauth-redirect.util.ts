import type { Response } from 'express';

/**
 * OAuth error codes for redirect query parameters
 */
export enum OAuthErrorCode {
  DOMAIN_NOT_AUTHORIZED = 'domain_not_authorized',
  ACCOUNT_DEACTIVATED = 'account_deactivated',
  NO_EMAIL = 'no_email',
  AUTHENTICATION_FAILED = 'authentication_failed',
  TOKEN_CREATION_FAILED = 'token_creation_failed',
  OAUTH_FAILED = 'oauth_failed',
}

/**
 * Redirects to the authentication page with an error code
 */
export function redirectToAuthError(
  res: Response,
  errorCode: OAuthErrorCode,
): void {
  res.redirect(`/auth?error=${errorCode}`);
}

/**
 * Redirects to the home page after successful authentication
 */
export function redirectToHome(res: Response): void {
  res.redirect('/');
}

/**
 * Determines the appropriate OAuth error code from an error
 */
export function getOAuthErrorCode(error: Error): OAuthErrorCode {
  const message = error.message?.toLowerCase() || '';
  if (message.includes('not authorized')) {
    return OAuthErrorCode.DOMAIN_NOT_AUTHORIZED;
  }
  if (message.includes('deactivated')) {
    return OAuthErrorCode.ACCOUNT_DEACTIVATED;
  }
  if (message.includes('email not provided')) {
    return OAuthErrorCode.NO_EMAIL;
  }
  return OAuthErrorCode.TOKEN_CREATION_FAILED;
}
