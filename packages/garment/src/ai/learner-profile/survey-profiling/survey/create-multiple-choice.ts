import { randomUUID } from 'node:crypto';

import type { QuestionCategory } from '../../../types';

// Embedded html content element for profiling question
export interface CeEmbed {
  id: string;
  type: 'TIPTAP_HTML';
  position: number;
  data: { content: string };
  embedded: boolean;
}

/**
 * Profiling question matching Tailor CMS format (extended for profiling)
 * Combines Tailor question format with tag affinities for learner matching.
 * The `correct` field is empty for profiling (no right answer).
 */
export interface ProfileQuestion {
  // Tailor MC schema fields
  id: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  isGradable: boolean;
  question: string[];
  answers: string[];
  correct: number[] | number | null;
  feedback: Record<string, string>;
  hint: string;
  embeds: Record<string, CeEmbed>;
  // MULTIPLE_CHOICE if true, SINGLE_CHOICE if false
  allowMultiple: boolean;
  // Profiling-specific fields
  // Profiling category: interest, experience, goal, preference
  category: QuestionCategory;
  // Tags this question helps identify
  relatedTags: string[];
  // Per-answer tag affinities (index matches answers)
  // Each entry maps tag names to affinity strength (0-1) for that answer
  // Example: [{ 'python': 0.8, 'data-science': 1 }, { 'javascript': 0.9 }]
  tagAffinities: Record<string, number>[];
  // Question importance multiplier (0-1) for affinity calculation
  // Higher weight = stronger influence on final profile affinities
  // Formula: finalAffinity = tagAffinity * question.weight
  // Example: weight=1.0 for core interest questions, weight=0.5 for secondary
  weight: number;
}

/**
 * Survey response format for API/UI consumption
 */
export interface SurveyQuestionResponse {
  id: string;
  type: 'single' | 'multiple';
  question: string;
  category: QuestionCategory;
  allowMultiple: boolean;
  options: Array<{
    label: string;
    tagAffinities: Record<string, number>;
  }>;
  weight: number;
}

/**
 * Resolved survey answer for audit/display purposes.
 * Contains human-readable labels and per-question tag contributions.
 */
export interface ResolvedSurveyAnswer {
  questionId: string;
  selectedValues: string[];
  tagAffinities: Record<string, number>;
}

/**
 * Transform ProfileQuestion to survey response format
 * Extracts question text from embeds and formats for API consumption
 */
export function toSurveyResponse(question: ProfileQuestion): SurveyQuestionResponse {
  const questionEmbed = Object.values(question.embeds)[0];
  const questionText = (questionEmbed as any)?.data?.content || '';

  return {
    id: question.id,
    type: question.type === 'MULTIPLE_CHOICE' ? 'multiple' : 'single',
    question: questionText,
    category: question.category,
    allowMultiple: question.allowMultiple,
    options: question.answers.map((answer, idx) => ({
      label: answer,
      tagAffinities: question.tagAffinities[idx] || {},
    })),
    weight: question.weight,
  };
}

/**
 * Transform survey response format back to ProfileQuestion
 * Used when processing API responses for ProfileBuilder
 */
export function fromSurveyResponse(response: SurveyQuestionResponse): ProfileQuestion {
  return {
    id: response.id,
    type: response.type === 'multiple' ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
    question: [response.question],
    answers: response.options.map((opt) => opt.label),
    tagAffinities: response.options.map((opt) => opt.tagAffinities),
    category: response.category,
    weight: response.weight,
    allowMultiple: response.allowMultiple,
    // Required but unused fields for profiling
    isGradable: false,
    correct: null,
    feedback: {},
    hint: '',
    embeds: {},
    relatedTags: [],
  };
}

export interface QuestionOpts {
  id: string;
  questionText: string;
  answers: string[];
  hint?: string;
  feedback?: Record<string, string>;
  // Allow selecting multiple answers
  allowMultiple?: boolean;
  // Profiling category (interest, experience, goal, preference)
  category: QuestionCategory;
  // Tags this question helps identify
  relatedTags?: string[];
  // Per-answer tag weights for matching
  tagAffinities: Record<string, number>[];
  // Importance in profile matching (0-1, default: 1)
  weight?: number;
}

/**
 * Create a HTML embed
 */
function createEmbed(id: string, content: string): CeEmbed {
  return {
    id,
    type: 'TIPTAP_HTML',
    position: 1,
    data: { content },
    embedded: true,
  };
}

// Create a multiple-choice question in Tailor format which can be used
// for learner profiling
export function createProfilingQuestion(opts: QuestionOpts): ProfileQuestion {
  const questionId = randomUUID();
  const embed = createEmbed(questionId, opts.questionText);
  // Generate default feedback if not provided
  const feedback =
    opts.feedback ||
    opts.answers.reduce((acc, _, i) => ({ ...acc, [i]: '' }), {});
  const allowMultiple = opts.allowMultiple ?? false;
  return {
    // Tailor Multiple Choice attributes
    // NOTE: Profiling questions have no correct answer
    id: opts.id || randomUUID(),
    type: allowMultiple ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
    question: [questionId],
    answers: opts.answers,
    correct: allowMultiple ? [] : null,
    feedback,
    hint: opts.hint || '',
    embeds: { [questionId]: embed },
    isGradable: false,
    // Profiling-specific fields
    allowMultiple,
    // Profiling category (interest, experience, goal, preference)
    category: opts.category,
    // Tags this question helps identify
    relatedTags: opts.relatedTags ?? [],
    // Per-answer tag weights for matching
    tagAffinities: opts.tagAffinities,
    // Importance in profile matching (0-1, default: 1)
    weight: opts.weight ?? 1,
  };
}
