# Learner Profiling System

System for understanding learners through onboarding surveys, behavioral tracking, and adaptive recommendations.

## TODO

- [ ] **Rename `Problem.category` to `Problem.industry`** - Currently `Tag.category` means
  "which dimension" (topic, skill, etc.) while `Problem.category` means "industry value"
  (fintech, e-commerce). This semantic mismatch is confusing. Renaming would make the code
  self-documenting: `affinities.industry[problem.industry]`. Breaking change requiring
  ContentMeta migration.

- [ ] **Add `repositoryProgress` for persistent completion tracking** - Currently, completion
  status is stored only in `visitHistory` which is capped at 100 entries. When a user
  generates 100+ visits after completing a repository, the completion record is lost. This
  causes: `isRepositoryCompleted()` returning false incorrectly, completed content appearing
  in "continue learning", and re-recommendations of finished content. Solution: Add a
  separate `repositoryProgress: Record<string, RepositoryProgress>` field to store permanent
  per-repository state (completed, completedAt, totalTimeSpent, maxProgress, visitCount).
  See [Design Consideration: visitHistory Limitations](#design-consideration-visithistory-limitations).

## Pipeline Overview

```
CONTENT ANALYSIS → ONBOARDING → ACTIVITY TRACKING → PROFILE UPDATE → RECOMMENDATIONS
     │                 │                │                 │               │
     ▼                 ▼                ▼                 ▼               ▼
 ContentMeta      Survey Answers   Visit Entry      6D Affinities    Ranked Results
 + Tags           + Goals          + Context        + Engagement
 + Problems                        + Engagement
```

---

## Example Profile

Complete learner profile showing all fields with realistic data:

```typescript
{
  id: 'user_abc123',
  answers: { interests: [0], goals: [1] },

  // 6D Affinities - interest scores by dimension
  affinities: {
    topic: {
      'data-science': {
        value: 0.85,                    // Interest strength (0-1)
        confidence: 0.6,                // Reliability (0-1)
        sources: { onboarding: 0.5, behavioral: 0.35, explicit: 0 },
        lastUpdated: new Date('2025-01-20'),
        interactionCount: 12
      },
      'python': { value: 0.72, confidence: 0.55, ... }
    },
    skill: { 'debugging': { value: 0.4, ... } },
    concept: {},
    industry: { 'fintech': { value: 0.6, ... } },
    tool: { 'jupyter': { value: 0.5, ... } },
    goal: {}
  },

  // Preferences
  experienceLevel: 'intermediate',
  goals: ['Build projects', 'Get certified'],
  recentTags: ['data-science', 'python', 'machine-learning'],

  // Visit History (last 100 visits)
  visitHistory: [
    {
      id: 'visit_xyz789',
      nodeId: 'lesson-456',
      repositoryId: 'repo-789',
      nodeType: 'activity',
      action: 'complete',
      timestamp: new Date('2025-01-20T14:30:00Z'),
      duration: 180000,  // 3 minutes
      content: {
        title: 'Introduction to Pandas',
        thumbnail: 'https://...',
        difficulty: 'intermediate',
        tags: ['python', 'data-science', 'pandas'],
        bloomLevel: 'apply'
      },
      context: {
        sessionId: '1706123456789-abc',
        sequenceNumber: 3,
        entryPoint: 'recommendation',
        referrer: '/recommendations'
      },
      engagement: {
        scrollDepth: 95,
        interactionCount: 8,
        contentProgress: [
          { type: 'MUX_VIDEO', percent: 100 },
          { type: 'SINGLE_CHOICE', data: { attempts: 1, correct: true, score: 100 } }
        ]
      }
    }
  ],

  // Engagement Metrics
  engagement: {
    velocity: 72,              // Momentum (0-100)
    journeyStage: 'targeted',  // browse | explore | targeted | flow
    totalInteractions: 45,
    totalTimeSpent: 7200000,   // 2 hours in ms
    streakDays: 5,
    lastActiveAt: new Date('2025-01-20T14:30:00Z')
  },

  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-20')
}
```

---

## User Profile Attributes

### Core Identity

| Attribute | Type | Set By | Used By | Description |
|-----------|------|--------|---------|-------------|
| `id` | string | ProfileBuilder | All | Unique profile identifier |
| `answers` | Record<string, number[]> | ProfileBuilder | Reference | Raw survey question answers |
| `createdAt` | Date | ProfileBuilder | Reference | Profile creation timestamp |
| `updatedAt` | Date | ProfileUpdater | Staleness checks | Last modification timestamp |

### 6D Affinities

Primary affinity system storing learner interests across 6 dimensions.

**Set By:**
- `ProfileBuilder.build()` - Initial values from onboarding survey
- `ProfileUpdater.update()` / `track()` - Behavioral updates from activity

**Used By:**
- `ProfileMatcher.calculateScore()` - Content recommendation scoring
- `ProfileMatcher.suggestContent()` - Ranked suggestions
- `ProfileMatcher.getMoreLikeThis()` - Similar content discovery

**Structure:**
```typescript
affinities: {
  topic: { 'javascript': AffinityScore, 'react': AffinityScore },
  skill: { 'debugging': AffinityScore },
  concept: { 'immutability': AffinityScore },
  industry: { 'fintech': AffinityScore, 'web-development': AffinityScore },
  tool: { 'vscode': AffinityScore },
  goal: { 'certification': AffinityScore }
}
```

**Dimensions:**

| Dimension | Description | Examples |
|-----------|-------------|----------|
| `topic` | Subject matter | 'async-programming', 'databases' |
| `skill` | Practical abilities | 'debugging', 'testing' |
| `concept` | Theoretical principles | 'encapsulation', 'immutability' |
| `industry` | Professional domains (from problem categories) | 'fintech', 'e-commerce', 'data-analysis' |
| `tool` | Technologies/frameworks | 'react', 'postgresql' |
| `goal` | Learning objectives | 'career-advancement', 'certification' |

### AffinityScore

Each tag within a dimension has:

| Field | Type | Description |
|-------|------|-------------|
| `value` | number (0-1) | Interest strength for recommendation ranking |
| `confidence` | number (0-1) | Reliability for weighting scores |
| `sources` | object | Contribution tracking: `{ onboarding, behavioral, explicit }` |
| `lastUpdated` | Date | Timestamp of last change |
| `interactionCount` | number | Update count for confidence calculation |

### Preferences

| Attribute | Type | Set By | Used By | Description |
|-----------|------|--------|---------|-------------|
| `experienceLevel` | DifficultyLevel | Survey / ProfileUpdater | ContentService | beginner/intermediate/advanced (see [Difficulty Inference](#difficulty-inference)) |
| `goals` | string[] | Survey (goal questions) | Recommendations | Explicit learning objectives |
| `recentTags` | string[] | ProfileUpdater | Trending interests | Recently interacted tags (max 50) |

### Behavioral Tracking

| Attribute | Type | Set By | Used By | Description |
|-----------|------|--------|---------|-------------|
| `visitHistory` | VisitEntry[] | ProfileUpdater.track() | Journey analysis | Last 100 visits with full context |
| `engagement` | EngagementMetrics | ProfileUpdater | Journey stage classification | Velocity, streak, totals |

---

## Affinity Calculation

### Value Formula

```
delta = tagWeight × actionWeight × nodeTypeWeight × dimensionWeight × LEARNING_RATE
newValue = clamp(0, 1, oldValue + delta)
```

The `LEARNING_RATE` (0.1) prevents large jumps from single interactions.
Without it, one completion could max out an affinity immediately.

Changes below `MIN_DELTA_THRESHOLD` (0.005) are ignored to reduce noise from
low-weight tags or brief interactions.

**Affinity Sources:**

Affinities are updated from two sources in ContentMeta:

1. **Content tags** → Mapped to their respective dimensions (topic, skill, tool, etc.)
   based on the tag's `category` field. Default dimension is `topic`.

2. **Problem categories** → Mapped to `industry` dimension. Problems define what
   real-world challenges the content addresses (e.g., 'fintech', 'e-commerce'),
   helping match learners with content relevant to their professional domain.

Example:
```
Tag 'javascript' (weight: 1.0), action 'complete' (1.0), node 'activity' (0.5),
dimension 'topic' (1.0):
delta = 1.0 × 1.0 × 0.5 × 1.0 × 0.1 = 0.05
If oldValue = 0.3, newValue = 0.35
```

**Action Weights:**

| Action | Weight | Description |
|--------|--------|-------------|
| `complete` | 1.0 | Finished content |
| `bookmark` | 0.8 | Saved for later |
| `view` (>60s) | 0.5 | Long engagement |
| `view` (<60s) | 0.3 | Brief view |
| `skip` | -0.3 | Explicit skip |

**Node Type Weights:**

| Node Type | Weight | Description |
|-----------|--------|-------------|
| `repository` | 1.0 | Full course/repo |
| `activity` | 0.5 | Single activity |
| `container` | 0.3 | Module/section |
| `element` | 0.2 | Individual element |

**Dimension Weights:**

| Dimension | Weight |
|-----------|--------|
| topic | 1.0 |
| skill | 1.0 |
| tool | 1.0 |
| concept | 0.8 |
| goal | 0.8 |
| industry | 0.7 |

### Confidence Formula

```
confidence = min(0.95, 0.3 + log10(interactionCount + 1) × 0.3)
```

| Interactions | Confidence |
|--------------|------------|
| 1 (onboarding) | 0.5 |
| 1 (behavioral) | 0.3 |
| 10 | 0.6 |
| 100 | 0.9 |
| 1000+ | 0.95 (cap) |

**Onboarding confidence:** Starts at 0.5 (explicit but unverified by behavior).

### Difficulty Inference

The `experienceLevel` can advance based on content completion. This only triggers
on **repository-level** completions because:

1. **Repository = full course completion** - A reliable signal of mastery
2. **Activities/elements are too granular** - Completing one lesson doesn't indicate readiness for harder content overall
3. **Prevents noisy level changes** - Brief interactions shouldn't affect difficulty preferences

**Advancement rule:**
When a learner completes content at or above their current level, their
experienceLevel advances to the next tier.

```
Current: intermediate, Completed: intermediate course → New: advanced
Current: intermediate, Completed: beginner course   → No change
Current: advanced,     Completed: any level         → No change (already max)
```

**Note:** Requires `trackDifficulty: true` in ProfileUpdater options.

---

## Update Flow

### 1. Onboarding (ProfileBuilder.build)

```
Survey Answers → ProfileBuilder.build() → LearnerProfile
```

**ProfileQuestion structure:**
```typescript
{
  id: 'interests',
  category: 'interest',  // interest | experience | goal | preference
  answers: ['Data Science', 'Web Dev', 'DevOps'],
  tagAffinities: [
    { 'data-science': 1, 'python': 0.8 },  // Answer 0 tags
    { 'web-dev': 1, 'javascript': 0.8 },   // Answer 1 tags
    { 'devops': 1, 'docker': 0.7 },        // Answer 2 tags
  ],
  weight: 1,  // Question importance multiplier (0-1)
}
```

**Answers format:** `Record<questionId, selectedIndexes[]>`
```typescript
{ interests: [0], goals: [1] }
// interests: index 0 = 'Data Science' -> tags { 'data-science': 1, 'python': 0.8 }
// goals: index 1 = 'Build projects' -> added to goals array
```

**Affinity calculation (two-step process):**

**Step 1: Aggregation** - Sum weighted contributions from all answers:
```
rawAffinity[tag] += tagAffinity × question.weight
```

Example:
```
Question: "What interests you?" (weight: 2)
Answer: "Web" with tagAffinities: { javascript: 0.8, css: 0.6 }
Result: rawAffinities += { javascript: 1.6, css: 1.2 }
```

Tags from multiple answers accumulate into a raw affinity profile.

**Step 2: Normalization** - Scale all values to [0, 1] range using max-normalization:
```
finalValue = rawAffinity / max(allRawAffinities)
```

Example:
```
Raw affinities: { javascript: 15, python: 10, rust: 5 }
maxAffinity = 15
Normalized:    { javascript: 1.0, python: 0.67, rust: 0.33 }
```

This ensures all affinity values are comparable regardless of how many questions
contributed to each tag. The highest accumulated affinity becomes 1.0, and all
others are scaled proportionally. A minimum divisor of 1 prevents division by
zero when no affinities exist.

**Process:**
- Aggregates tag affinities from selected answers (weighted sum)
- Normalizes to 0-1 range (max-normalization)
- Creates 6D affinities with `sources.onboarding` populated
- Sets confidence to 0.5 (ONBOARDING_CONFIDENCE)
- Extracts goals from goal-category questions

### 2. Activity Tracking (ProfileUpdater)

Two methods available depending on tracking needs:

| Method | Updates | Use Case |
|--------|---------|----------|
| `update()` | affinities, recentTags, experienceLevel | Lightweight tracking, background sync |
| `track()` | All above + visitHistory, engagement metrics | Full tracking with analytics |

**`update()` - Lightweight (affinities only):**
```typescript
const { profile, updates } = updater.update(
  profile,
  nodeId,    // content identifier
  'view',    // action
  30000      // duration in ms
);
```

Use when you only need affinity updates without visit history or engagement
metrics. Suitable for background syncing or simple tracking scenarios.

**`track()` - Full tracking:**
```typescript
const { profile, updates, visit } = updater.track(
  profile,
  nodeId,
  'complete',
  120000,
  { sessionId, entryPoint: 'recommendation' },  // session context
  { scrollDepth: 95, interactionCount: 12 }     // engagement data
);
```

Internally calls `update()` first, then adds:
- VisitEntry in visitHistory (capped at 100 entries)
- Engagement metrics (velocity, streaks, totals)
- Session context (entryPoint, referrer, learningPathId)
- Engagement data (scrollDepth, interactionCount, contentProgress)

### 3. Decay (ProfileUpdater.decay)

Call periodically to reduce stale affinities:

```typescript
const decayedProfile = updater.decay(profile, 0.95); // 5% decay
```

Tags below 0.05 threshold are removed.

---

## Recommendation Scoring

### Match Score (ProfileMatcher.calculateScore)

```
score = Σ (tagAffinity × tagWeight × confidenceMultiplier)
      × difficultyMatch
      × recencyBoost
```

**Confidence multiplier:** `0.5 + confidence × 0.5` (ranges 0.5-1.0)

### Velocity Calculation

Velocity (0-100) represents learning momentum - how actively engaged the learner is.

**Formula components:**
```
base = 100 - (hoursSinceLastActive × 2)           // Decays 2 points per inactive hour
completionsBoost = completions × 5                 // +5 per completion (max +25)
scrollBoost = avgScrollDepth × 0.2                 // +0.2 × average scroll depth
streakMultiplier = 1 + (streakDays × 0.05)        // ×1.05 per streak day

velocity = clamp(0, 100, (base + completionsBoost + scrollBoost) × streakMultiplier)
```

Calculated from the last 20 visits in visit history.

### Streak Calculation

Streaks count consecutive days of learning activity, rewarding consistent engagement.

**Algorithm:**
1. Start from today (or yesterday if no activity today yet)
2. Walk backward through calendar days
3. Count consecutive days with at least one visit
4. Stop at first gap (day with no activity)

**Grace period:** No activity today doesn't break the streak. This prevents penalizing
learners who haven't logged in yet today - the streak starts counting from yesterday.

**Impact on velocity:** Streaks boost velocity via the multiplier `×(1 + streakDays × 0.05)`:

| Streak | Multiplier | Effect |
|--------|------------|--------|
| 0 days | ×1.00 | No boost |
| 5 days | ×1.25 | +25% velocity |
| 10 days | ×1.50 | +50% velocity |
| 20 days | ×2.00 | +100% velocity |

Max streak tracked: 365 days.

### Journey Stages

Journey stage classification based on engagement metrics. Evaluated in order, first match wins:

| Stage | Criteria | Description |
|-------|----------|-------------|
| `flow` | velocity ≥ 90 AND matchQuality ≥ 95 | Maximum momentum, deep learning state |
| `targeted` | velocity ≥ 70 AND matchQuality ≥ 85 | Clear profile, focused learning |
| `explore` | interactions ≥ 10 AND velocity ≥ 40 | Curious exploration, patterns emerging |
| `browse` | default | First visits, weak engagement signals |

### Match Quality (Recommendation Effectiveness)

Match quality (0-100) measures how well recent content aligns with learner interests.
This serves as a feedback signal for recommendation effectiveness - are we showing
content the learner actually engages with?

**Formula per visit:**
```
avgDelta = mean of positive affinity changes (negative ignored)
visitQuality = min(100, avgDelta × 1000 + 50)
matchQuality = average of visitQuality across last 10 visits
```

**Interpretation:**
- **High matchQuality (80+)**: Recommendations are hitting the mark - learner engages with suggested content
- **Medium matchQuality (50-80)**: Mixed results - some content resonates, some doesn't
- **Low matchQuality (<50)**: Recommendations need improvement - content doesn't match interests

**Why ignore negative deltas?** Skips produce negative affinity changes, but we're measuring
alignment with interests, not rejection. A skip might mean "not now" rather than "not interested".

**Why ×1000 scaling?** Affinity deltas are small (0.01-0.1 range). Scaling converts them to
a meaningful 0-100 score. The +50 base means neutral engagement (no changes) scores average.

---

## Continue Learning

Identifies content the learner has started but not completed, enabling "resume" functionality.

### Algorithm

```
Visit History → Group by Repository → Aggregate Metrics → Filter/Sort → Results
```

For each repository in visit history:
1. **Aggregate** total time spent across all visits
2. **Track** maximum scroll depth achieved
3. **Detect** completion (any visit with `action: 'complete'`)
4. **Find** most recent visit (for resume point)

### Usage

**Standalone function:**
```typescript
import { getContinueLearning } from '@tailor-cms/garment';

const result = getContinueLearning(profile, { limit: 5 });
// Returns: { items, count, generatedAt }
```

**Via LearnerProfiler:**
```typescript
const result = profiler.getContinueLearning(profile, {
  limit: 5,
  includeCompleted: false  // default
});
```

### Result Item

| Field | Type | Description |
|-------|------|-------------|
| `repositoryId` | string | Course/repository identifier |
| `nodeId` | string | Most recent node visited (resume point) |
| `nodeType` | string | Type of node (lesson, module, etc.) |
| `title` | string | Content title |
| `thumbnail` | string? | Thumbnail URL |
| `difficulty` | DifficultyLevel | Content difficulty |
| `tags` | string[] | Content tags |
| `lastAction` | ActivityAction | Last action performed |
| `lastVisitedAt` | Date | When last visited |
| `totalTimeSpent` | number | Cumulative time (ms) |
| `progress` | number | 0-100 (100 if completed, else max scroll depth) |

---

## Content Progress Tracking

Tracks progress on individual content elements within a container (lesson/module).

### Element Types

Maps to Tailor CMS content element packages:

| Type | Progress Tracking |
|------|-------------------|
| `TIPTAP_HTML` | Viewport visibility (100% when viewed) |
| `MUX_VIDEO` | Playback percentage (0-100) |
| `PDF` | Pages viewed percentage |
| `IMAGE` | Viewport visibility |
| `FILE` | Download status |
| `MULTIPLE_CHOICE` | Quiz data: attempts, correct, score, selected |
| `SINGLE_CHOICE` | Quiz data: attempts, correct, score, selected |

### ContentProgressEntry

```typescript
interface ContentProgressEntry {
  type: ContentProgressType;  // Element type or custom string
  percent?: number;           // 0-100 for media types
  data?: Record<string, unknown>;  // Type-specific data
}
```

### Quiz Progress Data

```typescript
interface QuizProgressData {
  attempts: number;
  correct?: boolean;
  score?: number;      // 0-100
  selected?: string[]; // Selected answer IDs
}
```

### Example: Lesson with Video + Quiz

```typescript
engagement: {
  scrollDepth: 100,
  interactionCount: 8,
  contentProgress: [
    { type: 'MUX_VIDEO', percent: 100 },
    { type: 'SINGLE_CHOICE', data: { attempts: 1, correct: true, score: 100 } }
  ]
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `ai/types/learner-profile.ts` | LearnerProfile, ContinueLearning types |
| `ai/types/activity-tracking.ts` | VisitEntry, AffinityScore, ContentProgressEntry |
| `ai/learner-profile/continue-learning.ts` | Continue learning analysis |
| `ai/learner-profile/ProfileUpdater.ts` | Activity processing, affinity updates |
| `ai/learner-profile/ProfileMatcher.ts` | Recommendation scoring |
| `ai/learner-profile/survey-profiling/ProfileBuilder.ts` | Profile creation from survey |
| `ai/learner-profile/LearnerProfiler.ts` | Orchestration facade |
| `backend/modules/learning/learning.service.ts` | API integration layer |
| `backend/modules/user/entities/user.entity.ts` | Profile persistence (activity JSONB) |
| `frontend/composables/useActivityTracking.ts` | Client-side activity tracking |

---

## Integration

### Frontend → Backend

```
useActivityTracking.trackActivity() → POST /learning/activity → ProfileUpdater → User.activity
```

**Activity tracking composable provides:**
- `trackView(nodeId)` / `trackComplete(nodeId)` / `trackSkip(nodeId)`
- `updateElementProgress(entry)` - Video/quiz progress
- `observeElement(el, id, type)` - Intersection observer for viewport tracking
- Session management (sessionId, sequenceNumber)
- Entry point detection (recommendation, search, browse, etc.)

### Recommendations

```
GET /learning/recommendations → LearningService → ProfileMatcher.suggestContent()
```

### Continue Learning

```
GET /learning/continue → LearningService → getContinueLearning(profile)
```

### More Like This

```
GET /learning/:uid/like-this → LearningService → ProfileMatcher.getMoreLikeThis()
```

---

## Design Consideration: visitHistory Limitations

### The Problem

`visitHistory` is capped at `MAX_VISIT_HISTORY` (100 entries) to bound storage, but several
features treat it as the source of truth for permanent state:

| Feature | What it reads | Problem when rolled off |
|---------|---------------|------------------------|
| `isRepositoryCompleted()` | Completion visits | Returns false for completed repos |
| `getContinueLearning()` | All visits | Shows completed content as incomplete |
| `suggestContent()` | Completed list | Re-recommends finished content |
| `getCompletedRepositories()` | Completion visits | Misses old completions |

**Scenario:**
1. User completes "Investing 101" → completion visit recorded in visitHistory
2. User continues learning, generates 100+ more visits
3. The completion record rolls off visitHistory
4. Now `isRepositoryCompleted("investing-101")` → `false` ❌

### What visitHistory Should Be

`visitHistory` is appropriate for:
- Recent activity analysis (last N sessions)
- Trending interests (recent affinity deltas)
- Session-based patterns
- Continue learning (recent incomplete content)

It should **not** be the source of truth for:
- Completion status (permanent milestone)
- Aggregated progress per repository
- Total engagement time

### Proposed Solution

Add a separate `repositoryProgress` map for aggregated/permanent data:

```typescript
interface RepositoryProgress {
  repositoryId: string;
  // Permanent state
  completed: boolean;
  completedAt?: Date;
  // Aggregated metrics (updated on each visit, never lost)
  totalTimeSpent: number;
  maxProgress: number;  // Max scroll depth achieved
  lastVisitedAt: Date;
  visitCount: number;
}

interface LearnerProfile {
  // ... existing fields
  visitHistory?: VisitEntry[];  // Recent detailed visits (max 100)
  repositoryProgress?: Record<string, RepositoryProgress>;  // Permanent per-repo
}
```

**Migration path:**
- `isRepositoryCompleted()` → checks `repositoryProgress[id].completed`
- `getContinueLearning()` → uses `repositoryProgress` for completion, `visitHistory` for recency
- `suggestContent()` → excludes based on `repositoryProgress`
- `getTrendingInterests()` → still uses `visitHistory` (recent is correct)
- `ProfileUpdater.track()` → updates both `visitHistory` and `repositoryProgress`

**Trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| Current (visitHistory only) | Simple, single source | Loses permanent state |
| Separate repositoryProgress | Correct semantics | Two places to update |
| Increase MAX_VISIT_HISTORY | Delays problem | Doesn't solve it, more storage |
