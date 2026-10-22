import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';

const env = process.env;

export const cacheValidationSchema = {
  CACHE_STORE: Joi.string().valid('memory', 'redis').default('memory'),
  CACHE_DEFAULT_TTL: Joi.number().default(8 * 60 * 60),
  CACHE_CATALOG_TTL: Joi.number().default(8 * 60 * 60),
  CACHE_GRAPH_TTL: Joi.number().default(8 * 60 * 60),
  CACHE_REPO_TTL: Joi.number().default(8 * 60 * 60),
  CACHE_ACTIVITY_TTL: Joi.number().default(8 * 60 * 60),
  CACHE_SIGNATURE_TTL: Joi.number().default(12 * 60 * 60),
  REDIS_HOST: Joi.string().when('CACHE_STORE', {
    is: 'redis',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  REDIS_PORT: Joi.number().when('CACHE_STORE', {
    is: 'redis',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_NAMESPACE: Joi.string().default('lx'),
};

export interface CacheConfig {
  store: 'memory' | 'redis';
  defaultTTL: number;
  catalogTTL: number;
  graphTTL: number;
  repositoryTTL: number;
  activityTTL: number;
  signatureTTL: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  namespace: string;
}

export default registerAs(
  'cache',
  (): CacheConfig => ({
    store: (env.CACHE_STORE as 'memory' | 'redis') || 'memory',
    defaultTTL: parseInt(env.CACHE_DEFAULT_TTL || `${8 * 60 * 60}`, 10),
    catalogTTL: parseInt(env.CACHE_CATALOG_TTL || `${8 * 60 * 60}`, 10),
    graphTTL: parseInt(env.CACHE_GRAPH_TTL || `${8 * 60 * 60}`, 10),
    repositoryTTL: parseInt(env.CACHE_REPO_TTL || `${8 * 60 * 60}`, 10),
    activityTTL: parseInt(env.CACHE_ACTIVITY_TTL || `${8 * 60 * 60}`, 10),
    signatureTTL: parseInt(env.CACHE_SIGNATURE_TTL || `${12 * 60 * 60}`, 10),
    ...(env.CACHE_STORE === 'redis' && {
      redis: {
        host: env.REDIS_HOST as string,
        port: parseInt(env.REDIS_PORT || '6379', 10),
        password: env.REDIS_PASSWORD,
      },
    }),
    namespace: env.REDIS_NAMESPACE || 'lx',
  }),
);
