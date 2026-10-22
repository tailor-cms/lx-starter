/**
 * Taxonomies and Classification Enums
 * Educational classification systems used throughout the AI module
 * Includes: Bloom's taxonomy, difficulty levels, content categories, etc.
 */

/**
 * Content difficulty level
 * Classifies content complexity for matching learner experience
 */
export type DifficultyLevel =
  // Entry-level content, no prerequisites assumed
  | 'beginner'
  // Requires basic familiarity with foundational concepts
  | 'intermediate'
  // Requires solid understanding and practical experience
  | 'advanced'
  // Mastery-level content for specialists
  | 'expert';

/**
 * Tag category
 * Organizes tags by their semantic role in content classification
 */
export type TagCategory =
  // Subject matter or domain (e.g., 'async-programming', 'databases')
  | 'topic'
  // Practical ability or technique (e.g., 'debugging', 'testing')
  | 'skill'
  // Theoretical principle or idea (e.g., 'encapsulation', 'immutability')
  | 'concept'
  // Business sector or application domain (e.g., 'fintech', 'healthcare')
  | 'industry'
  // Technology or framework (e.g., 'React', 'PostgreSQL')
  | 'tool'
  // Learning objective (e.g., 'career-advancement', 'certification')
  | 'goal';

/**
 * Affinity dimension - the 6 semantic dimensions for profiling
 * Used for multi-dimensional learner preference tracking
 */
export type AffinityDimension = TagCategory;

/**
 * Journey stage - learner engagement progression
 * From casual browsing to deep learning flow state
 */
export const JOURNEY_STAGES = [
  'browse', // First visits, weak engagement signals
  'explore', // Curious exploration, patterns emerging
  'targeted', // Clear profile, high-match content engagement
  'flow', // Maximum momentum, deep learning state
] as const;
export type JourneyStage = (typeof JOURNEY_STAGES)[number];

/**
 * Entry point - how user arrived at content
 */
export const ENTRY_POINTS = [
  'recommendation',
  'search',
  'browse',
  'direct',
  'pathway',
  'continue',
] as const;
export type EntryPoint = (typeof ENTRY_POINTS)[number];

/**
 * Activity action - what the user did with the content
 */
export const ACTIVITY_ACTIONS = ['view', 'complete', 'bookmark', 'skip'] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

/**
 * Affinity source - where the affinity preference came from
 */
export const AFFINITY_SOURCES = [
  'onboarding', // From onboarding survey
  'behavioral', // From behavioral interactions
  'explicit', // Explicitly stated by user
] as const;
export type AffinitySource = (typeof AFFINITY_SOURCES)[number];

/**
 * Update trigger - what caused the affinity update
 */
export const UPDATE_TRIGGERS = [
  'interaction', // User interacted with content
  'decay', // Time-based decay of unused affinities
  'explicit', // User explicitly changed preference
] as const;
export type UpdateTrigger = (typeof UPDATE_TRIGGERS)[number];

/**
 * Question category
 * Classifies profiling questions by their assessment purpose
 */
export type QuestionCategory =
  // What topics the learner is interested in
  | 'interest'
  // What experience level the learner has
  | 'experience'
  // What the learner wants to achieve
  | 'goal'
  // How the learner prefers to learn
  | 'preference';

/**
 * Bloom's taxonomy level
 * Cognitive complexity levels for learning objectives
 * Ordered from lowest to highest cognitive demand
 */
export type BloomLevel =
  // Recall facts and basic concepts
  | 'remember'
  // Explain ideas or concepts
  | 'understand'
  // Use information in new situations
  | 'apply'
  // Draw connections among ideas
  | 'analyze'
  // Justify a decision or course of action
  | 'evaluate'
  // Produce new or original work
  | 'create';

/**
 * Content node types
 * Hierarchy levels in content structure
 */
export const CONTENT_NODE_TYPES = [
  'repository', // Top-level learning module
  'activity', // Lesson or section within a repository
  'container', // Grouping of activities (e.g., chapter, module)
  'element', // Individual content piece (e.g., text block, image, exercise)
] as const;
export type ContentNodeType = (typeof CONTENT_NODE_TYPES)[number];

/**
 * Device types for analytics
 */
export const DEVICE_TYPES = ['desktop', 'tablet', 'mobile'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

/**
 * Relationship types
 * Semantic relationships between content items for recommendations
 */
export const RELATIONSHIP_TYPES = [
  'prerequisite', // Required background knowledge
  'next-level', // Next logical progression in difficulty
  'similar-topic', // Covers related topics
  'alternative-approach', // Different approach to same problem
  'complement', // Works well together, enhances understanding
  'builds-on', // Extends or builds upon concepts
  'similar-problems', // Addresses similar problem types
  'alternative', // Alternative content covering same material
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/**
 * Step status
 * Progress tracking for learning path steps
 */
export type StepStatus =
  // Not yet started
  | 'pending'
  // Currently being worked on
  | 'in_progress'
  // Successfully finished
  | 'completed'
  // Intentionally skipped by learner
  | 'skipped';
