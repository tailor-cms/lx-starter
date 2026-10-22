/**
 * Content Analysis Prompts
 * AI prompts for generating metadata from educational content
 */
import type { ExtractedRepository } from '../../types';

export { PROBLEM_PROMPT } from './problem-prompt';
export { TAG_PROMPT } from './tag-prompt';
export { OUTCOME_PROMPT } from './outcome-prompt';
export { SUMMARY_PROMPT } from './summary-prompt';

/**
 * Build prompt with template variables
 * Replaces {{title}} and {{content}} placeholders.
 * Content is truncated to ~6000 tokens (~24000 chars) if too long.
 * @param template - Prompt template with placeholders
 * @param content - Extracted content with title
 * @param plainText - Plain text content to insert
 */
export function buildPrompt(
  template: string,
  content: ExtractedRepository,
  plainText: string,
): string {
  // Truncate content if too long (keeping ~6000 tokens worth)
  const maxChars = 24000;
  const truncatedContent =
    plainText.length > maxChars
      ? plainText.substring(0, maxChars) + '\n\n[Content truncated...]'
      : plainText;
  return template
    .replace('{{title}}', content.title)
    .replace('{{content}}', truncatedContent);
}
