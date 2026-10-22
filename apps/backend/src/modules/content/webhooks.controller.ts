import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { oneLine } from 'common-tags';

import { AccessWebhookPayloadDto, WebhookPayloadDto } from './dto';
import { ContentService } from './services/content.service';
import { OAuthOnly } from '@/modules/auth/common';

@ApiTags('webhooks')
@Controller('content/webhook')
export class WebhooksController {
  constructor(private readonly contentService: ContentService) {}

  @Post('publish')
  @OAuthOnly('webhook:publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook endpoint for TailorCMS publish events (OAuth only)',
    description: oneLine`
      Receives publish notifications from Tailor CMS when repository or activity
      content is updated. Triggers content synchronization to refresh the local
      cache. Requires OAuth token with webhook:publish scope.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - OAuth token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing required scope',
  })
  async handlePublishWebhook(@Body() payload: WebhookPayloadDto) {
    await this.contentService.onContentPublish(payload);
    return { success: true };
  }

  @Post('access')
  @OAuthOnly('webhook:access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Endpoint for Tailor CMS access rights updates (OAuth only)',
    description: oneLine`
      Receives access rights updates from Tailor CMS when permissions change
      for a repository. Updates local access indices for authorization checks.
      Requires OAuth token with webhook:access scope.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Access rights updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - OAuth token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Missing required scope',
  })
  async handleAccessWebhook(@Body() payload: AccessWebhookPayloadDto) {
    await this.contentService.onAccessUpdate(payload);
    return { success: true };
  }
}
