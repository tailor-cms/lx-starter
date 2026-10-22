/**
 * Learning Goals Types
 * Types for problems and learning outcomes retrieval
 * Used by: Repository, TailorContent, TailorContentView
 */
import type { DifficultyLevel } from './taxonomies';

/**
 * Learning goal type discriminator
 */
export type LearningGoalType = 'problem' | 'outcome';

/**
 * Query options for learning goals retrieval
 */
export interface LearningGoalsQuery {
  /** Filter by type (problem or outcome) */
  type?: LearningGoalType;
  /** Case-insensitive search on title/description */
  query?: string;
  /** Maximum number of results to return */
  limit?: number;
}

/**
 * Learning goal item returned by Repository
 * Includes repository context since Repository knows its own identity
 */
export interface LearningGoalItem {
  /** Unique identifier */
  id: string;
  /** Type discriminator */
  type: LearningGoalType;
  /** Title (problem.title or outcome.description) */
  title: string;
  /** Description (problem.description, undefined for outcomes) */
  description?: string;
  /** Category (problem.category or outcome.bloomLevel) */
  category?: string;
  /** Difficulty level (problems only) */
  difficulty?: DifficultyLevel;
  /** Required skills (problems only) */
  requiredSkills?: string[];
  /** Activity UIDs where this goal is addressed */
  sectionIds?: string[];
  /** Repository UID */
  repositoryId: string;
  /** Repository name for display */
  repositoryName: string;
}

/**
 * Resolved section node information
 */
export interface SectionNode {
  /** Section ID (uid) */
  id: string;
  /** Schema type (e.g., 'module', 'lesson', 'page') */
  type: string;
  /** Entity type (e.g., 'Activity', 'Repository') */
  entity: string;
  /** Section name */
  name?: string;
  /** Parent section (e.g., module containing a lesson) */
  parent?: SectionNode;
}

/**
 * Learning goal with navigation context
 * Used for cross-repository queries with section resolution
 */
export interface AggregatedLearningGoal extends LearningGoalItem {
  /** Resolved section nodes for navigation (all sectionIds resolved) */
  sections?: SectionNode[];
}

/**
 * Result from aggregated learning goals query
 */
export interface LearningGoalsResult {
  /** Learning goal items */
  items: AggregatedLearningGoal[];
  /** Total problems count (before filtering) */
  totalProblems: number;
  /** Total outcomes count (before filtering) */
  totalOutcomes: number;
}
