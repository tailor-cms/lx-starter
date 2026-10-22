/**
 * AI Provider Types
 * Provider abstraction layer
 * Used by: providers/anthropic, providers/openai, MetadataGenerator
 */

/**
 * AI completion options
 * Controls how the LLM generates text
 */
export interface CompletionOptions {
  /**
   * Temperature (0-1)
   * Controls randomness in generation
   * - 0: Deterministic, focused, repetitive
   * - 0.3: Balanced creativity for structured tasks
   * - 0.7: Creative but coherent
   * - 1.0: Maximum randomness and creativity
   * Default varies by use case
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   * Limits response length
   * Default: 4096 for most providers
   */
  maxTokens?: number;

  /**
   * Stop sequences
   * Array of strings that stop generation when encountered
   * Example: ['\n\n', 'END', '```']
   */
  stopSequences?: string[];

  /**
   * Top-P sampling (0-1), also called nucleus sampling
   * Alternative to temperature for controlling randomness
   * - 0.1: Only sample from top 10% most likely tokens (focused, deterministic)
   * - 0.5: Sample from top 50% most likely tokens (balanced)
   * - 0.9: Sample from top 90% most likely tokens (diverse)
   * - 1.0: Consider all tokens (maximum diversity)
   *
   * How it works:
   * - Tokens are ranked by probability
   * - Cumulative probability is calculated
   * - Only tokens whose cumulative probability <= topP are sampled
   *
   * Relationship with temperature:
   * - Temperature reshapes probability distribution
   * - Top-P filters the distribution
   * - Usually use one or the other, not both
   * - Top-P is generally more predictable than temperature
   *
   * Use cases:
   * - 0.1-0.3: Factual answers, code generation, structured data
   * - 0.5-0.7: General conversation, summaries
   * - 0.8-0.95: Creative writing, brainstorming
   */
  topP?: number;

  /**
   * Response format hint for providers that support it
   * - 'json': Request JSON output (e.g., OpenAI json_object mode)
   */
  responseFormat?: 'json';

  /**
   * Override the provider's default model for this request
   */
  model?: string;
}

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  timeout?: number;
}

/**
 * AI provider interface
 */
export interface AIProvider {
  name: string;

  /**
   * Generate text completion
   */
  complete(prompt: string, options?: CompletionOptions): Promise<string>;

  /**
   * Generate structured JSON output
   */
  generateStructured?<T>(prompt: string, options?: CompletionOptions): Promise<T>;

  /**
   * Generate text embeddings
   */
  embed?(text: string): Promise<number[]>;
}
