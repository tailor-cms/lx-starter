import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';

const { env } = process;
export const provider = 'aws';
export const endpoint = process.env.GARMENT_ENDPOINT || '';

export const garmentValidationSchema = {
  GARMENT_KEY: Joi.string().required(),
  GARMENT_SECRET: Joi.string().required(),
  GARMENT_REGION: Joi.string().default('us-east-1'),
  GARMENT_BUCKET: Joi.string().required(),
  GARMENT_ENDPOINT: Joi.string().allow(''),
};

export interface AwsGarmentConfig {
  keyId: string;
  secretKey: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface GarmentConfig {
  provider: 'aws';
  bucket: string;
  aws: AwsGarmentConfig;
}

export default registerAs(
  'garment',
  (): GarmentConfig => ({
    provider,
    bucket: env.GARMENT_BUCKET as string,
    aws: {
      keyId: env.GARMENT_KEY as string,
      secretKey: env.GARMENT_SECRET as string,
      region: env.GARMENT_REGION as string,
      ...(endpoint && { endpoint, forcePathStyle: true }),
    },
  }),
);
