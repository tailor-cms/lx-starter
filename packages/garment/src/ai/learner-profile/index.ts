/**
 * Learner Profile Module
 * Exports for profiling questions and learner-content matching
 */

// Main orchestrator
export { LearnerProfiler } from './LearnerProfiler';
export type { LearnerProfilerOptions } from './LearnerProfiler';

// Component classes (for advanced usage)
export { ProfileBuilder } from './survey-profiling/ProfileBuilder';
export type { ProfileBuildResult } from './survey-profiling/ProfileBuilder';
export { ProfileMatcher } from './ProfileMatcher';
export { ProfileUpdater } from './ProfileUpdater';

// Continue learning analysis
export { getContinueLearning } from './continue-learning';

// Survey generation
export {
  SurveyGenerator,
  type SurveyGeneratorOptions,
  type ProfileQuestion,
  type QuestionOpts,
  type CeEmbed as ProfileEmbed,
  type ResolvedSurveyAnswer,
  type SurveyQuestionResponse,
  createProfilingQuestion,
  getDefaultQuestions,
  buildQuestionPrompt,
  toSurveyResponse,
  fromSurveyResponse,
} from './survey-profiling/survey';

// Utilities
export { formatTagLabel } from './utils';

// Constants
export {
  DIFFICULTY_LEVELS,
  DIFFICULTY_MATCH_SCORES,
  SCORE_WEIGHTS,
  THRESHOLDS,
} from '../core-settings';
