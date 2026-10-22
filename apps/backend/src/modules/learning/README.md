# Learning Module

Tracks learner interactions and builds personalized content recommendations
using a 6-dimensional affinity model (topic, skill, concept, industry, tool,
goal).

## Core Responsibilities

- **Activity Tracking**: Records user interactions (view, complete, bookmark,
  skip) with content nodes, capturing entry points, engagement signals, and
  device info. Updates learner affinities based on content tags.

- **Onboarding**: Processes survey responses to initialize learner profiles
  with seed affinities, experience level, and goals.

- **Recommendations**: Matches content to learner profiles using affinity
  scores, with support for recency boosting and progress filtering.

- **Continue Learning**: Surfaces in-progress content sorted by recency for
  "pick up where you left off" experiences.

## Dependencies

- **garment**: `ProfileBuilder`, `ProfileMatcher`, and `getContinueLearning`
- **ContentService**: Content graph and similarity matching
- **UserService**: Profile persistence
