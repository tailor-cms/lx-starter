/**
 * Persistence Types
 * Serialization for storage
 * Used by: ProfileBuilder
 */
import type {
  SerializedDimensionalAffinities,
  SerializedEngagementMetrics,
  SerializedVisitEntry,
} from './activity-tracking';
import type { ContentMeta } from './content-metadata';
import type { LearnerProfile } from './learner-profile';
import type {
  ProfileQuestion,
} from '../learner-profile/survey-profiling/survey/create-multiple-choice';

/**
 * Serialized learner profile for persistence
 * JSON-safe version with all Dates converted to ISO strings
 */
export interface SerializedLearnerProfile
  extends Omit<
    LearnerProfile,
    | 'createdAt'
    | 'updatedAt'
    | 'affinities'
    | 'visitHistory'
    | 'engagement'
  > {
  // Profile creation timestamp as ISO string
  createdAt: string;
  // Last update timestamp as ISO string
  updatedAt: string;
  // Activity tracking
  affinities?: SerializedDimensionalAffinities;
  visitHistory?: SerializedVisitEntry[];
  engagement?: SerializedEngagementMetrics;
}

/**
 * Serialized content metadata
 * JSON-safe version with Date converted to ISO string
 */
export interface SerializedContentMeta
  extends Omit<ContentMeta, 'generatedAt'> {
  // Metadata generation timestamp as ISO string
  generatedAt: string;
}

/**
 * AI metadata bundle for persistence
 * Complete snapshot of all AI-generated content for bulk export/import
 */
export interface AIMetadataBundle {
  // Bundle format version for compatibility checking
  // Example: "1.0.0"
  version: string;
  // When this bundle was generated (ISO string)
  generatedAt: string;
  // LLM model version used for generation
  // Example: "gpt-4-1106-preview"
  modelVersion: string;
  // All repository metadata indexed by repository ID
  // Note: Contains ContentMeta with Date objects, not serialized
  repositories: Record<string, ContentMeta>;
  // Generated profiling questions for surveys
  profileQuestions: ProfileQuestion[];
}
