import * as Joi from 'joi';

import { aiValidationSchema } from './ai.config';
import { authValidationSchema } from './auth.config';
import { cacheValidationSchema } from './cache.config';
import { dbValidationSchema } from './db.config';
import { garmentValidationSchema } from './garment.config';
import { generalValidationSchema } from './general.config';
import { mailValidationSchema } from './mail.config';
import { googleOAuthValidationSchema } from './oauth-google.config';
import { oauthClientValidationSchema } from './oauth-client.config';

export const validationSchema = Joi.object({
  ...aiValidationSchema,
  ...authValidationSchema,
  ...cacheValidationSchema,
  ...dbValidationSchema,
  ...garmentValidationSchema,
  ...generalValidationSchema,
  ...mailValidationSchema,
  ...googleOAuthValidationSchema,
  ...oauthClientValidationSchema,
});
