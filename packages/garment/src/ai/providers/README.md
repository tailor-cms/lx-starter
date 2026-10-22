# AI Providers

This directory contains AI provider implementations for the Garment AI module.

## Current Providers

- **OpenAI** - Official OpenAI client library integration

## Adding a New Provider

To add support for a new AI provider (e.g., Anthropic, Google, Azure):

1. **Create a new provider file** (e.g., `anthropic.ts`)
2. **Extend `BaseAIProvider`** and implement required methods:
   - `getDefaultModel()` - Return default model name
   - `complete(prompt, options)` - Text completion implementation
   - (Optional) `generateStructured<T>()` - JSON structured output (inherited from base)
   - (Optional) `embed(text)` - Text embeddings support

3. **Export from `index.ts`**

## Provider Interface

All providers must implement the `AIProvider` interface:

```typescript
interface AIProvider {
  name: string;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  generateStructured?<T>(prompt: string, options?: CompletionOptions): Promise<T>;
  embed?(text: string): Promise<number[]>;
}
```
