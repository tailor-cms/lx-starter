/**
 * AI Types
 * Centralized export point for all AI module types
 *
 * Types are organized into logical files:
 * - taxonomies: Classification systems and enums (Bloom's taxonomy, difficulty, etc.)
 * - content-metadata: AI-generated metadata
 * - content-extraction: Text extraction from repositories
 * - learner-profile: Profile management
 * - recommendations: Content matching
 * - ai-provider: Provider abstraction
 * - analysis: Processing results
 * - persistence: Serialization
 */

// Taxonomies and classification enums
export type {
  ActivityAction,
  AffinityDimension,
  AffinitySource,
  BloomLevel,
  ContentNodeType,
  DeviceType,
  DifficultyLevel,
  EntryPoint,
  JourneyStage,
  QuestionCategory,
  RelationshipType,
  TagCategory,
  UpdateTrigger,
} from './taxonomies';

export {
  ACTIVITY_ACTIONS,
  AFFINITY_SOURCES,
  CONTENT_NODE_TYPES,
  DEVICE_TYPES,
  ENTRY_POINTS,
  JOURNEY_STAGES,
  RELATIONSHIP_TYPES,
  UPDATE_TRIGGERS,
} from './taxonomies';

// Activity tracking
export type {
  ActivityEventInput,
  AffinityChange,
  AffinityScore,
  AffinitySources,
  ContentProgressEntry,
  ContentProgressType,
  DeviceInfo,
  DimensionalAffinities,
  EngagementMetrics,
  QuizProgressData,
  SerializedAffinityScore,
  SerializedDimensionalAffinities,
  SerializedEngagementMetrics,
  SerializedVisitEntry,
  VisitContentMeta,
  VisitContext,
  VisitEngagement,
  VisitEntry,
} from './activity-tracking';

export {
  AFFINITY_DIMENSIONS,
  DIMENSION_WEIGHTS,
  JOURNEY_THRESHOLDS,
  MAX_VISIT_HISTORY,
} from './activity-tracking';

// Content metadata
export type {
  ContentMeta,
  LearningOutcome,
  MetadataGeneratorOptions,
  Prerequisite,
  Problem,
  Tag,
} from './content-metadata';

// Content extraction
export type {
  ContentChunk,
  ContentExtractorOptions,
  ExtractedElement,
  ExtractedRepository,
  ExtractedSection,
} from './content-extraction';

// Learner profiles
export type {
  ContentNodeInfo,
  ContinueLearningItem,
  ContinueLearningOptions,
  ContinueLearningResult,
  InterestUpdate,
  LearnerProfile,
  NavigationEvent,
  NodeResolver,
  ProfileUpdateOptions,
  SurveyGeneratorOptions,
} from './learner-profile';

// Profile questions (re-exported for internal use by AI modules)
export type {
  ProfileQuestion,
} from '../learner-profile/survey-profiling/survey/create-multiple-choice';

// Recommendations
export type {
  ProfileMatchOptions,
  Recommendation,
  RecommendationOptions,
  RelatedContent,
  RelatedContentOptions,
} from './recommendations';

// AI Provider
export type {
  AIProvider,
  AIProviderConfig,
  CompletionOptions,
} from './ai-provider';

// Analysis
export type {
  AggregatedContentAnalysis,
  BatchRepositoryAnalysis,
} from './analysis';

// Persistence
export type {
  AIMetadataBundle,
  SerializedContentMeta,
  SerializedLearnerProfile,
} from './persistence';

// Learning Goals
export type {
  AggregatedLearningGoal,
  LearningGoalItem,
  LearningGoalsQuery,
  LearningGoalsResult,
  LearningGoalType,
  SectionNode,
} from './learning-goals';
