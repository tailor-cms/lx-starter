import { AuthModule } from '../src/modules/auth/auth.module';
import { CommonModule } from '../src/common/common.module';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '../src/modules/health/health.module';
import { IntegrationModule } from '../src/modules/integration/integration.module';
import { LoggerModule } from 'nestjs-pino';
import { MailModule } from '../src/modules/mail/mail.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { SeedModule } from '../src/modules/seed/seed.module';
import { TestContentModule } from './test-content.module';
import { UserModule } from '../src/modules/user/user.module';

import authConfig from '../src/config/auth.config';
import cacheConfig from '../src/config/cache.config';
import garmentConfig from '../src/config/garment.config';
import generalConfig from '../src/config/general.config';
import mailConfig from '../src/config/mail.config';
import oauthClientConfig from '../src/config/oauth-client.config';
import mikroOrmConfig from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
      load: [
        authConfig,
        cacheConfig,
        garmentConfig,
        generalConfig,
        mailConfig,
        oauthClientConfig,
      ],
    }),
    // Disable logging during tests
    LoggerModule.forRoot({
      pinoHttp: { level: 'silent' },
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    CommonModule,
    AuthModule,
    TestContentModule,
    HealthModule,
    IntegrationModule,
    MailModule,
    SeedModule,
    UserModule,
  ],
})
export class TestAppModule {}
