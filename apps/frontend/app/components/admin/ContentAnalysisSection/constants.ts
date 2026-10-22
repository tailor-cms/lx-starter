export interface ConfigItem {
  icon: string;
  color: string;
  label: string;
}

export const LIMITS = {
  tagCloudMax: 30,
  tagNetworkMax: 100,
} as const;

export const TAG_COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'indigo',
  'teal',
  'pink',
  'deep-purple',
  'cyan',
  'light-blue',
] as const;

export const CATEGORY_CONFIG: Record<string, ConfigItem> = {
  topic: { icon: 'mdi-book-open-variant', color: 'blue', label: 'Topic' },
  skill: { icon: 'mdi-account-hard-hat', color: 'purple', label: 'Skill' },
  concept: { icon: 'mdi-lightbulb', color: 'teal', label: 'Concept' },
  industry: { icon: 'mdi-factory', color: 'orange', label: 'Industry' },
  tool: { icon: 'mdi-wrench', color: 'green', label: 'Tool' },
} as const;

export const DIFFICULTY_CONFIG: Record<string, ConfigItem> = {
  beginner: { icon: 'mdi-star-outline', color: 'green', label: 'Beginner' },
  intermediate: {
    icon: 'mdi-star-half-full',
    color: 'orange',
    label: 'Intermediate',
  },
  advanced: { icon: 'mdi-star', color: 'deep-orange', label: 'Advanced' },
  expert: { icon: 'mdi-star-box', color: 'red', label: 'Expert' },
} as const;

export const CATEGORY_FILTERS = [
  { value: null, label: 'All', icon: 'mdi-asterisk', color: 'primary' },
  ...Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
    value: key,
    label: `${config.label}s`,
    icon: config.icon,
    color: config.color,
  })),
] as const;
