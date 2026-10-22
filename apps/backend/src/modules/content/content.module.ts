import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ContentController } from './content.controller';
import {
  ContentElementHookRegistry,
} from './services/content-element-hook-registry.service';
import { ContentService } from './services/content.service';
import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cacheConfig = config.get('cache');
        const ttl = cacheConfig.defaultTTL * 1000;
        if (cacheConfig.store === 'redis') {
          // Redis store requires cache-manager-redis-store package
          // For now, fall back to in-memory cache
          // TODO: Implement Redis store when needed for production
          console.warn(
            '[ContentModule] Redis cache requested but not configured',
          );
        }
        // In-memory cache configuration
        return {
          ttl,
          isGlobal: false, // Scoped to this module
        };
      },
    }),
  ],
  controllers: [ContentController, WebhooksController],
  providers: [ContentService, ContentElementHookRegistry],
  exports: [ContentService],
})
export class ContentModule {}
