import { ContentController } from '../src/modules/content/content.controller';
import { ContentService } from '../src/modules/content/services/content.service';
import { Module } from '@nestjs/common';
import { WebhooksController } from '../src/modules/content/webhooks.controller';

/**
 * Mock ContentService for tests
 * Prevents S3/Garment API calls during test execution
 */
const mockContentService = {
  list: jest.fn().mockResolvedValue([]),
  get: jest.fn().mockResolvedValue(null),
  getNode: jest.fn().mockResolvedValue(null),
  onContentPublish: jest.fn().mockResolvedValue(undefined),
  onAccessUpdate: jest.fn().mockResolvedValue(undefined),
};

/**
 * Test-only ContentModule replacement
 * Provides ContentController with mocked ContentService to avoid S3 calls
 */
@Module({
  controllers: [ContentController, WebhooksController],
  providers: [
    {
      provide: ContentService,
      useValue: mockContentService,
    },
  ],
  exports: [ContentService],
})
export class TestContentModule {}
