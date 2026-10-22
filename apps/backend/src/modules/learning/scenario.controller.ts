/**
 * Scenario Controller
 * Handles AI-powered role-play scenarios for learning experiences.
 *
 * @module learning
 */
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { oneLine } from 'common-tags';

import { Roles } from '@/modules/auth/common';
import {
  ChatRequestDto,
  ChatResponseDto,
  RealtimeSessionRequestDto,
  RealtimeSessionResponseDto,
  ScenarioGenerateRequestDto,
  ScenarioGenerateResponseDto,
} from './dto/scenario.dto';
import { ScenarioService } from './scenario.service';
import { UserRole } from '@/database/entities';

@ApiTags('scenario')
@Controller('learning/scenario')
export class ScenarioController {
  constructor(private readonly scenarioService: ScenarioService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generate AI text for scenario context',
    description: oneLine`
      Uses the configured AI provider to generate text from a prompt.
      Used for generating client profiles from survey answers and
      post-conversation analysis/reflection.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'AI-generated response',
    type: ScenarioGenerateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'AI provider is not configured',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(
    @Body() body: ScenarioGenerateRequestDto,
  ): Promise<ScenarioGenerateResponseDto> {
    const response = await this.scenarioService.generate(body.prompt, {
      responseFormat: 'json',
      model: 'gpt-4.1',
    });
    return { response };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Chat with AI using a system prompt and message history',
    description: oneLine`
      Generates AI responses based on a system prompt and conversation
      history. Used for role-play scenarios, Socratic tutoring, and
      other conversational AI interactions.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'AI chat response',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'AI provider is not configured',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async chat(
    @Body() body: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const response = await this.scenarioService.chat(
      body.prompt,
      body.messages,
    );
    return { response };
  }

  @Post('realtime-session')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create ephemeral token for OpenAI Realtime API',
    description: oneLine`
      Creates a short-lived client secret that allows the browser to
      establish a direct WebRTC connection to OpenAI's Realtime API.
      The session is pre-configured with the client role-play instructions.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Ephemeral token for WebRTC connection',
    type: RealtimeSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'AI provider is not configured',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async realtimeSession(
    @Body() body: RealtimeSessionRequestDto,
  ): Promise<RealtimeSessionResponseDto> {
    return this.scenarioService.createRealtimeSession(body.prompt, body.voice);
  }
}
