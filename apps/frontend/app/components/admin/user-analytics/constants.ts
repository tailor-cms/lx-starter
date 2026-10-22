export interface Dimension {
  key: string;
  name: string;
  icon: string;
  gradient: string;
}

export const DIMENSIONS: Dimension[] = [
  {
    key: 'topic',
    name: 'Topic',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #0D7377, #14919B)',
  },
  {
    key: 'skill',
    name: 'Skill',
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #E07A5F, #F2CC8F)',
  },
  {
    key: 'concept',
    name: 'Concept',
    icon: '💡',
    gradient: 'linear-gradient(135deg, #D4A373, #E9C46A)',
  },
  {
    key: 'industry',
    name: 'Industry',
    icon: '🏢',
    gradient: 'linear-gradient(135deg, #81B29A, #3D5A80)',
  },
  {
    key: 'tool',
    name: 'Tool',
    icon: '🔧',
    gradient: 'linear-gradient(135deg, #7209B7, #B5179E)',
  },
  {
    key: 'goal',
    name: 'Goal',
    icon: '🎓',
    gradient: 'linear-gradient(135deg, #F72585, #4361EE)',
  },
];

export const JOURNEY_STAGE_LABELS: Record<string, string> = {
  browse: 'Browsing',
  explore: 'Exploring',
  targeted: 'Focused',
  flow: 'In Flow',
};

export const JOURNEY_STAGE_DESCRIPTIONS: Record<string, string> = {
  browse: 'Casually looking around the platform',
  explore: 'Actively discovering new content',
  targeted: 'Working toward specific goals',
  flow: 'Deep engagement, consistent progress',
};

export const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const EXPERIENCE_LEVEL_DESCRIPTIONS: Record<string, string> = {
  beginner: 'New to the subject matter',
  intermediate: 'Has foundational knowledge',
  advanced: 'Experienced practitioner',
};

export const ACTION_ICONS: Record<string, string> = {
  complete: '✓',
  view: '👁',
  bookmark: '🔖',
  skip: '⏭',
};

export const ENTRY_POINT_COLORS: Record<string, string> = {
  recommendation: '#7209B7',
  search: '#0D7377',
  browse: '#81B29A',
  direct: '#94A3B8',
  pathway: '#E07A5F',
  continue: '#3D5A80',
};

export const ENTRY_POINT_LABELS: Record<string, string> = {
  recommendation: 'Recommendations',
  search: 'Search',
  browse: 'Browse',
  direct: 'Direct',
  pathway: 'Learning Path',
  continue: 'Continue Learning',
};

export const MAX_TIMELINE_ITEMS = 10;
export const RADAR_RADIUS = 110;
