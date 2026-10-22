import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';

const env = process.env;

export const aiValidationSchema = {
  AI_SECRET_KEY: Joi.string().required(),
  AI_MODEL: Joi.string().default('gpt-5.1'),
  AI_BASE_URL: Joi.string().allow('').optional(),
};

export interface AIConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
}

export default registerAs('ai', (): AIConfig => {
  return {
    apiKey: env.AI_SECRET_KEY as string,
    model: env.AI_MODEL || 'gpt-5.1',
    baseURL: env.AI_BASE_URL || undefined,
  };
});
