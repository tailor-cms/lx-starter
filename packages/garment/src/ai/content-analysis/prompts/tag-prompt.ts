/**
 * Tag Generation Prompt
 * Generates comprehensive tags for content categorization and matching
 */
export const TAG_PROMPT = `Generate comprehensive tags for this educational content.

SECTION MARKERS:
The content is structured with section markers in this format:
  ## [sectionId] Section Title
  ... section content ...
  [/sectionId]

For example: "## [abc123] Introduction to APIs" marks a section with ID "abc123".
You MUST extract and use these exact section IDs in your response.

Categories to include:
- topic: Main subjects covered (e.g., "machine-learning", "react-hooks")
- skill: Practical skills taught (e.g., "data-visualization", "api-design")
- concept: Theoretical concepts (e.g., "recursion", "state-management")
- industry: Relevant industries (e.g., "fintech", "healthcare")
- tool: Specific tools/technologies (e.g., "tensorflow", "postgresql")

For each tag provide:
- name: tag name in kebab-case
- category: one of "topic", "skill", "concept", "industry", "tool"
- weight: relevance score from 0 to 1 (1 being most central to the content)
- parent: optional parent tag for hierarchy (e.g., "react-hooks" parent is
  "react")
- sectionIds: REQUIRED - array of section IDs where this tag applies.
  Extract the IDs from markers like [abc123]. Every tag MUST have at least
  one sectionId.

Generate 10-20 tags total, prioritizing the most relevant ones.

IMPORTANT: Carefully scan the content for all [sectionId] markers and include
the relevant ones in each tag's sectionIds array. Do not leave sectionIds
empty - each tag must map to specific sections in the content.

Content Title: {{title}}

Content:
{{content}}

Return a JSON object with a "tags" array.`;
