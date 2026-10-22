import * as Joi from 'joi';
import ms from 'ms';
import { registerAs } from '@nestjs/config';

const env = process.env;

/**
 * OAuth 2.0 Client Credentials Flow Configuration
 */
export const oauthClientValidationSchema = {
  OAUTH_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('1h'),
  OAUTH_DEFAULT_RATE_LIMIT: Joi.number().default(1000),
};

export interface OAuthTokenConfig {
  accessTokenExpiresIn: number; // milliseconds
}

export interface OAuthSecurityConfig {
  defaultRateLimit: number;
}

export interface OAuthClientConfig {
  token: OAuthTokenConfig;
  security: OAuthSecurityConfig;
}

export default registerAs('oauthClient', () => ({
  token: {
    accessTokenExpiresIn: ms(env.OAUTH_ACCESS_TOKEN_EXPIRES_IN || '1h'),
  },
  security: {
    defaultRateLimit: parseInt(env.OAUTH_DEFAULT_RATE_LIMIT || '1000', 10),
  },
}));
