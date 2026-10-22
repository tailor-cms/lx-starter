/**
 * Recommendation Types
 * Content matching and suggestions
 * Used by: ProfileMatcher
 */
import type { RelationshipType } from './taxonomies';
import type { Problem, Tag } from './content-metadata';

/**
 * Content recommendation for a learner
 * Repository matched to learner profile with relevance scoring
 */
export interface Recommendation {
  // Repository identifier
  id: string;
  // Repository name
  name: string;
  // Relevance score (0-100)
  // Higher scores indicate better match to learner profile
  // Typical range: 50-95 for good matches
  score: number;
  // Human-readable explanations for why this was recommended
  // Example: ["Matches your interest in React", "Appropriate for intermediate level"]
  reasons: string[];
  // Tags from content that matched learner's interests
  matchedTags: Tag[];
  // Problems from content that align with learner's goals
  matchedProblems: Problem[];
  // Optional suggested learning path leading to this content
  // Ordered sequence of prerequisite repositories
  learningPath?: Array<{ id: string; name: string }>;
}

/**
 * Related content suggestion
 * Content related to a given repository based on semantic relationships
 */
export interface RelatedContent {
  // Related repository identifier
  id: string;
  // Related repository name
  name: string;
  // Similarity/relevance score (0-100)
  score: number;
  // Human-readable explanation of the relationship
  // Example: "Builds on the concepts introduced in this content"
  reason: string;
  // Type of relationship between contents
  relationship: RelationshipType;
  // Tag names shared between the two repositories
  sharedTags: string[];
  // Problem IDs shared between the two repositories
  sharedProblems: string[];
  // Best matching section in the target repository
  // Useful for deep-linking to most relevant part
  sectionId?: string;
}

/**
 * Options for generating recommendations
 * Controls personalized content recommendation behavior
 */
export interface RecommendationOptions {
  // Maximum number of recommendations to return
  // Default: 10
  limit?: number;
  // Minimum relevance score threshold (0-100)
  // Recommendations below this score are filtered out
  // Default: 50
  minScore?: number;
  // Whether to include human-readable reasons
  // Default: true
  includeReasons?: boolean;
  // Whether to compute suggested learning paths
  // Computationally expensive, enable only when needed
  // Default: false
  includeLearningPath?: boolean;
}

/**
 * Options for related content
 * Controls content-to-content relationship discovery
 */
export interface RelatedContentOptions {
  // Maximum number of related items to return
  // Default: 5
  limit?: number;
  // Include prerequisite relationships
  // Default: true
  includePrerequisites?: boolean;
  // Include next-step/advancement relationships
  // Default: true
  includeNextSteps?: boolean;
  // Include similar/parallel content
  // Default: true
  includeSimilar?: boolean;
  // Minimum similarity threshold (0-1)
  // Default: 0.3
  minSimilarity?: number;
}

/**
 * Options for profile matching
 * Controls how learner profiles are matched against content
 */
export interface ProfileMatchOptions {
  // Whether to boost recently interacted content
  // Default: true
  boostRecent?: boolean;
  // Weight for recent interaction boost (0-1)
  // Higher values give more weight to recent activity
  // Default: 0.2
  recentBoostWeight?: number;
  // Time window in days for "recent" interactions
  // Default: 30
  recentDays?: number;
}
