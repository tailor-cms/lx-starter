// Learner Profile Types
// Profile building, tracking, and updates
// Used by: ProfileBuilder, ProfileMatcher, ProfileUpdater
import type {
  DimensionalAffinities,
  EngagementMetrics,
  VisitEntry,
} from './activity-tracking';
import type {
  ActivityAction,
  ContentNodeType,
  DifficultyLevel,
  UpdateTrigger,
} from './taxonomies';

// Learner profile containing preferences and history
// Tracks learner interests, goals, and interaction patterns for personalized
// recommendations
export interface LearnerProfile {
  // Unique learner identifier
  id: string;
  // Survey question answers
  // Maps question ID to array of selected answer indexes
  // Example: { 'q1': [0, 2], 'q2': [1] } for multi-select questions
  answers: Record<string, number[]>;

  // ============================================================================
  // AFFINITIES (6D)
  // ============================================================================
  // 6-dimensional affinity scores organized by dimension
  // Populated from: onboarding survey (sources.onboarding) + activity (sources.behavioral)
  // See AffinityScore for value/confidence/sources structure
  affinities: DimensionalAffinities;

  // ============================================================================
  // PREFERENCES
  // ============================================================================
  // Learner's experience/difficulty level
  // Derived from survey or inferred from behavior
  experienceLevel?: DifficultyLevel;
  // Explicit learning goals provided by learner
  // Example: ['learn async programming', 'build REST APIs']
  goals: string[];

  // ============================================================================
  // BEHAVIORAL TRACKING
  // ============================================================================
  // Recently interacted content tags (most recent first)
  // Used to boost relevance of recent interests in recommendations
  recentTags: string[];
  // Full visit history with context (max MAX_VISIT_HISTORY entries, newest first)
  visitHistory?: VisitEntry[];
  // Engagement metrics and journey progression
  engagement?: EngagementMetrics;

  // ============================================================================
  // TIMESTAMPS
  // ============================================================================
  createdAt: Date;
  updatedAt: Date;
}

// Navigation event for tracking
// User interaction event captured during content browsing
export interface NavigationEvent {
  // Repository ID (optional for cross-content navigation)
  repositoryId?: string;
  // Content node identifier being accessed
  nodeId: string;
  // Type of interaction: view, complete, bookmark, or skip
  action: ActivityAction;
  // When the event occurred
  timestamp: Date;
  // Time spent on content in milliseconds
  // Measures engagement depth
  duration?: number;
}

// Interest update from interaction
// Tracks changes to learner's tag affinity scores over time
export interface InterestUpdate {
  // Tag whose affinity score changed
  tag: string;
  // Previous affinity score (0-1)
  oldValue: number;
  // New affinity score (0-1)
  newValue: number;
  // Change amount (newValue - oldValue)
  delta: number;
  // What triggered the update
  source: UpdateTrigger;
  // Optional explanation
  // Example: "Completed beginner React tutorial"
  reason?: string;
}

// Information about a content node for profile updates
// Minimal metadata needed to update profile from navigation events
export interface ContentNodeInfo {
  // Repository containing the node
  repositoryId: string;
  // Type of content node
  nodeType: ContentNodeType;
  // Tags associated with this specific node
  // Used for targeted affinity updates
  nodeTags?: string[];
}

// Function to resolve content node ID to node info
// Callback provided to profile updater for fetching node metadata
export type NodeResolver = (nodeId: string) => ContentNodeInfo | undefined;

// Survey generator options
// Controls generation of profiling surveys for learner assessment
export interface SurveyGeneratorOptions {
  // Maximum number of questions to generate in the survey
  // Default: 10
  maxQuestions?: number;
  // Specific question categories to include
  // Example: ['topics', 'difficulty', 'learning-style']
  // Default: all available categories
  questionCategories?: string[];
  // Minimum number of options per question
  // Default: 2
  minOptionsPerQuestion?: number;
  // Maximum number of options per question
  // Default: 4
  maxOptionsPerQuestion?: number;
  // Minimum tag frequency to include in questions
  // Tags appearing less than this threshold are excluded
  // Default: 1
  minTagFrequency?: number;
  // Whether to include a learning goals question
  // Default: true
  includeGoalQuestion?: boolean;
  // Whether to include a prior experience question
  // Default: true
  includeExperienceQuestion?: boolean;
}

// Profile update options
// Controls how learner profiles are updated based on navigation and interactions
export interface ProfileUpdateOptions {
  // Whether to track difficulty progression over time
  // When enabled, adjusts difficulty preferences based on content consumed
  // Default: true
  trackDifficulty?: boolean;
  // Maximum number of recent tags to track in the profile
  // Keeps profile size bounded while maintaining recent interest signals
  // Default: 50
  maxRecentTags?: number;
  // Function to resolve content node details from repository UID
  // Required for tracking consumed content with full metadata
  // Signature: (uid: string) => Promise<ContentNodeInfo | null>
  nodeResolver?: NodeResolver;
}

// =============================================================================
// CONTINUE LEARNING
// =============================================================================

// Options for getContinueLearning query
export interface ContinueLearningOptions {
  // Maximum number of items to return (default: 5)
  limit?: number;
  // Include completed repositories (default: false)
  includeCompleted?: boolean;
}

// A content item the learner should continue
// Aggregates visit data per repository to show resume points
export interface ContinueLearningItem {
  // Repository/course identifier
  repositoryId: string;
  // Most recent content node visited within repository
  nodeId: string;
  // Type of content node
  nodeType: ContentNodeType;

  // Content metadata (from visit snapshot)
  // Content title
  title: string;
  // Thumbnail image URL
  thumbnail?: string;
  // Content difficulty
  difficulty: DifficultyLevel;
  // Content tags for display
  tags: string[];

  // Activity data (aggregated across visits)
  // Last action performed (view, bookmark, etc.)
  lastAction: ActivityAction;
  // When this content was last visited
  lastVisitedAt: Date;
  // Total time spent across all visits (milliseconds)
  totalTimeSpent: number;
  // Progress percentage (0-100): 100 if completed, else max scroll depth
  progress: number;
}

// Result of getContinueLearning query
export interface ContinueLearningResult {
  // Content items to continue, sorted by most recently visited
  items: ContinueLearningItem[];
  // Number of items returned
  count: number;
  // When this result was generated
  generatedAt: Date;
}
