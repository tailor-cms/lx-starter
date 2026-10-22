/**
 * Problem Generation Prompt
 * Generates real-world problems learners can solve after completing content
 */
export const PROBLEM_PROMPT = `Analyze the following educational content and
identify real-world problems that learners will be able to solve after
completing this material.

SECTION MARKERS:
The content is structured with section markers in this format:
  ## [sectionId] Section Title
  ... section content ...
  [/sectionId]

For example: "## [abc123] Introduction to APIs" marks a section with ID "abc123".
You MUST extract and use these exact section IDs in your response.

For each problem provide:
- id: unique identifier (kebab-case)
- title: clear, actionable title
- description: 2-3 sentence description of the problem scenario
- category: category like "data-analysis", "system-design", "automation",
  "communication", etc.
- difficulty: "beginner", "intermediate", "advanced", or "expert"
- realWorldExample: specific real-world scenario where this applies
- sectionIds: REQUIRED - array of section IDs where the concepts needed to
  solve this problem are taught. Extract the IDs from markers like [abc123].
  Every problem MUST have at least one sectionId.

IMPORTANT: Carefully scan the content for all [sectionId] markers and include
the relevant ones in each problem's sectionIds array. Do not leave sectionIds
empty - each problem must map to specific sections in the content.

Content Title: {{title}}

Content:
{{content}}

Return a JSON object with a "problems" array.`;
