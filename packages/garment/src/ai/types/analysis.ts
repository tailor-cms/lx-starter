/**
 * Analysis Types
 * Content analysis and batch processing results
 * Used by: ContentAnalyzer, RecommendationEngine
 */
import type { DifficultyLevel, TagCategory } from './taxonomies';
import type { ContentMeta } from './content-metadata';

/**
 * Batch repository analysis
 * Generated when multiple repositories are analyzed in a single operation
 * Provides aggregate statistics and error tracking
 */
export interface BatchRepositoryAnalysis {
  // Individual analysis results for each successfully processed repository
  // Empty map if all analyses failed
  // Key: repository ID, Value: ContentMeta with optional processingTime
  results: Map<string, ContentMeta>;
  // Total time spent processing all repositories in milliseconds
  // Includes both successful and failed attempts
  totalProcessingTime: number;
  // Number of repositories that were successfully analyzed
  // successCount === results.size
  successCount: number;
  // Number of repositories that failed during analysis
  // errorCount === errors.length
  errorCount: number;
  // Detailed error information for failed analyses
  // Each entry contains the repository ID and error message
  // Example: [{ id: 'repo-123', error: 'API timeout after 30s' }]
  errors: Array<{ id: string; error: string }>;
}

/**
 * Aggregated content analysis
 * Statistical analysis of content across a collection of repositories
 * Used to identify patterns and distributions for learner profiling
 */
export interface AggregatedContentAnalysis {
  // Repository UIDs included in this analysis
  // Example: ['repo-123', 'repo-456', 'repo-789']
  repositoryIds: string[];
  // Frequency map of all tags found in the content
  // Example: { 'algebra': 45, 'calculus': 23, 'geometry': 12 }
  // Higher numbers indicate more content with that tag
  tagDistribution: Record<string, number>;
  // Distribution of content across pedagogical categories
  // Categories: 'topic', 'skill', 'concept', 'industry', 'tool'
  // Example: { 'topic': 30, 'skill': 25, 'concept': 20, 'industry': 5, 'tool': 10 }
  categoryDistribution: Record<TagCategory, number>;
  // Distribution of content across difficulty levels
  // Levels: 'beginner', 'intermediate', 'advanced', 'expert'
  // Example: { 'beginner': 40, 'intermediate': 35, 'advanced': 20, 'expert': 5 }
  difficultyDistribution: Record<DifficultyLevel, number>;
  // Reserved for future use - may contain generated profiling questions
  // Currently unused, kept for API stability
  questions?: unknown[];
}
