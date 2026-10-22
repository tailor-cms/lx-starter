// Activity action - what the user did with the content
export type ActivityAction = 'view' | 'complete' | 'bookmark' | 'skip';

// Entry point - how user arrived at content
export type EntryPoint =
  | 'recommendation'
  | 'search'
  | 'browse'
  | 'direct'
  | 'pathway'
  | 'continue';

// Content element type (from Tailor CMS registry)
// Common types: TIPTAP_HTML, MUX_VIDEO, PDF, IMAGE, FILE, MULTIPLE_CHOICE
export type ContentProgressType = string;

// Minimal interface for trackable content elements
export interface TrackableElement {
  uid: string;
  type: ContentProgressType;
}

// Progress for a specific content element
export interface ContentProgressEntry {
  elementId: string;
  type: ContentProgressType;
  // Progress percentage (0-100) for media types
  percent?: number;
  // Additional type-specific data (e.g., quiz: { attempts, correct, score })
  data?: Record<string, unknown>;
}

export interface VisitContext {
  sessionId?: string;
  sequenceNumber?: number;
  entryPoint?: EntryPoint;
  referrer?: string;
  learningPathId?: string;
}

export interface VisitEngagement {
  scrollDepth?: number;
  interactionCount?: number;
  contentProgress?: ContentProgressEntry[];
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  browser?: string;
  os?: string;
}

// Aggregated tracking data for activity reports
export interface TrackingData {
  duration: number;
  context: VisitContext;
  engagement: VisitEngagement;
  device?: DeviceInfo;
}

// Options for trackActivity - all fields optional as defaults are
// built automatically
export type TrackActivityOptions = Partial<TrackingData>;
