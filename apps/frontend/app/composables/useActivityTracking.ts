import type {
  ActivityAction,
  ContentProgressEntry,
  EntryPoint,
  TrackableElement,
  TrackActivityOptions,
  TrackingData,
  VisitContext,
  VisitEngagement,
} from '~/types/activity';
import { apiClient as api } from '@/api';
import { getScrollContainer } from '~/utils/scroll-container';
import type { InjectionKey } from 'vue';

// Skip detection thresholds
const MIN_ENGAGEMENT_TIME_MS = 5000; // Quick bounce threshold
const MAX_IDLE_TIME_MS = 15000; // Idle without scrolling threshold
const MIN_SCROLL_DEPTH_PERCENT = 10;

// Injection key for sharing tracking instance between parent page
// and child components
export const ActivityTrackingKey: InjectionKey<
  ReturnType<typeof useActivityTracking>
> = Symbol('ActivityTracking');

const SESSION_KEY = 'lx-session';
let sessionId: string | null = null;
let sequenceNumber = 0;

function getSessionId(): string {
  if (sessionId) return sessionId;
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    const { id, seq } = JSON.parse(stored);
    sessionId = id;
    sequenceNumber = seq || 0;
    return id;
  }
  sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  sequenceNumber = 0;
  saveSession();
  return sessionId;
}

function getNextSequence(): number {
  sequenceNumber++;
  saveSession();
  return sequenceNumber;
}

function saveSession() {
  if (!sessionId) return;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: sessionId, seq: sequenceNumber }),
  );
}

/**
 * Composable for tracking user learning activities
 * Reports interactions to update the learner profile with:
 * - Visit history
 * - Engagement metrics (velocity, journey stage, streak)
 * - 6D affinities (topic, skill, concept, industry, tool, goal)
 */
export function useActivityTracking() {
  const { getDeviceInfo } = useDeviceInfo();
  const route = useRoute();

  const startTime = ref(Date.now());
  const scrollDepth = ref(0);
  const interactionCount = ref(0);
  // Per-element progress tracking
  const contentProgress = ref<Map<string, ContentProgressEntry>>(new Map());
  // Element visibility tracking with Intersection Observer
  // Track active observers to prevent duplicates
  const activeObservers = new Map<string, IntersectionObserver>();

  // Detect entry point from route/referrer
  function detectEntryPoint(): EntryPoint {
    const from = route.query.from as string;
    // Explicit query param takes precedence
    if (from === 'recommendation') return 'recommendation';
    if (from === 'search') return 'search';
    if (from === 'pathway') return 'pathway';
    if (from === 'continue') return 'continue';
    // No referrer; direct URL access (bookmark, typed URL, external link)
    if (!document?.referrer) return 'direct';
    try {
      const referrer = new URL(document.referrer);
      const { origin, pathname } = referrer;
      if (origin === window.location.origin) {
        if (pathname.includes('/search')) return 'search';
        if (pathname.includes('/recommendations')) return 'recommendation';
        if (pathname.includes('/pathway')) return 'pathway';
      }
    } catch {
      console.warn('Failed to parse referrer URL for entry point detection');
    }
    return 'browse';
  }

  /**
   * Build context object
   */
  function buildContext(override?: Partial<VisitContext>): VisitContext {
    return {
      sessionId: getSessionId(),
      sequenceNumber: getNextSequence(),
      entryPoint: detectEntryPoint(),
      referrer: document.referrer || undefined,
      learningPathId: (route.query.pathwayId as string) || undefined,
      ...override,
    };
  }

  /**
   * Build engagement object including content progress
   */
  function buildEngagement(
    override?: Partial<VisitEngagement>,
  ): VisitEngagement {
    const progress = Array.from(contentProgress.value.values());
    return {
      scrollDepth: scrollDepth.value,
      interactionCount: interactionCount.value,
      contentProgress: progress.length > 0 ? progress : undefined,
      ...override,
    };
  }

  /**
   * Track an activity for a content node
   */
  async function trackActivity(
    nodeId: string,
    action: ActivityAction,
    options?: TrackActivityOptions,
  ) {
    const duration = options?.duration ?? Date.now() - startTime.value;
    try {
      await api.learning.recordActivity({
        body: {
          nodeId,
          action,
          duration,
          context: options?.context ?? buildContext(),
          engagement: options?.engagement ?? buildEngagement(),
          device: options?.device ?? getDeviceInfo(),
        },
      });
    } catch (error) {
      console.error(`Failed to track ${action} activity:`, error);
    }
  }

  /**
   * Track a view activity
   */
  function trackView(nodeId: string, duration?: number) {
    return trackActivity(nodeId, 'view', { duration });
  }

  /**
   * Track a skip
   */
  function trackSkip(nodeId: string) {
    return trackActivity(nodeId, 'skip');
  }

  /**
   * Update scroll depth (call from scroll handler)
   */
  function updateScrollDepth(depth: number) {
    scrollDepth.value = Math.max(scrollDepth.value, Math.min(100, depth));
  }

  /**
   * Increment interaction count (call on clicks, etc.)
   */
  function recordInteraction() {
    interactionCount.value++;
  }

  /**
   * Update progress for a specific content element
   * Call this when element progress changes (e.g., video playback, quiz answer)
   */
  function updateElementProgress(entry: ContentProgressEntry) {
    contentProgress.value.set(entry.elementId, entry);
  }

  /**
   * Mark an element as fully viewed (100% progress)
   * Used by intersection observer when element enters viewport
   */
  function markElementViewed(element: TrackableElement) {
    const { uid, type } = element;
    // Don't overwrite existing progress (e.g., partial video progress)
    if (contentProgress.value.has(uid)) return;
    contentProgress.value.set(uid, { elementId: uid, type, percent: 100 });
  }

  /**
   * Track when a content element becomes visible in the viewport.
   * Once visible (above threshold), marks it as viewed and stops observing.
   * @returns Cleanup function to stop observing (call on unmount)
   */
  function observeElement(
    domElement: Element | null,
    contentElement: TrackableElement,
    threshold = 0.5,
  ): () => void {
    const { uid } = contentElement;

    // 1. Guard: skip if no element or already observing
    if (!domElement || activeObservers.has(uid)) return () => {};
    // 2. Define cleanup to disconnect and untrack observer
    const cleanup = () => {
      observer.disconnect();
      activeObservers.delete(uid);
    };
    // 3. Handle intersection: mark viewed once threshold met, then cleanup
    const handleIntersection: IntersectionObserverCallback = (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting || entry.intersectionRatio < threshold) return;
      markElementViewed(contentElement);
      cleanup();
    };
    // 4. Create observer and start watching
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      root: getScrollContainer(),
    });
    observer.observe(domElement);
    activeObservers.set(uid, observer);
    return cleanup;
  }

  /**
   * Reset tracking state (call on navigation)
   */
  function reset() {
    startTime.value = Date.now();
    scrollDepth.value = 0;
    interactionCount.value = 0;
    contentProgress.value.clear();
    activeObservers.forEach((observer) => observer.disconnect());
    activeObservers.clear();
  }

  /**
   * Get current duration since tracking started
   */
  function getDuration(): number {
    return Date.now() - startTime.value;
  }

  /**
   * Build complete tracking data object for activity reports
   */
  function getTrackingData(): TrackingData {
    return {
      duration: getDuration(),
      context: buildContext(),
      engagement: buildEngagement(),
      device: getDeviceInfo(),
    };
  }

  /**
   * Determine if user engagement indicates a skip:
   * - Quick bounce: left in < 5 seconds
   * - Idle: stayed > 15 seconds but no scroll or interactions
   */
  function isSkipBehavior(): boolean {
    const duration = getDuration();
    const depth = scrollDepth.value;
    const interactions = interactionCount.value;
    // Quick bounce
    if (duration < MIN_ENGAGEMENT_TIME_MS) return true;
    // Idle without engagement (no scroll AND no interactions)
    const hasEngagement = depth >= MIN_SCROLL_DEPTH_PERCENT || interactions > 0;
    if (duration > MAX_IDLE_TIME_MS && !hasEngagement) return true;
    return false;
  }

  return {
    // Activity tracking
    trackView,
    trackSkip,
    // Engagement
    updateScrollDepth,
    recordInteraction,
    reset,
    // Element visibility
    observeElement,
    updateElementProgress,
    // Data builders
    getTrackingData,
    isSkipBehavior,
  };
}
