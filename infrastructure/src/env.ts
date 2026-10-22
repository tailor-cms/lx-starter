import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import type * as studion from '@studion/infra-code-blocks';

import type { DatabaseOutputs } from './types';

type Database = studion.Database | DatabaseOutputs;

const awsConfig = new pulumi.Config('aws');
const dnsConfig = new pulumi.Config('dns');
const garmentConfig = new pulumi.Config('garment');
const mailConfig = new pulumi.Config('mail');
const ssmConfig = new pulumi.Config('ssm');
const aiConfig = new pulumi.Config('ai');
const accountId = aws.getCallerIdentityOutput().accountId;

function getSsmParamArn(key: string): pulumi.Output<string> {
  const region = awsConfig.require('region');
  const prefix = ssmConfig.require('keyPrefix');
  const baseArn = `arn:aws:ssm:${region}`;
  return pulumi.interpolate`${baseArn}:${accountId}:parameter/${prefix}/${key}`;
}

export const getEnvVariables = (
  db: Database,
  sharedStack?: pulumi.StackReference,
) => {
  const envVars = [
    // General configuration
    { name: 'NODE_ENV', value: 'production' },
    { name: 'LOG_LEVEL', value: 'info' },
    { name: 'HOSTNAME', value: dnsConfig.require('domain') },
    { name: 'PORT', value: '3000' },
    { name: 'REVERSE_PROXY_PORT', value: '443' },
    {
      name: 'CORS_ALLOWED_ORIGINS',
      value: `https://${dnsConfig.require('domain')}`,
    },
    // Database configuration
    { name: 'DATABASE_HOST', value: db.instance.address },
    {
      name: 'DATABASE_PORT',
      value: db.instance.port.apply((port: number) => String(port)),
    },
    { name: 'DATABASE_NAME', value: db.instance.dbName },
    { name: 'DATABASE_USERNAME', value: db.instance.username },
    { name: 'DATABASE_SSL', value: 'true' },
    { name: 'DATABASE_LOGGING', value: 'false' },
    { name: 'DATABASE_AUTO_MIGRATIONS', value: 'true' },
    // Authentication configuration
    { name: 'AUTH_JWT_ISSUER', value: 'App' },
    { name: 'AUTH_JWT_EXPIRES_IN', value: '7d' },
    { name: 'AUTH_COOKIE_NAME', value: 'access_token' },
    { name: 'AUTH_SALT_ROUNDS', value: '12' },
    // OAuth Client Credentials configuration
    { name: 'OAUTH_ACCESS_TOKEN_EXPIRES_IN', value: '24h' },
    { name: 'OAUTH_DEFAULT_RATE_LIMIT', value: '1000' },
    // Google OAuth configuration
    { name: 'GOOGLE_OAUTH_ENABLED', value: 'true' },
    {
      name: 'GOOGLE_CALLBACK_URL',
      value: `https://${dnsConfig.require('domain')}/api/oidc/callback`,
    },
    { name: 'GOOGLE_ALLOWED_DOMAINS', value: 'gostudion.com' },
    // Frontend OIDC configuration
    { name: 'NUXT_PUBLIC_OIDC_ENABLED', value: 'true' },
    { name: 'NUXT_PUBLIC_OIDC_LOGIN_TEXT', value: 'Sign in with Google' },
    { name: 'NUXT_PUBLIC_OIDC_LOGOUT_ENABLED', value: 'false' },
    // Mail configuration
    { name: 'MAIL_HOST', value: mailConfig.require('host') },
    { name: 'MAIL_PORT', value: '465' },
    { name: 'MAIL_SECURE', value: 'true' },
    { name: 'MAIL_FROM_NAME', value: 'LX Platform' },
    { name: 'MAIL_FROM_EMAIL', value: mailConfig.require('senderAddress') },
  ];
  // For shared stacks, add the default database name variable
  if (sharedStack) {
    envVars.push({
      name: 'DATABASE_SHARED_DEFAULT_DB_NAME',
      value: sharedStack.requireOutput('dbName') as pulumi.Output<string>,
    });
  }
  const garmentRegion = garmentConfig.get('region') as string;
  const garmentBucket = garmentConfig.get('bucket') as string;
  envVars.push(
    { name: 'GARMENT_REGION', value: garmentRegion },
    { name: 'GARMENT_BUCKET', value: garmentBucket },
  );
  // AI configuration
  const aiModel = aiConfig.get('model') as string;
  if (aiModel) {
    envVars.push({ name: 'AI_MODEL', value: aiModel });
  }
  return envVars;
};

const SSM_SECRET_KEYS = [
  'AUTH_JWT_SECRET',
  'MAIL_USER',
  'MAIL_PASSWORD',
  'SENTRY_DSN',
  'DATABASE_PASSWORD',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GARMENT_KEY',
  'GARMENT_SECRET',
  // AI Provider
  'AI_SECRET_KEY',
  // MUX Video
  'TCE_MUX_TOKEN_ID',
  'TCE_MUX_TOKEN_SECRET',
  'TCE_MUX_JWT_SIGNING_KEY',
  'TCE_MUX_JWT_PRIVATE_KEY',
  // Statsig - Real User Monitoring
  'NUXT_PUBLIC_STATSIG_CLIENT_KEY',
] as const;

export const getSecrets = () =>
  SSM_SECRET_KEYS.map((name) => ({ name, valueFrom: getSsmParamArn(name) }));
