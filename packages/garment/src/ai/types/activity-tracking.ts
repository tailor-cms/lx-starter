/**
 * Activity Tracking Types
 * Visit history, engagement metrics, and dimensional affinities
 * Used by: ProfileUpdater, LearningService, Frontend composables
 */
import type {
  ActivityAction,
  AffinityDimension,
  AffinitySource,
  BloomLevel,
  ContentNodeType,
  DeviceType,
  DifficultyLevel,
  EntryPoint,
  JourneyStage,
} from './taxonomies';

// Record type keyed by AffinitySource
export type AffinitySources = Record<AffinitySource, number>;

// =============================================================================
// AFFINITY SYSTEM
// =============================================================================

// Affinity score with confidence and source tracking
// Enables understanding of where preferences come from
export interface AffinityScore {
  // Normalized score 0-1
  value: number;
  // Confidence based on interaction count (0-1)
  confidence: number;
  // Contribution breakdown by source (onboarding, behavioral, explicit)
  sources: AffinitySources;
  // Last time this affinity was updated
  lastUpdated: Date;
  // Number of interactions affecting this affinity
  interactionCount: number;
}

// Simple affinity score for serialization (no Date objects)
export interface SerializedAffinityScore
  extends Omit<AffinityScore, 'lastUpdated'> {
  lastUpdated: string;
}

// 6-dimensional affinity structure
// Each dimension maps tag names to affinity scores
export type DimensionalAffinities = {
  [K in AffinityDimension]: Record<string, AffinityScore>;
};

export type SerializedDimensionalAffinities = {
  [K in AffinityDimension]: Record<string, SerializedAffinityScore>;
};

// Affinity change record for tracking updates
export interface AffinityChange {
  dimension: AffinityDimension;
  tag: string;
  oldValue: number;
  newValue: number;
  delta: number;
}

// =============================================================================
// ENGAGEMENT METRICS
// =============================================================================

// Real-time engagement tracking
// Measures learning momentum and progression
export interface EngagementMetrics {
  // Current engagement momentum (0-100)
  velocity: number;
  // Current learning journey stage
  journeyStage: JourneyStage;
  // Total number of interactions recorded
  totalInteractions: number;
  // Total time spent learning (milliseconds)
  totalTimeSpent: number;
  // Consecutive active days
  streakDays: number;
  // Last activity timestamp
  lastActiveAt: Date;
}

export interface SerializedEngagementMetrics
  extends Omit<EngagementMetrics, 'lastActiveAt'> {
  lastActiveAt: string;
}

// =============================================================================
// VISIT ENTRY & CONTEXT
// =============================================================================

// Content metadata at time of visit
// Captures content metadata for historical accuracy
export interface VisitContentMeta {
  title: string;
  thumbnail?: string;
  difficulty: DifficultyLevel;
  tags: string[];
  bloomLevel?: BloomLevel;
}

// Navigation context for a visit
// Tracks how user arrived and session info
export interface VisitContext {
  // Where user came from
  referrer?: string;
  // How user arrived at content
  entryPoint: EntryPoint;
  // Session identifier for grouping visits
  sessionId: string;
  // Order within session
  sequenceNumber: number;
  // Learning path context if applicable
  learningPathId?: string;
}

// Content progress type identifier
// Accepts any string - element types come from Tailor CMS registry
// Common types: TIPTAP_HTML, MUX_VIDEO, PDF, IMAGE, FILE, MULTIPLE_CHOICE,
// SINGLE_CHOICE
export type ContentProgressType = string;

export interface ContentProgressEntry {
  // Unique element identifier
  elementId: string;
  // Content type identifier
  type: ContentProgressType;
  // Progress percentage (0-100) for media types
  percent?: number;
  // Additional type-specific data
  data?: Record<string, unknown>;
}

// Quiz-specific progress data
// Stored in ContentProgressEntry.data for type='quiz'
export interface QuizProgressData {
  // Number of answer attempts
  attempts: number;
  // Whether the answer was correct
  correct?: boolean;
  // Score percentage if applicable (0-100)
  score?: number;
  // Selected answer(s)
  selected?: string[];
}

// Engagement signals captured during visit
export interface VisitEngagement {
  // Percentage of content scrolled (0-100)
  scrollDepth: number;
  // Number of interactions during visit
  interactionCount: number;
  // Per-element progress tracking (video %, quiz results, viewed status)
  contentProgress?: ContentProgressEntry[];
}

// Device information for analytics
export interface DeviceInfo {
  type: DeviceType;
  os?: string;
  browser?: string;
}

// Complete visit entry with full context
// Stored in visitHistory array (max MAX_VISIT_HISTORY)
export interface VisitEntry {
  // Unique visit identifier
  id: string;
  // Content node UID
  nodeId: string;
  // Parent repository UID
  repositoryId: string;
  // Type of content accessed
  nodeType: ContentNodeType;
  // Action performed
  action: ActivityAction;
  // When visit occurred
  timestamp: Date;
  // Time spent in milliseconds
  duration: number | null;
  // Content metadata at time of visit
  content: VisitContentMeta;
  // Navigation context
  context: VisitContext;
  // Engagement signals
  engagement: VisitEngagement;
  // Device info
  device: DeviceInfo;
  // Affinity changes resulting from this visit
  affinityChanges: AffinityChange[];
}

export interface SerializedVisitEntry extends Omit<VisitEntry, 'timestamp'> {
  timestamp: string;
}

// =============================================================================
// ACTIVITY EVENT (INPUT)
// =============================================================================

// Activity event input from frontend
// Minimal required data for recording an activity
export interface ActivityEventInput {
  nodeId: string;
  action: ActivityAction;
  duration?: number;
  context?: Partial<VisitContext>;
  engagement?: Partial<VisitEngagement>;
  device?: Partial<DeviceInfo>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// All 6 affinity dimensions
export const AFFINITY_DIMENSIONS: AffinityDimension[] = [
  'topic',
  'skill',
  'concept',
  'industry',
  'tool',
  'goal',
];

// Maximum visits to store in history
export const MAX_VISIT_HISTORY = 100;

// Dimension weights for scoring
export const DIMENSION_WEIGHTS: Record<AffinityDimension, number> = {
  topic: 1.0,
  skill: 1.0,
  tool: 1.0,
  concept: 0.8,
  goal: 0.8,
  industry: 0.7,
};

// Journey stage thresholds
export const JOURNEY_THRESHOLDS = {
  flow: { velocity: 90, matchQuality: 95 },
  targeted: { velocity: 70, matchQuality: 85 },
  explore: { interactions: 10, velocity: 40 },
} as const;
