import type { AIProvider, AggregatedContentAnalysis } from '../../../types';
import {
  createProfilingQuestion,
  type ProfileQuestion,
  type QuestionOpts,
} from './create-multiple-choice';

import { buildQuestionPrompt } from './survey-creation-prompt';
import { getDefaultQuestions } from './survey-default';
import { type GarmentLogger, defaultLogger } from '../../../../garment/logger';

export type { ProfileQuestion };

/**
 * Configuration options for SurveyGenerator
 * Controls how profiling questions are generated from content analysis.
 * Questions are used to build learner profiles for content recommendations.
 */
export interface SurveyGeneratorOptions {
  // Maximum number of profiling questions to generate (default: 5)
  maxQuestions?: number;
  // Categories of questions to include
  // default: ['interest', 'experience', 'goal', 'preference']
  questionCategories?: string[];
  // Minimum number of answer options per question (default: 3)
  minOptionsPerQuestion?: number;
  // Maximum number of answer options per question (default: 5)
  maxOptionsPerQuestion?: number;
  // Minimum frequency a tag must appear across content to be included in
  // generated questions (default: 3)
  minTagFrequency?: number;
  // Whether to include a question about learning goals (default: true)
  includeGoalQuestion?: boolean;
  // Whether to include a question about experience level (default: true)
  includeExperienceQuestion?: boolean;
}

// Default question generation settings
export const DEFAULT_OPTS = {
  maxQuestions: 5,
  minOptionsPerQuestion: 3,
  maxOptionsPerQuestion: 5,
  questionCategories: ['interest', 'experience', 'goal', 'preference'],
  includeGoalQuestion: true,
  includeExperienceQuestion: true,
  minTagFrequency: 3,
};

export class SurveyGenerator {
  private options: Required<SurveyGeneratorOptions>;
  private aiProvider?: AIProvider;
  private logger: GarmentLogger;

  constructor(
    aiProvider: AIProvider,
    opts?: SurveyGeneratorOptions,
    logger?: GarmentLogger,
  ) {
    this.aiProvider = aiProvider;
    this.logger = (logger || defaultLogger).scoped('SurveyGenerator');
    this.options = {
      ...DEFAULT_OPTS,
      ...opts,
    };
  }

  /**
   * Generate profiling questions based on content analysis
   */
  async generate(analysis: AggregatedContentAnalysis): Promise<ProfileQuestion[]> {
    if (!this.aiProvider) {
      throw new Error('AI provider required for question generation');
    }

    const prompt = buildQuestionPrompt(
      this.options.maxQuestions,
      analysis.tagDistribution,
      analysis.categoryDistribution,
      analysis.difficultyDistribution,
    );

    try {
      if (!this.aiProvider.generateStructured) {
        throw new Error('AI provider does not support structured generation');
      }
      const result = await this.aiProvider.generateStructured<{
        questions: QuestionOpts[];
      }>(prompt, { temperature: 0.4 });
      // Convert AI response to Tailor MC format
      const questions = (result.questions || []).map((q) =>
        createProfilingQuestion(q),
      );
      const validated = this.validate(questions);
      if (validated.length === 0 && questions.length > 0) {
        const msg = `All generated questions failed validation`;
        this.logger.warn(msg);
      }
      return validated;
    } catch (error) {
      this.logger.warn(
        `AI question generation failed, using defaults` +
          `${error instanceof Error ? error.message : error}`,
      );
      return this.getDefaults(analysis);
    }
  }

  /**
   * Get default questions as fallback
   */
  getDefaults(analysis: AggregatedContentAnalysis): ProfileQuestion[] {
    const topTags = Object.keys(analysis.tagDistribution).slice(0, 10);
    return getDefaultQuestions(topTags);
  }

  /**
   * Validate and normalize generated questions
   */
  private validate(questions: ProfileQuestion[]): ProfileQuestion[] {
    return questions
      .filter((q) => {
        return (
          q.id &&
          q.type &&
          q.question?.length > 0 &&
          q.answers?.length >= this.options.minOptionsPerQuestion &&
          q.category &&
          Array.isArray(q.tagAffinities)
        );
      })
      .map((q) => ({
        ...q,
        answers: q.answers.slice(0, this.options.maxOptionsPerQuestion),
        tagAffinities: q.tagAffinities.slice(
          0,
          this.options.maxOptionsPerQuestion,
        ),
        relatedTags: q.relatedTags ?? [],
        weight: q.weight ?? 1,
      }));
  }
}
