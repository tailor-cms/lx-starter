/**
 * Format kebab-case tag name as readable label
 */
export function formatTagLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
