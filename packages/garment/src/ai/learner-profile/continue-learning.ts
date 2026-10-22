// Continue Learning
// Analyzes visit history to find content the learner should continue
//
// This is a pure function that operates on the learner profile's visit history.
// It aggregates visits by repository to determine:
// - Which content has been started but not completed
// - Where the learner left off (most recent node)
// - Total engagement time per repository
// - Progress based on max scroll depth achieved
import type {
  ContentNodeType,
  ContinueLearningItem,
  ContinueLearningOptions,
  ContinueLearningResult,
  LearnerProfile,
} from '../types';
import type { VisitEntry } from '../types/activity-tracking';

// Aggregated visit data per repository
interface RepositoryVisitData {
  repositoryId: string;
  nodeId: string;
  nodeType: ContentNodeType;
  lastVisit: VisitEntry;
  totalTimeSpent: number;
  maxScrollDepth: number;
  hasCompleted: boolean;
}

// Get timestamp from visit entry (handles both Date and string)
function getTimestamp(timestamp: Date | string): number {
  return timestamp instanceof Date
    ? timestamp.getTime()
    : new Date(timestamp).getTime();
}

// Get content to continue learning
//
// Analyzes the learner's visit history to find repositories they've started
// but not completed. Returns items sorted by most recently visited.
//
// Algorithm:
// 1. Groups all visits by repositoryId
// 2. For each repository, aggregates:
//    - totalTimeSpent: sum of all visit durations
//    - maxScrollDepth: highest scroll depth achieved
//    - hasCompleted: true if any visit has action='complete'
//    - lastVisit: most recent visit entry
// 3. Filters out completed repositories (unless includeCompleted=true)
// 4. Sorts by last visit timestamp (most recent first)
// 5. Returns top N items based on limit
//
// Example:
//   const result = getContinueLearning(profile, { limit: 5 });
//   Returns up to 5 incomplete repositories, most recently visited first
//
//   const result = getContinueLearning(profile, { includeCompleted: true });
//   Includes completed repositories (useful for "review" functionality)
export function getContinueLearning(
  profile: LearnerProfile,
  options?: ContinueLearningOptions,
): ContinueLearningResult {
  const limit = options?.limit ?? 5;
  const includeCompleted = options?.includeCompleted ?? false;

  // If no visit history, return empty result
  if (!profile.visitHistory || profile.visitHistory.length === 0) {
    return {
      items: [],
      count: 0,
      generatedAt: new Date(),
    };
  }

  // Group visits by repositoryId to aggregate metrics
  const repositoryVisits = new Map<string, RepositoryVisitData>();
  for (const visit of profile.visitHistory) {
    const existing = repositoryVisits.get(visit.repositoryId);
    if (!existing) {
      // First visit for this repository
      // Repository is only completed when there's a 'complete' action at repository level
      // (not activity/element level completions)
      const isRepoCompletion =
        visit.action === 'complete' && visit.nodeType === 'repository';
      repositoryVisits.set(visit.repositoryId, {
        repositoryId: visit.repositoryId,
        nodeId: visit.nodeId,
        nodeType: visit.nodeType,
        lastVisit: visit,
        totalTimeSpent: visit.duration || 0,
        maxScrollDepth: visit.engagement?.scrollDepth || 0,
        hasCompleted: isRepoCompletion,
      });
    } else {
      // Aggregate with existing visits
      existing.totalTimeSpent += visit.duration || 0;
      // Track max scroll depth
      const scrollDepth = visit.engagement?.scrollDepth || 0;
      if (scrollDepth > existing.maxScrollDepth) {
        existing.maxScrollDepth = scrollDepth;
      }
      // Mark completed only for repository-level completions
      if (visit.action === 'complete' && visit.nodeType === 'repository') {
        existing.hasCompleted = true;
      }
      // Update to most recent visit
      const visitTime = getTimestamp(visit.timestamp);
      const lastVisitTime = getTimestamp(existing.lastVisit.timestamp);
      if (visitTime > lastVisitTime) {
        existing.lastVisit = visit;
        existing.nodeId = visit.nodeId;
        existing.nodeType = visit.nodeType;
      }
    }
  }
  // Convert to array for filtering and sorting
  let items = Array.from(repositoryVisits.values());
  // Filter out completed unless requested
  if (!includeCompleted) {
    items = items.filter((item) => !item.hasCompleted);
  }
  // Sort by last visit time (most recent first)
  items.sort((a, b) => {
    const aTime = getTimestamp(a.lastVisit.timestamp);
    const bTime = getTimestamp(b.lastVisit.timestamp);
    return bTime - aTime;
  });
  // Apply limit
  items = items.slice(0, limit);
  // Map to result items
  const result: ContinueLearningItem[] = items.map((item) => {
    const content = item.lastVisit.content;
    const timestamp =
      item.lastVisit.timestamp instanceof Date
        ? item.lastVisit.timestamp
        : new Date(item.lastVisit.timestamp);

    return {
      repositoryId: item.repositoryId,
      nodeId: item.nodeId,
      nodeType: item.nodeType,
      title: content?.title || 'Unknown',
      thumbnail: content?.thumbnail,
      difficulty: content?.difficulty || 'beginner',
      tags: content?.tags || [],
      lastAction: item.lastVisit.action,
      lastVisitedAt: timestamp,
      totalTimeSpent: item.totalTimeSpent,
      progress: item.hasCompleted ? 100 : item.maxScrollDepth,
    };
  });

  return {
    items: result,
    count: result.length,
    generatedAt: new Date(),
  };
}
