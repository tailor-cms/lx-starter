import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';
import yn from 'yn';

const env = process.env;

export const googleOAuthValidationSchema = {
  GOOGLE_OAUTH_ENABLED: Joi.boolean().default(false),
  GOOGLE_CLIENT_ID: Joi.string().when('GOOGLE_OAUTH_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  GOOGLE_CLIENT_SECRET: Joi.string().when('GOOGLE_OAUTH_ENABLED', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
  GOOGLE_CALLBACK_URL: Joi.string().default(
    'http://localhost:3000/api/oidc/callback',
  ),
  GOOGLE_ALLOWED_DOMAINS: Joi.string().optional().allow(''),
  NUXT_PUBLIC_OIDC_ENABLED: Joi.boolean().default(false),
  NUXT_PUBLIC_OIDC_LOGIN_TEXT: Joi.string().default('Sign in with Google'),
  NUXT_PUBLIC_OIDC_LOGOUT_ENABLED: Joi.boolean().default(false),
};

export interface GoogleOAuthConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  allowedDomains: string[];
}

export interface OidcFrontendConfig {
  enabled: boolean;
  loginText: string;
  logoutEnabled: boolean;
}

export interface OAuthConfig {
  google: GoogleOAuthConfig;
  frontend: OidcFrontendConfig;
}

export default registerAs('oauth', () => {
  // Parse allowed domains from comma-separated string
  const allowedDomainsStr = env.GOOGLE_ALLOWED_DOMAINS || '';
  const allowedDomains = allowedDomainsStr
    ? allowedDomainsStr.split(',').map((d) => d.trim().toLowerCase())
    : [];
  return {
    google: {
      enabled: yn(env.GOOGLE_OAUTH_ENABLED, { default: false }),
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl:
        env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/oidc/callback',
      allowedDomains,
    },
    frontend: {
      enabled: yn(env.NUXT_PUBLIC_OIDC_ENABLED, { default: false }),
      loginText: env.NUXT_PUBLIC_OIDC_LOGIN_TEXT || 'Sign in with Google',
      logoutEnabled: yn(env.NUXT_PUBLIC_OIDC_LOGOUT_ENABLED, {
        default: false,
      }),
    },
  };
});
