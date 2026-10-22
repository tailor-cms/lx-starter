/**
 * Constants for learner profiling
 */
import type { DifficultyLevel } from './types';

// Difficulty levels in order
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
];

// Score weights for matching
export const SCORE_WEIGHTS = {
  tagAffinity: 0.6,
  difficulty: 0.4,
};

// Thresholds for filtering and matching
export const THRESHOLDS = {
  // Minimum affinity to consider a tag match
  tagMatch: 0.3,
  // Number of top tags to keep in analysis
  topTags: 30,
};

// Difficulty match scores based on level difference
// Index = number of levels apart (0 = perfect match, 3 = worst)
export const DIFFICULTY_MATCH_SCORES = [1.0, 0.7, 0.3, 0.0];
