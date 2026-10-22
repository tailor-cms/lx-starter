/**
 * Courseware Assistant Controller
 * Conversational search, recommendation and pathway design.
 *
 * @module learning
 */
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { oneLine } from 'common-tags';

import { AssistantChatRequestDto, AssistantReplyDto } from './dto/assistant.dto';
import { CurrentUser, Roles } from '@/modules/auth/common';
import { CoursewareAssistantService } from './courseware-assistant.service';
import { UserRole } from '@/database/entities';

@ApiTags('assistant')
@Controller('assistant')
export class CoursewareAssistantController {
  constructor(private readonly assistant: CoursewareAssistantService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Ask the courseware assistant',
    description: oneLine`
      Answers a free-text question about the catalog, recommends content, or
      proposes a learning pathway. The endpoint is stateless: the client
      replays the whole conversation on every turn.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Assistant reply with any resolved content',
    type: AssistantReplyDto,
  })
  @ApiResponse({ status: 400, description: 'AI provider is not configured' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async chat(
    @CurrentUser() currentUser: any,
    @Body() body: AssistantChatRequestDto,
  ): Promise<AssistantReplyDto> {
    return this.assistant.chat(currentUser.id, body.messages);
  }
}
