/**
 * Garment AI Module
 * AI-powered content analysis, tagging, and learner recommendations
 */

// Core classes
export { ContentExtractor } from './content-analysis/ContentExtractor';
export { MetadataGenerator } from './content-analysis/MetadataGenerator';

// Content Analysis module
export { ContentAnalyzer } from './content-analysis';

// Learner Profile module
export {
  LearnerProfiler,
  ProfileBuilder,
  ProfileMatcher,
  ProfileUpdater,
  SurveyGenerator,
  createProfilingQuestion,
  getDefaultQuestions,
  formatTagLabel,
  toSurveyResponse,
  fromSurveyResponse,
  getContinueLearning,
  DIFFICULTY_LEVELS,
  SCORE_WEIGHTS,
  THRESHOLDS,
} from './learner-profile';

export type {
  ProfileEmbed,
  ProfileQuestion,
  QuestionOpts,
  SurveyQuestionResponse,
} from './learner-profile';

// AI Providers
export { BaseAIProvider, OpenAIProvider } from './providers';

// Types
export type {
  // ============================================================================
  // CORE TYPES
  // ============================================================================

  ActivityAction,
  DifficultyLevel,
  DeviceType,
  BloomLevel,
  EntryPoint,
  TagCategory,
  QuestionCategory,
  RelationshipType,
  ContentNodeType,

  // ============================================================================
  // LLM PROVIDERS
  // ============================================================================

  AIProvider,
  AIProviderConfig,
  CompletionOptions,

  // ============================================================================
  // CONTENT ANALYSIS
  // ============================================================================

  // Extraction
  ExtractedElement,
  ExtractedSection,
  ExtractedRepository,
  ContentChunk,
  ContentExtractorOptions,

  // Metadata generation
  Problem,
  Tag,
  LearningOutcome,
  Prerequisite,
  ContentMeta,
  MetadataGeneratorOptions,

  // Analysis results
  AggregatedContentAnalysis,
  BatchRepositoryAnalysis,

  // ============================================================================
  // LEARNER PROFILE
  // ============================================================================

  // Profile data
  LearnerProfile,
  ContentNodeInfo,
  NodeResolver,

  // Profile management
  NavigationEvent,
  InterestUpdate,
  ProfileUpdateOptions,

  // Survey generation
  SurveyGeneratorOptions,

  // Continue learning
  ContinueLearningOptions,
  ContinueLearningItem,
  ContinueLearningResult,

  // ============================================================================
  // RECOMMENDATIONS & MATCHING
  // ============================================================================

  Recommendation,
  RecommendationOptions,
  ProfileMatchOptions,
  RelatedContent,
  RelatedContentOptions,

  // ============================================================================
  // ACTIVITY TRACKING
  // ============================================================================

  AffinityChange,
  AffinityScore,
  ContentProgressEntry,
  ContentProgressType,
  DeviceInfo,
  DimensionalAffinities,
  EngagementMetrics,
  QuizProgressData,
  VisitContext,
  VisitEngagement,
  VisitEntry,

  // ============================================================================
  // PERSISTENCE & SERIALIZATION
  // ============================================================================

  AIMetadataBundle,
  SerializedContentMeta,
  SerializedLearnerProfile,
  SerializedAffinityScore,
  SerializedDimensionalAffinities,
  SerializedEngagementMetrics,
  SerializedVisitEntry,

  // ============================================================================
  // LEARNING GOALS
  // ============================================================================

  LearningGoalType,
  LearningGoalsQuery,
  LearningGoalItem,
  AggregatedLearningGoal,
  LearningGoalsResult,
  SectionNode,
} from './types';

// Constants
export {
  ACTIVITY_ACTIONS,
  CONTENT_NODE_TYPES,
  DEVICE_TYPES,
  ENTRY_POINTS,
  JOURNEY_STAGES,
  RELATIONSHIP_TYPES,
} from './types';
