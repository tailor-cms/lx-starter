/**
 * This propmpt is used to generate profiling questions based on tag and
 * category distributions. This helps create personalized surveys for learners
 * which can then be used to match them to relevant content.
 */
export const PROMPT = `
  Based on the following tag and category distribution from educational content,
  generate {{count}} profiling questions to help identify learner interests and
  match them to appropriate content.

  Question types to include:
  - interest: Discover what topics/areas excite the learner
  - experience: Assess their current skill level
  - goal: Understand what they want to achieve
  - preference: Learn how they prefer to learn

  For each question provide (matching Tailor CMS multiple choice format):
  - id: unique identifier (kebab-case)
  - questionText: the question text (will be converted to embedded format)
  - answers: array of 3-5 answer strings (the options)
  - allowMultiple: boolean whether multiple options can be selected
  - category: one of "interest", "experience", "goal", "preference"
  - tagAffinities: array of objects (same length as answers),
    each mapping tag names to affinity scores (0-1)
  - feedback: object with keys "0", "1", "2", "3" containing feedback text
    for each answer (optional)
  - hint: helpful hint for answering (can be empty string)
  - weight: importance in matching (0-1)
  - relatedTags: array of tag names this question helps identify

  Tag Distribution:
  {{tagDistribution}}

  Category Distribution:
  {{categoryDistribution}}

  Difficulty Distribution:
  {{difficultyDistribution}}

  Generate questions that will efficiently differentiate learners and match them
  to the most relevant content.

  Return a JSON object with a "questions" array.`;

const stringify = (val) => JSON.stringify(val, null, 2);

/**
 * Build the question generation prompt with data
 */
export function buildQuestionPrompt(
  count: number,
  tagDistribution: Record<string, number>,
  categoryDistribution: Record<string, number>,
  difficultyDistribution: Record<string, number>,
): string {
  return PROMPT.replace('{{count}}', String(count))
    .replace('{{tagDistribution}}', stringify(tagDistribution))
    .replace('{{categoryDistribution}}', stringify(categoryDistribution))
    .replace('{{difficultyDistribution}}', stringify(difficultyDistribution));
}
