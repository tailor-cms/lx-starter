export interface Affinity {
  tag: string;
  affinity: number;
}

export interface ProcessedUser {
  id: string;
  email: string;
  activity: ProfileData;
  affinityCount: number;
  topAffinities: Affinity[];
  hasProfile: boolean;
  lastUpdatedAt: string | null;
}

export interface ProfileData {
  experienceLevel?: string;
  engagement?: EngagementData;
  affinities?: Record<string, Record<string, AffinityScore>>;
  visitHistory?: VisitHistoryItem[];
  onboarding?: OnboardingData;
  goals?: string[];
  answers?: Record<string, unknown>;
  createdAt?: string;
}

export interface EngagementData {
  journeyStage?: string;
  lastActiveAt?: string;
  velocity?: number;
  streakDays?: number;
  totalTimeSpent?: number;
  totalInteractions?: number;
}

export interface AffinityScore {
  value: number;
  confidence: number;
  sources?: {
    onboarding?: number;
    explicit?: number;
    behavioral?: number;
  };
}

export interface VisitHistoryItem {
  id?: string;
  timestamp: string;
  action: string;
  repositoryId?: string;
  nodeType?: string;
  duration?: number;
  content?: {
    title?: string;
    tags?: string[];
  };
  engagement?: {
    scrollDepth?: number;
    contentProgress?: ContentProgressItem[];
  };
  context?: {
    sessionId?: string;
    entryPoint?: string;
  };
  device?: {
    type?: string;
  };
  affinityChanges?: AffinityChange[];
}

export interface ContentProgressItem {
  type: string;
  percent?: number;
  data?: {
    attempts?: number;
    correct?: boolean;
  };
}

export interface AffinityChange {
  tag: string;
  dimension: string;
  delta: number;
}

export interface OnboardingData {
  completedAt?: string;
  survey?: SurveyAnswer[];
}

export interface SurveyAnswer {
  questionId: string;
  selectedValues: string[];
}

export interface CourseProgressItem {
  repositoryId: string;
  title: string;
  tags: string[];
  completed: boolean;
  completedAt?: Date;
  totalTimeSpent: number;
  visitCount: number;
  progress: number;
  lastVisitedAt: Date;
}

export interface TopAffinity {
  tag: string;
  value: number;
  confidence: number;
  dimension: string;
  source: 'behavioral' | 'onboarding' | 'explicit';
}

export interface TrendingInterest {
  tag: string;
  dimension: string;
  recentDelta: number;
}

export interface DimensionTag {
  name: string;
  value: number;
  confidence: number;
  source: 'behavioral' | 'onboarding' | 'explicit';
}

export interface TimelineGroup {
  date: string;
  label: string;
  items: VisitHistoryItem[];
}

export interface EntryPointStat {
  type: string;
  count: number;
  percent: number;
  color: string;
  label: string;
}

export interface DeviceStat {
  type: string;
  icon: string;
  label: string;
  percent: number;
}

export interface QuizBreakdown {
  firstTry: number;
  secondTry: number;
  multiTry: number;
  total: number;
}

export interface FormattedAnswer {
  questionId: string;
  question: string;
  selectedLabels: string[];
}

export interface OnboardingAffinity {
  tag: string;
  dimension: string;
}

export interface StatusCardInfo {
  stage: string;
  label: string;
  description: string;
}
