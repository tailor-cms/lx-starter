/**
 * Survey Generation Module
 * Components for generating and managing learner profiling surveys
 */

// Main generator
export {
  SurveyGenerator,
  type SurveyGeneratorOptions,
  DEFAULT_OPTS,
} from './SurveyGenerator';

// Types
export type {
  CeEmbed,
  ProfileQuestion,
  QuestionOpts,
  ResolvedSurveyAnswer,
  SurveyQuestionResponse,
} from './create-multiple-choice';

// Utilities
export {
  createProfilingQuestion,
  toSurveyResponse,
  fromSurveyResponse,
} from './create-multiple-choice';
export { getDefaultQuestions } from './survey-default';
export { buildQuestionPrompt, PROMPT } from './survey-creation-prompt';
