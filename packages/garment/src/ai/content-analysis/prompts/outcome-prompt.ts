/**
 * Learning Outcome Generation Prompt
 * Generates learning outcomes using Bloom's Taxonomy
 */
export const OUTCOME_PROMPT = `Generate learning outcomes for this educational
content using Bloom's Taxonomy.

SECTION MARKERS:
The content is structured with section markers in this format:
  ## [sectionId] Section Title
  ... section content ...
  [/sectionId]

For example: "## [abc123] Introduction to APIs" marks a section with ID "abc123".
You MUST extract and use these exact section IDs in your response.

For each outcome provide:
- id: unique identifier (kebab-case)
- description: what the learner will be able to do (start with a Bloom's
  action verb like "identify", "implement", "evaluate")
- bloomLevel: Bloom's Taxonomy level - "remember", "understand", "apply",
  "analyze", "evaluate", or "create"
- measurable: boolean - can this outcome be objectively measured/assessed?
- assessmentCriteria: optional array of strings describing how to assess achievement
- sectionIds: REQUIRED - array of section IDs where this learning outcome is
  addressed or achieved. Extract the IDs from markers like [abc123].
  Every outcome MUST have at least one sectionId.

Generate outcomes that progress from lower to higher cognitive levels.

IMPORTANT: Carefully scan the content for all [sectionId] markers and include
the relevant ones in each outcome's sectionIds array. Do not leave sectionIds
empty - each outcome must map to specific sections in the content.

Content Title: {{title}}

Content:
{{content}}

Return a JSON object with a "outcomes" array.`;
