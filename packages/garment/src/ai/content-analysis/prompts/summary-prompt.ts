/**
 * Summary Generation Prompt
 * Generates content summary, difficulty level, and estimated duration
 */
export const SUMMARY_PROMPT = `Generate a concise summary of this educational
content.

Content Title: {{title}}

Content:
{{content}}

Return a JSON object with:
- summary: 2-3 sentence summary of what this content teaches
- difficulty: overall difficulty level ("beginner", "intermediate", "advanced", "expert")
- estimatedMinutes: estimated time to complete in minutes (number)`;
