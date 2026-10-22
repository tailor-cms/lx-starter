import type { ActivityDto } from 'app-api-client';
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';

export const sortByPosition = <T extends { position: number }>(items: T[]) =>
  sortBy(items, 'position');

/**
 * Resolves the first activity, in outline (depth-first, position) order,
 * that holds content containers.
 */
export function findFirstContentNode(
  structure: ActivityDto[] = [],
): ActivityDto | null {
  const byParent = groupBy(structure, (it) => it.parentId ?? 'root');
  const traverse = (activities: ActivityDto[] = []): ActivityDto | null => {
    for (const activity of sortByPosition(activities)) {
      if (activity.contentContainers?.length) return activity;
      const match = traverse(byParent[activity.id]);
      if (match) return match;
    }
    return null;
  };
  return traverse(byParent.root);
}
