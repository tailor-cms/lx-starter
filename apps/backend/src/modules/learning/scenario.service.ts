import { type CompletionOptions, OpenAIProvider } from '@tailor-cms/garment';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import type { AIConfig } from '../../config/ai.config';

/**
 * Scenario Service
 * Handles AI-powered role-play scenarios for learning experiences.
 */
@Injectable()
export class ScenarioService {
  private readonly aiProvider?: OpenAIProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ScenarioService.name);
    // Initialize AI provider from config
    const aiConfig = this.config.get('ai') as AIConfig;
    this.aiProvider = aiConfig
      ? new OpenAIProvider({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        baseURL: aiConfig.baseURL,
      })
      : undefined;
  }

  /**
   * Generate AI text completion for scenario context.
   * Used for generating client profiles and conversation analysis.
   * @param prompt - The prompt to send to the AI
   * @param options - Optional completion options (temperature, maxTokens, etc.)
   * @returns Generated text response
   * @throws Error if AI provider is not configured
   */
  async generate(prompt: string, options?: CompletionOptions): Promise<string> {
    if (!this.aiProvider) {
      throw new Error('AI provider is not configured');
    }
    this.logger.debug('Generating AI completion');
    try {
      const response = await this.aiProvider.complete(prompt, options);
      this.logger.debug('AI completion generated successfully');
      return response;
    } catch (error) {
      this.logger.error(
        { err: error.message },
        'Error generating AI completion',
      );
      throw error;
    }
  }

  /**
   * Generate a chat response from a system prompt and message history.
   * @param prompt - System prompt defining the AI's role
   * @param messages - Conversation history
   * @returns AI response text
   * @throws Error if AI provider is not configured
   */
  async chat(
    prompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    if (!this.aiProvider) {
      throw new Error('AI provider is not configured');
    }
    this.logger.debug('Generating chat response');
    try {
      const response = await this.aiProvider.chat(prompt, messages);
      this.logger.debug('Chat response generated successfully');
      return response;
    } catch (error) {
      this.logger.error(
        { err: error.message },
        'Error generating chat response',
      );
      throw error;
    }
  }

  /**
   * Create an ephemeral token for the OpenAI Realtime API.
   * The token allows the browser to establish a direct WebRTC connection
   * for low-latency voice conversations.
   */
  async createRealtimeSession(
    prompt: string,
    voice?: string,
  ): Promise<{ token: string; expiresAt: number }> {
    if (!this.aiProvider) {
      throw new Error('AI provider is not configured');
    }
    this.logger.debug('Creating Realtime API ephemeral token');
    try {
      const result = await this.aiProvider.createRealtimeSession(prompt, voice);
      this.logger.debug('Realtime token created successfully');
      return result;
    } catch (error) {
      this.logger.error(
        { err: error.message },
        'Error creating Realtime API token',
      );
      throw error;
    }
  }
}
