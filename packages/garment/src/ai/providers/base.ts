/**
 * Base AI Provider
 * Abstract class for AI provider implementations
 */
import type {
  AIProvider,
  AIProviderConfig,
  CompletionOptions,
} from '@/ai/types';

/**
 * Base class for AI provider implementations
 * Provides common functionality for OpenAI, Anthropic, and other LLM providers
 * Subclasses must implement: name, getDefaultModel(), and complete()
 */
export abstract class BaseAIProvider implements AIProvider {
  // Provider identifier (e.g., 'openai', 'anthropic')
  abstract name: string;
  // API authentication key
  protected apiKey: string;
  // Model identifier (e.g., 'gpt-4', 'claude-3-opus')
  protected model: string;
  // Optional custom API endpoint
  protected baseURL?: string;
  // Request timeout in milliseconds
  protected timeout: number;

  constructor(config: AIProviderConfig) {
    // Validate required configuration
    if (!config.apiKey) {
      throw new Error('API key is required for AI provider');
    }
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    // Use provided model or fall back to provider's default
    this.model = config.model || this.getDefaultModel();
    // Default to 5 minute timeout if not specified
    this.timeout = config.timeout || 300000;
  }

  /**
   * Get the default model for this provider
   * Each provider implementation defines its own default
   */
  protected abstract getDefaultModel(): string;

  /**
   * Generate text completion from prompt
   * Must be implemented by each provider
   */
  abstract complete(
    prompt: string,
    options?: CompletionOptions,
  ): Promise<string>;

  /**
   * Generate structured JSON output from prompt
   * Uses the provider's complete() method with JSON extraction
   * Handles common edge cases like markdown code blocks
   *
   * @param prompt Instructions for the LLM
   * @param options Completion parameters (temperature, tokens, etc.)
   * @returns Parsed JSON object of type T
   * @throws Error if response is not valid JSON
   */
  async generateStructured<T>(
    prompt: string,
    options?: CompletionOptions,
  ): Promise<T> {
    // Augment prompt with strict JSON formatting instructions
    const jsonPrompt =
      `${prompt}\n\nIMPORTANT: Respond with valid JSON only. ` +
      `No markdown formatting, no code blocks, just raw JSON.`;
    // Request completion with low temperature for consistency
    const response = await this.complete(jsonPrompt, {
      ...options,
      // Override temperature to 0.1 for structured output unless set
      temperature: options?.temperature ?? 0.1,
      // Request JSON response format from providers that support it
      responseFormat: 'json',
    });
    // Attempt to parse the response as JSON
    try {
      // First try direct parsing (most common case)
      return JSON.parse(response) as T;
    } catch {
      // If direct parsing fails, try to extract JSON from wrapped content
      return this.extractJSON<T>(response);
    }
  }

  /**
   * Extract JSON from LLM response that may contain markdown or other wrapping
   * Handles common patterns like ```json blocks and text before/after JSON
   *
   * @param response Raw LLM response text
   * @returns Parsed JSON object
   * @throws Error if no valid JSON found
   */
  private extractJSON<T>(response: string): T {
    const trimmed = response.trim();
    // Step 1: Remove markdown code blocks if present
    const cleaned = this.removeMarkdownCodeBlocks(trimmed);
    // Step 2: Find JSON boundaries (first/last braces or brackets)
    const boundaries = this.findJSONBoundaries(cleaned);
    if (!boundaries) {
      throw new Error(
        `Could not find JSON in AI response. Response: ${response.substring(0, 500)}...`,
      );
    }
    // Step 3: Extract and parse JSON content
    const { start, end } = boundaries;
    const jsonString = cleaned.substring(start, end + 1);
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse extracted JSON: ` +
        `${error instanceof Error ? error.message : 'Unknown error'}\n` +
        `Extracted: ${jsonString.substring(0, 500)}...`,
      );
    }
  }

  /**
   * Remove markdown code block syntax from text
   * Handles both ```json and ``` formats
   */
  private removeMarkdownCodeBlocks(text: string): string {
    let cleaned = text;
    // Check for ```json code blocks
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7); // Remove ```json prefix
      const endIndex = cleaned.lastIndexOf('```');
      if (endIndex !== -1) {
        cleaned = cleaned.substring(0, endIndex);
      }
    } else if (cleaned.startsWith('```')) {
      // Check for generic ``` code blocks
      cleaned = cleaned.substring(3); // Remove ``` prefix
      const endIndex = cleaned.lastIndexOf('```');
      if (endIndex !== -1) {
        cleaned = cleaned.substring(0, endIndex);
      }
    }
    return cleaned;
  }

  /**
   * Find the start and end positions of JSON content in text
   * Looks for outermost { } or [ ] pairs
   *
   * @returns Object with start and end indices, or null if not found
   */
  private findJSONBoundaries(
    text: string,
  ): { start: number; end: number } | null {
    // Find first occurrence of { or [
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    // Determine which comes first (or if only one exists)
    const startIdx =
      firstBrace === -1
        ? firstBracket
        : firstBracket === -1
          ? firstBrace
          : Math.min(firstBrace, firstBracket);
    // Find last occurrence of } or ]
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const endIdx = Math.max(lastBrace, lastBracket);
    // Validate we found valid boundaries
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      return { start: startIdx, end: endIdx };
    }
    return null;
  }

  /**
   * Estimate token count for text
   * Rough approximation: ~4 characters per token for English text
   * Useful for pre-flight checks and cost estimation
   *
   * @param text Input text to estimate
   * @returns Estimated token count
   */
  protected estimateTokens(text: string): number {
    // Rough heuristic: 4 chars per token
    return Math.ceil(text.length / 4);
  }
}
