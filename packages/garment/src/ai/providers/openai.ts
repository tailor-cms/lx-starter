/**
 * OpenAI AI Provider
 * Implementation for GPT models using the official openai client library
 */
import OpenAI from 'openai';

import type { AIProviderConfig, CompletionOptions } from '@/ai/types';
import { BaseAIProvider } from './base';

/**
 * OpenAI provider for GPT models
 * Supports text generation and embeddings via OpenAI API
 */
export class OpenAIProvider extends BaseAIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    super(config);
    // Initialize OpenAI client with configuration
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: config.baseURL,
      timeout: this.timeout,
      // Retry failed requests twice before throwing
      maxRetries: 2,
    });
  }

  /**
   * Get default model for OpenAI provider
   * Returns latest stable GPT model
   */
  protected getDefaultModel(): string {
    return 'gpt-5.1';
  }

  /**
   * Generate text completion using chat completions API
   * @param prompt User prompt or instruction
   * @param options Completion parameters (temperature, tokens, etc.)
   * @returns Generated text content
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    return this.createCompletion(
      [{ role: 'user', content: prompt }],
      options,
    );
  }

  /**
   * Generate a chat response from a system prompt and message history.
   * @param prompt System prompt defining the AI's role
   * @param messages Conversation history
   * @param options Completion parameters
   * @returns Generated text response
   */
  async chat(
    prompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: CompletionOptions,
  ): Promise<string> {
    return this.createCompletion(
      [{ role: 'system', content: prompt }, ...messages],
      options,
    );
  }

  private async createCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: CompletionOptions,
  ): Promise<string> {
    // Build request parameters, only including optional fields if provided
    const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
      model: options?.model || this.model,
      // Default to 16384 tokens if not specified
      max_completion_tokens: options?.maxTokens || 16384,
      messages,
    };
    // Add optional sampling parameters only if explicitly set
    if (options?.temperature !== undefined) {
      requestParams.temperature = options.temperature;
    }
    if (options?.topP !== undefined) {
      requestParams.top_p = options.topP;
    }
    if (options?.stopSequences) {
      requestParams.stop = options.stopSequences;
    }
    // Enable JSON mode when requested
    if (options?.responseFormat === 'json') {
      requestParams.response_format = { type: 'json_object' };
    }
    // Make API request
    const completion = await this.client.chat.completions.create(requestParams);
    // Extract and validate response content
    const choice = completion.choices[0];
    const content = choice?.message?.content;
    if (!content) {
      const finishReason = choice?.finish_reason || 'unknown';
      const refusal = (choice?.message as any)?.refusal;
      throw new Error(
        `OpenAI returned empty response - finish_reason: ${finishReason}` +
          (refusal ? `, refusal: ${refusal}` : '') +
          `, model: ${this.model}`,
      );
    }
    return content;
  }

  /**
   * Create an ephemeral token for the OpenAI Realtime API.
   * Allows browser clients to establish a direct WebRTC connection
   * for low-latency voice conversations.
   * @param instructions System prompt/instructions for the session
   * @param voice Optional voice for audio output (default: OpenAI's default)
   * @returns Ephemeral client token and expiration timestamp
   */
  async createRealtimeSession(
    instructions: string,
    voice?: string,
  ): Promise<{ token: string; expiresAt: number }> {
    const response = await this.client.realtime.clientSecrets.create({
      session: {
        type: 'realtime',
        model: 'gpt-realtime',
        instructions,
        audio: {
          output: { voice },
          input: {
            noise_reduction: { type: 'near_field' },
            transcription: { model: 'gpt-4o-mini-transcribe', language: 'en' },
            turn_detection: { type: 'server_vad' },
          },
        },
      },
    });
    return { token: response.value, expiresAt: response.expires_at };
  }

  /**
   * Generate embeddings for text
   * Uses text-embedding-3-small model for efficient vector representations
   * @param text Input text to embed
   * @returns Vector embedding (1536 dimensions)
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      // Use small model for cost efficiency
      model: 'text-embedding-3-small',
      input: text,
    });
    // Extract and validate embedding vector
    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error(
        'OpenAI returned empty response - no embedding in data array',
      );
    }
    return embedding;
  }
}
