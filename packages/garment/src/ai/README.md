# Garment AI Module

AI-powered content analysis, learner profiling, and personalized recommendations for Tailor CMS.

## Overview

The Garment AI module transforms educational content into semantically-rich, discoverable learning experiences through:

- **Content Analysis** - Extract and analyze content structure, generate AI metadata (tags, problems, learning outcomes)
- **Learner Profiling** - Build learner profiles from survey responses and behavioral interactions
- **Smart Matching** - Match learners to content based on interests, goals, and progress
- **Behavioral Tracking** - Update profiles dynamically as learners engage with content
- **Integrated Recommendation Engine** - Seamlessly integrated with TailorContent and Repository entities for automatic persistence and caching

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Integrated Recommendation Engine
├─────────────────────────────────────────────────────────────┤
│  TailorContent  →  Repository[]  →  bulk.json (persisted)
│       ↓
│  Distributed Analysis + Global Questions + Recommendations
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Content Analysis
├─────────────────────────────────────────────────────────────┤
│  ContentExtractor → MetadataGenerator → ContentAnalyzer
│       ↓                    ↓                    ↓
│  Text Extraction     AI Metadata Gen.    Catalog Stats
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Learner Profiling
├─────────────────────────────────────────────────────────────┤
│         LearnerProfiler (Main Orchestrator)
│    ┌──────────────────────────────────────────┐
│    │  ProfileBuilder  →  ProfileMatcher
│    │  ProfileUpdater  ←  SurveyGenerator
│    └──────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AI Providers
├─────────────────────────────────────────────────────────────┤
│            BaseAIProvider → OpenAIProvider
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Complete Workflow with TailorContent

The recommended way to use the AI module is through the integrated `TailorContent` API, which handles metadata generation, persistence, cross-repository analysis, and learner profiling automatically.

#### Step 1: Initialize TailorContent

```typescript
import Garment from '@tailor-cms/garment';
import { TailorContent } from '@tailor-cms/garment';
import { OpenAIProvider } from '@tailor-cms/garment/ai';

// Initialize Garment storage
const garment = new Garment({
  provider: 's3', // or 'filesystem'
  config: {
    // your storage config
  }
});

// Set up AI provider
const aiProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4', // or 'gpt-3.5-turbo'
});

// Create TailorContent instance with AI provider
const content = new TailorContent({
  garment,
  aiProvider // Optional: pass here to avoid repeating in method calls
});
await content.init();

console.log(`Loaded ${content.repositories.length} repositories`);
```

#### Step 2: Generate Metadata for All Repositories

This is a **one-time operation** that analyzes all repositories and generates AI metadata. The metadata is automatically stored in `bulk.json` with each repository.

```typescript
// Check current status
const stats = content.getAnalysisStats();
console.log(`Current coverage: ${stats.metadataPercentage}%`);
console.log(`${stats.metadataCount}/${stats.totalRepositories} repositories analyzed`);

// Generate metadata for all repositories without it
// No need to pass aiProvider since it's in constructor
console.log('Generating metadata for all repositories...');
await content.analyzeContent({
  onProgress: (completed, total) => {
    const percent = ((completed / total) * 100).toFixed(1);
    console.log(`Progress: ${completed}/${total} (${percent}%)`);
  },
  concurrency: 3, // Process 3 repositories in parallel (adjust based on API rate limits)
});

// IMPORTANT: Save to persist metadata to bulk.json
await content.save();
console.log('✓ Metadata saved to bulk.json');

// Verify coverage
const finalStats = content.getAnalysisStats();
console.log(`Final coverage: ${finalStats.metadataPercentage}%`);
```

**What gets generated for each repository:**
- **Tags**: Topic tags with weights and categories (e.g., "javascript", "async-await")
- **Problems**: Real-world problems learners can solve
- **Learning Outcomes**: Bloom's taxonomy-aligned objectives
- **Difficulty**: beginner | intermediate | advanced | expert
- **Duration**: Estimated time to complete (minutes)
- **Metrics**: Content complexity, practical focus, interactivity level

#### Step 3: Cross-Repository Analysis

After generating metadata, you can analyze patterns across all repositories:

```typescript
// Get distributed analysis (automatically cached after first call)
const analysis = await content.generateDistributedAnalysis();

console.log('=== Content Catalog Analysis ===\n');

// Tag distribution - most common topics across all content
console.log('Top 10 Tags:');
Object.entries(analysis.tagDistribution)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .forEach(([tag, count]) => {
    console.log(`  ${tag}: ${count} repositories`);
  });

// Category distribution
console.log('\nContent Categories:');
Object.entries(analysis.categoryDistribution).forEach(([category, count]) => {
  console.log(`  ${category}: ${count}`);
});

// Difficulty distribution
console.log('\nDifficulty Distribution:');
Object.entries(analysis.difficultyDistribution).forEach(([level, count]) => {
  const percent = (count / stats.totalRepositories * 100).toFixed(1);
  console.log(`  ${level}: ${count} (${percent}%)`);
});

// Identify content gaps
const beginner = analysis.difficultyDistribution.beginner || 0;
const expert = analysis.difficultyDistribution.expert || 0;
if (beginner < expert) {
  console.log('\n⚠ Gap: Consider creating more beginner-level content');
}
```

#### Step 4: Generate Global Profiling Questions

Create survey questions based on the entire content catalog:

```typescript
// Generate global profiling questions (automatically cached)
const questions = await content.getGlobalProfilingQuestions();

console.log(`\nGenerated ${questions.length} profiling questions:`);
questions.forEach((q, i) => {
  console.log(`\n${i + 1}. ${q.question}`);
  console.log(`   Category: ${q.category}`);
  q.options.forEach((opt, j) => {
    console.log(`   ${String.fromCharCode(97 + j)}. ${opt.label}`);
  });
});

// Use questions in your survey/onboarding flow
// Store questions in your application state
```

#### Step 5: Build Learner Profile from Survey Answers

```typescript
import { ProfileBuilder } from '@tailor-cms/garment/ai';

// Collect answers from learner (example)
const surveyAnswers = {
  'interests': [0, 2, 4],      // Selected option indexes
  'experience': [1],            // intermediate level
  'goals': [0, 1],              // Multiple goals
  'learning-style': [2],
  'time-commitment': [1],
};

// Build profile
const builder = new ProfileBuilder();
const learnerProfile = builder.build(surveyAnswers, questions, {
  trackDifficulty: true,  // Enable difficulty-based matching
});

console.log('\n=== Learner Profile ===');
console.log('Experience Level:', learnerProfile.experienceLevel);
console.log('Goals:', learnerProfile.goals);
```

#### Step 6: Get Personalized Recommendations

```typescript
// Get personalized content recommendations
const recommendations = await content.suggestContent(learnerProfile, {
  limit: 10,
  includeCompleted: false,  // Exclude already completed content
  boostRecent: true,        // Boost recently updated content
  recentBoostWeight: 0.2,   // 20% boost
  recentDays: 30,           // Content updated in last 30 days
});

console.log('\n=== Recommended for You ===\n');
recommendations.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.name}`);
  console.log(`   Match Score: ${rec.score}%`);
  console.log(`   Reason: ${rec.reason}`);
  console.log(`   Shared Topics: ${rec.sharedTags.join(', ')}`);
  if (rec.sharedProblems.length > 0) {
    console.log(`   Relevant Problems: ${rec.sharedProblems.join(', ')}`);
  }
  console.log();
});
```

#### Step 7: Track Learning Progress and Update Profile

```typescript
// Get recommendation engine for advanced operations
const engine = await content.generateDistributedAnalysis(aiProvider);
const profiler = engine.profiler;

// Track when learner completes content
const { profile: updatedProfile, updates } = profiler.updateFromInteraction(
  learnerProfile,
  'repository-uid-123',
  'complete',    // action: 'view' | 'complete' | 'bookmark' | 'skip'
  3600000        // duration in ms (1 hour)
);

console.log('\n=== Profile Updated ===');
updates.forEach(update => {
  const sign = update.delta > 0 ? '+' : '';
  console.log(`${update.tag}: ${update.oldValue.toFixed(3)} → ${update.newValue.toFixed(3)} (${sign}${update.delta.toFixed(3)})`);
});

// Get updated recommendations
const newRecs = await content.suggestContent(updatedProfile, {
  limit: 5,
});

console.log('\nNext recommended content:');
newRecs.forEach(rec => console.log(`  - ${rec.name} (${rec.score}% match)`));

// Persist profile (serialize for storage)
const serializedProfile = profiler.serializeProfile(updatedProfile);
// Store in database or localStorage
await saveProfileToDatabase(learnerId, serializedProfile);
```

#### Step 8: Cache Management and Incremental Updates

```typescript
// Check cache status
const stats = content.getAnalysisStats();
console.log('Cache Status:', {
  built: stats.cacheBuilt,
  age: stats.cacheAge ? `${(stats.cacheAge / 1000 / 60).toFixed(1)} minutes` : 'N/A',
  coverage: `${stats.metadataPercentage}%`,
});

// Add new repositories and update metadata
// (only generates for repositories without metadata)
await content.analyzeContent();
await content.save();

// Invalidate cache to rebuild with new data
content.invalidateRecommendationEngine();

// Next analysis call will rebuild cache
const freshAnalysis = await content.generateDistributedAnalysis();
```

#### Complete Example: Onboarding to Recommendations

```typescript
async function onboardLearner(content: TailorContent, aiProvider: AIProvider) {
  // 1. Ensure metadata exists
  if (!content.hasRecommendationMetadata()) {
    console.log('Generating metadata for all repositories...');
    await content.analyzeContent({
      onProgress: (done, total) => console.log(`${done}/${total}`),
    });
    await content.save();
  }

  // 2. Get profiling questions
  const questions = await content.getGlobalProfilingQuestions();

  // 3. Present questions to learner
  // (In real app: show UI, collect answers)
  const answers = await collectAnswersFromLearner(questions);

  // 4. Build profile
  const builder = new ProfileBuilder();
  const profile = builder.build(answers, questions, {
    trackDifficulty: true,
  });

  // 5. Get initial recommendations
  const recommendations = await content.suggestContent(profile, {
    limit: 10,
    includeCompleted: false,
  });

  // 6. Return profile and recommendations
  return { profile, recommendations };
}

async function trackProgress(
  content: TailorContent,
  aiProvider: AIProvider,
  profile: LearnerProfile,
  repositoryId: string,
  action: 'view' | 'complete' | 'bookmark' | 'skip',
  duration?: number
) {
  // Get profiler
  const engine = await content.generateDistributedAnalysis(aiProvider);
  const profiler = engine.profiler;

  // Update profile based on interaction
  const { profile: updated } = profiler.updateFromInteraction(
    profile,
    repositoryId,
    action,
    duration
  );

  // Get fresh recommendations
  const recommendations = await content.suggestContent(updated, {
    limit: 5,
  });

  // Persist updated profile
  const serialized = profiler.serializeProfile(updated);
  await saveProfile(serialized);

  return { profile: updated, recommendations };
}
```

#### Data Persistence

All metadata is automatically stored in `bulk.json`:

```json
{
  "repositories": [
    {
      "uid": "repo-123",
      "name": "Learn JavaScript Async",
      "recommendationMetadata": {
        "id": "repo-123",
        "name": "Learn JavaScript Async",
        "tags": [
          { "name": "javascript", "category": "topic", "weight": 0.9 },
          { "name": "async-await", "category": "skill", "weight": 0.85 },
          { "name": "promises", "category": "concept", "weight": 0.8 }
        ],
        "problems": [
          {
            "id": "prob-1",
            "title": "Handle Multiple API Calls",
            "description": "Fetch data from multiple endpoints...",
            "difficulty": "intermediate"
          }
        ],
        "learningOutcomes": [
          {
            "id": "outcome-1",
            "description": "Apply async/await to handle asynchronous operations",
            "bloomLevel": "apply"
          }
        ],
        "difficulty": "intermediate",
        "estimatedDuration": 120,
        "contentComplexity": 0.6,
        "practicalFocus": 0.8,
        "interactivityLevel": 0.7,
        "generatedAt": "2024-01-15T10:30:00.000Z",
        "modelVersion": "gpt-4"
      },
      "profilingQuestions": [
        {
          "id": "q-repo-123-1",
          "question": "What is your experience with async programming?",
          "category": "experience",
          "options": [...]
        }
      ]
    }
  ]
}
```

**Remember:**
- Call `await content.save()` after generating metadata
- Metadata is loaded automatically on `content.init()`
- Analysis and questions are cached after first generation
- Profile data should be stored separately (in your database)

### 1. Content Analysis (Direct API)

```typescript
import {
  ContentExtractor,
  MetadataGenerator,
  ContentAnalyzer,
  OpenAIProvider,
} from '@tailor-cms/garment';

// Initialize AI provider
const aiProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extract text content from repositories
const extractor = new ContentExtractor();
const extractedContent = await extractor.extract(repository);

// Generate AI metadata
const generator = new MetadataGenerator(aiProvider, {
  maxProblems: 5,
  maxTags: 20,
  maxOutcomes: 6,
});

const metadata = await generator.generate(repository);

console.log(metadata.tags);           // Semantic tags with weights
console.log(metadata.problems);       // Real-world problems
console.log(metadata.difficulty);     // Difficulty level
console.log(metadata.learningOutcomes); // Bloom's taxonomy outcomes
```

### 2. Batch Analysis

```typescript
// Analyze multiple repositories
const results = await generator.generateBatch(repositories, (done, total) => {
  console.log(`Progress: ${done}/${total}`);
});

// Build content catalog
const contentMeta = new Map(
  results.results.map(r => [r.id, r.metadata])
);

// Analyze catalog
const analyzer = new ContentAnalyzer(contentMeta);
const analysis = analyzer.analyze();

console.log('Top tags:', Object.keys(analysis.tagDistribution).slice(0, 10));
console.log('Difficulty distribution:', analysis.difficultyDistribution);
```

### 3. Learner Profiling

```typescript
import { LearnerProfiler } from '@tailor-cms/garment';

// Initialize profiler with content analyzer
const profiler = new LearnerProfiler(analyzer, aiProvider, {
  maxQuestions: 5,
  trackConsumedContent: true,
});

// Generate profiling questions
const questions = await profiler.generateQuestions();

// Build profile from answers
const profile = profiler.buildProfile(
  {
    'interests': [0, 2],      // Selected answer indexes
    'experience': [1],
    'goals': [0],
  },
  questions
);

// Get personalized recommendations
const suggestions = profiler.suggestContent(profile, { limit: 10 });

for (const item of suggestions) {
  console.log(`${item.name}: ${item.score}% match`);
  console.log(`  Reason: ${item.reason}`);
  console.log(`  Tags: ${item.sharedTags.join(', ')}`);
}
```

### 4. Behavioral Tracking

```typescript
// Update profile based on content interactions
const { profile: updatedProfile, updates } = profiler.updateFromInteraction(
  profile,
  'repository-uid',
  'complete',
  120000  // 2 minutes duration
);

// View changes
for (const update of updates) {
  console.log(`${update.tag}: ${update.oldValue} → ${update.newValue} (${update.delta > 0 ? '+' : ''}${update.delta.toFixed(3)})`);
}

// Get "more like this" suggestions
const similar = profiler.getMoreLikeThis('repository-uid', updatedProfile, {
  limit: 5,
});

// Track progress
const completed = profiler.getCompletedRepositories(updatedProfile);
const inProgress = profiler.getInProgressRepositories(updatedProfile);

// Decay old interests (call periodically)
const decayed = profiler.decayInterests(updatedProfile, 0.95);

// Persist profile
const serialized = profiler.serializeProfile(decayed);
// Store in database or localStorage

// Restore later
const restored = profiler.deserializeProfile(serialized);
```

## Core Components

### Content Analysis

See [content-analysis/README.md](./content-analysis/README.md) for detailed documentation.

#### ContentExtractor

Extracts text content from repository entities for AI processing.

```typescript
const extractor = new ContentExtractor({
  maxContentLength: 100000,
  includeMetadata: true,
});

// Extract content
const content = await extractor.extract(repository);

// Convert to plain text
const plainText = extractor.toPlainText(content);

// Chunk for LLM token limits
const chunks = extractor.chunk(content, 8000, 200);

// Register custom element extractor
extractor.registerExtractor('MY_TYPE', (element) => {
  return element.data?.customField || '';
});
```

**Features:**
- Structure-aware extraction (preserves hierarchy)
- Smart chunking (groups complete sections)
- Custom element type extractors
- Handles: TIPTAP_HTML, FILE, MUX_VIDEO, IMAGE, PDF, MULTIPLE_CHOICE, SINGLE_CHOICE

#### MetadataGenerator

Generates AI-powered semantic metadata using LLMs.

```typescript
const generator = new MetadataGenerator(aiProvider, {
  maxProblems: 5,
  maxTags: 20,
  maxOutcomes: 6,
  concurrency: 3,
});

// Generate for single repository
const metadata = await generator.generate(repository);

// Batch processing
const results = await generator.generateBatch(repositories, progressCallback);
```

**Generated Metadata:**
- **Problems**: Real-world problems learners can solve
- **Tags**: Categorized tags (topic, skill, concept, industry, tool) with weights
- **Learning Outcomes**: Bloom's taxonomy-aligned objectives
- **Difficulty**: beginner | intermediate | advanced | expert
- **Duration**: Estimated time to complete
- **Metrics**: Complexity, practical focus, interactivity

#### ContentAnalyzer

Analyzes content metadata across catalog.

```typescript
const analyzer = new ContentAnalyzer(contentMeta);

// Analyze catalog (cached)
const analysis = analyzer.analyze();

console.log(analysis.tagDistribution);       // Tag frequencies
console.log(analysis.categoryDistribution);  // Category breakdown
console.log(analysis.difficultyDistribution); // Difficulty spread

// Get specific metadata
const meta = analyzer.get('repository-id');

// Iterate
for (const [id, meta] of analyzer.entries()) {
  console.log(`${meta.name}: ${meta.difficulty}`);
}
```

### Learner Profiling

See [learner-profile/README.md](./learner-profile/README.md) for detailed documentation.

#### LearnerProfiler

Main orchestrator for learner profiling and content matching.

```typescript
const profiler = new LearnerProfiler(analyzer, aiProvider, {
  maxQuestions: 5,
  trackDifficulty: false,
  trackConsumedContent: true,
  maxRecentTags: 10,
  nodeResolver: (nodeId) => ({
    repositoryId: findRepositoryId(nodeId),
    nodeType: getNodeType(nodeId),
  }),
});

// Generate questions
const questions = await profiler.generateQuestions();

// Build profile
const profile = profiler.buildProfile(answers, questions);

// Get recommendations
const suggestions = profiler.suggestContent(profile, {
  limit: 10,
  includeCompleted: false,
  onlyInProgress: false,
  boostRecent: true,
  recentBoostWeight: 0.2,
  recentDays: 30,
});

// Find similar content
const similar = profiler.getMoreLikeThis('repo-id', profile, {
  sectionId: 'activity-id',  // Optional: section-level matching
  limit: 5,
});

// Update from interactions
const { profile: updated, updates } = profiler.updateFromInteraction(
  profile,
  'node-id',
  'complete',
  5000
);

// Track progress
const completed = profiler.getCompletedRepositories(profile);
const inProgress = profiler.getInProgressRepositories(profile);
const lastInteraction = profiler.getLastInteraction(profile, 'repo-id');

// Decay interests
const decayed = profiler.decayInterests(profile, 0.95);

// Get trending
const trending = profiler.getTrendingInterests(profile, 5);

// Persistence
const serialized = profiler.serializeProfile(profile);
const restored = profiler.deserializeProfile(serialized);
```

#### ProfileMatcher

Calculates match scores and generates recommendations.

```typescript
const matcher = new ProfileMatcher();

// Calculate match score
const score = matcher.calculateScore(profile, metadata);

// Get matched tags
const matchedTags = matcher.getMatchedTags(profile, metadata);

// Generate reasons
const reasons = matcher.generateReasons(profile, metadata);

// Suggest content
const suggestions = matcher.suggestContent(profile, contentMeta, {
  limit: 10,
  excludeCompleted: ['repo-1', 'repo-2'],
  boostRecent: true,
  recentBoostWeight: 0.2,
  recentDays: 30,
});

// Find similar content
const similar = matcher.getMoreLikeThis('repo-id', profile, contentMeta, {
  sectionId: 'activity-id',
  limit: 5,
});
```

**Scoring Formula:**
- Tag affinity: 60% (when difficulty tracking disabled: 100%)
- Difficulty match: 40% (when difficulty tracking enabled)
- Interest boost: Personalized by recent interactions

**Section-Level Matching:**
When `sectionId` is provided, the matcher filters tags to those attributed to specific activities, enabling "more like this activity" suggestions.

#### ProfileUpdater

Updates profiles based on content interactions.

```typescript
const updater = new ProfileUpdater(contentMeta, {
  trackDifficulty: false,
  maxRecentTags: 10,
  trackConsumedContent: true,
  nodeResolver: (nodeId) => ({
    repositoryId: 'repo-123',
    nodeType: 'activity',
  }),
});

// Update from interaction
const { profile, updates } = updater.update(
  profile,
  'node-id',
  'complete',
  120000
);

// Decay interests
const decayed = updater.decay(profile, 0.95);
```

**Action Multipliers:**
- `complete`: +1.0
- `bookmark`: +0.8
- `view` (>60s): +0.5
- `view` (<60s): +0.3
- `skip`: -0.3

**Node Type Weights:**
- `repository`: 1.0
- `activity`: 0.5
- `container`: 0.3
- `element`: 0.2

**Delta Formula:**
```
delta = tag.weight * actionMultiplier * nodeTypeWeight * 0.1
```

#### SurveyGenerator

Generates profiling questions using AI.

```typescript
const generator = new SurveyGenerator(aiProvider, {
  maxQuestions: 5,
  minOptionsPerQuestion: 3,
  maxOptionsPerQuestion: 5,
  minTagFrequency: 3,
  includeGoalQuestion: true,
  includeExperienceQuestion: true,
});

// Generate from content analysis
const questions = await generator.generate(analysis);

// Get defaults (fallback)
const defaults = generator.getDefaults(analysis);
```

### Recommendation Engine (Integrated)

The recommendation engine is now integrated directly into `TailorContent` and `Repository` entities, providing seamless content analysis, learner profiling, and personalized recommendations.

#### Quick Start with Integrated Engine

```typescript
import { TailorContent } from '@tailor-cms/garment';
import { OpenAIProvider } from '@tailor-cms/garment/ai';

// Initialize TailorContent
const content = new TailorContent({ garment });
await content.init();

const aiProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY
});

// 1. Generate metadata (one-time operation, persists to bulk.json)
await content.analyzeContent({
  onProgress: (done, total) => console.log(`${done}/${total}`),
  concurrency: 3,
});
await content.save();

// 2. Get distributed analysis across all repositories
const analysis = await content.generateDistributedAnalysis();

// 3. Get global profiling questions
const questions = await content.getGlobalProfilingQuestions();

// 4. Get personalized recommendations
const suggestions = await content.suggestContent(learnerProfile, {
  limit: 10,
  includeCompleted: false,
});
```

#### TailorContent Methods

**Metadata Generation:**
```typescript
// Generate metadata for all repositories without it
await content.analyzeContent({
  onProgress: (done, total) => console.log(`Progress: ${done}/${total}`),
  concurrency: 3,
});

// Check status
const hasMetadata = content.hasRecommendationMetadata();
const count = content.getMetadataCount();
const stats = content.getAnalysisStats();
console.log(`Coverage: ${stats.metadataPercentage}%`);
```

**Distributed Analysis:**
```typescript
// Get aggregated analysis (cached)
const analysis = await content.generateDistributedAnalysis();

console.log('Tag distribution:', analysis.tagDistribution);
console.log('Difficulty distribution:', analysis.difficultyDistribution);
console.log('Category distribution:', analysis.categoryDistribution);
```

**Global Profiling Questions:**
```typescript
// Generate questions based on all content (cached)
const questions = await content.getGlobalProfilingQuestions();

// Use in survey
questions.forEach(q => {
  console.log(q.question);
  q.options.forEach(opt => console.log(`  - ${opt.label}`));
});
```

**Content Recommendations:**
```typescript
// Get personalized recommendations
const suggestions = await content.suggestContent(learnerProfile, {
  limit: 10,
  includeCompleted: false,  // Exclude completed content
  onlyInProgress: false,     // Only in-progress content
  boostRecent: true,         // Boost recently updated content
  recentBoostWeight: 0.2,    // 20% boost
  recentDays: 30,            // Content updated in last 30 days
});

suggestions.forEach(item => {
  console.log(`${item.name}: ${item.score}% match`);
  console.log(`  Reason: ${item.reason}`);
  console.log(`  Tags: ${item.sharedTags.join(', ')}`);
});
```

**Cache Management:**
```typescript
// Check cache status
const stats = content.getAnalysisStats();
console.log('Cache built:', stats.cacheBuilt);
console.log('Cache age (ms):', stats.cacheAge);

// Invalidate cache after updates
content.invalidateRecommendationEngine();

// Direct access to engine components
const engine = await content.generateDistributedAnalysis();
const analyzer = engine.analyzer;
const profiler = engine.profiler;
```

#### Repository Methods

Each repository stores its own metadata and profiling questions (automatically generated by TailorContent):

```typescript
const repo = content.repositories[0];

// Check status
const hasMetadata = repo.hasRecommendationMetadata();
const hasQuestions = repo.hasProfilingQuestions();

// Access metadata
if (repo.hasRecommendationMetadata()) {
  const meta = repo.recommendationMetadata;
  console.log('Difficulty:', meta.difficulty);
  console.log('Duration:', meta.estimatedDuration, 'minutes');
  console.log('Tags:', meta.tags.map(t => t.name));
  console.log('Problems:', meta.problems.map(p => p.title));
  console.log('Learning Outcomes:', meta.learningOutcomes.map(o => o.description));
}

// Get top tags
const topTags = repo.getTopTags(5);
console.log('Top 5 tags:', topTags);

// Access questions
if (repo.hasProfilingQuestions()) {
  console.log(`${repo.profilingQuestions.length} questions`);
}
```

#### Data Persistence

All metadata is automatically persisted to `bulk.json`:

```typescript
// Metadata stored at repository level
{
  "repositories": [
    {
      "uid": "repo-123",
      "name": "Learn Python",
      "recommendationMetadata": {
        "id": "repo-123",
        "name": "Learn Python",
        "tags": [...],
        "problems": [...],
        "learningOutcomes": [...],
        "difficulty": "beginner",
        "estimatedDuration": 120
      },
      "profilingQuestions": [...]
    }
  ]
}

// Remember to save after generating!
await content.analyzeContent();
await content.save(); // ← Don't forget this!
```

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TailorContent
├─────────────────────────────────────────────────────────────┤
│  analyzeContent()  →  Repository[]
│  generateDistributedAnalysis()          →  ContentAnalyzer
│  getGlobalProfilingQuestions()     →  LearnerProfiler
│  suggestContent()                  →  ProfileMatcher
│  generateDistributedAnalysis()         →  Full Engine Access
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Repository
├─────────────────────────────────────────────────────────────┤
│  recommendationMetadata (field)    →  ContentMeta
│  profilingQuestions (field)        →  ProfileQuestion[]
│  analyzeContent()  →  MetadataGenerator
│  generateProfilingQuestions()      →  SurveyGenerator
│  hasRecommendationMetadata()
│  getTopTags()
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Persisted to bulk.json
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- **Repository-level storage**: Each repository stores its own metadata and questions
- **Distributed analysis**: TailorContent aggregates across all repositories
- **Lazy computation**: Analysis and questions cached after first access
- **Automatic persistence**: Metadata saved with repository data
- **Type-safe**: Full TypeScript support throughout

#### Benefits Over Direct API Usage

**Before (Direct API):**
```typescript
const generator = new MetadataGenerator(aiProvider);
const metadataMap = await generator.generateBatch(repositories);
// Manual persistence, no caching, verbose API
```

**After (Integrated):**
```typescript
await content.analyzeContent();
await content.save();
// Auto-persisted, cached, clean API
```

**Benefits:**
- Automatic persistence with repository data
- Built-in caching for analysis and questions
- Simpler API with fewer classes to manage
- Type-safe integration with existing entities
- Progress tracking and stats out of the box

### AI Providers

See [providers/README.md](./providers/README.md) for detailed documentation.

#### OpenAI

```typescript
import { OpenAIProvider } from '@tailor-cms/garment';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-5.1',  // default
  timeout: 60000,
});

// Text completion
const text = await provider.complete('Generate a summary...', {
  temperature: 0.7,
  maxTokens: 4096,
});

// Structured output (JSON)
const result = await provider.generateStructured<{ tags: string[] }>(
  'Generate tags...',
  { temperature: 0.1 }
);

// Embeddings
const embedding = await provider.embed('search query');
```

#### Custom Provider

```typescript
import { BaseAIProvider, type CompletionOptions } from '@tailor-cms/garment';

class MyProvider extends BaseAIProvider {
  name = 'my-provider';

  protected getDefaultModel(): string {
    return 'my-model-v1';
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    // Your implementation
    const response = await fetch('https://api.example.com/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, ...options }),
    });
    return response.text();
  }
}

const provider = new MyProvider({
  apiKey: 'your-key',
});
```

## Data Types

### ContentMeta

AI-generated metadata for a repository.

```typescript
interface ContentMeta {
  id: string;                      // Repository UID
  name: string;                    // Repository name

  // AI-generated metadata
  problems: Problem[];             // Real-world problems
  tags: Tag[];                     // Semantic tags
  learningOutcomes: LearningOutcome[];
  prerequisites: Prerequisite[];
  difficulty: DifficultyLevel;     // beginner | intermediate | advanced | expert
  estimatedDuration: number;       // Minutes

  // Content metrics
  contentComplexity: number;       // 0-1
  practicalFocus: number;          // 0-1 (0=theory, 1=hands-on)
  interactivityLevel: number;      // 0-1

  // Metadata
  generatedAt: Date;
  modelVersion: string;
}
```

### Tag

```typescript
interface Tag {
  name: string;                    // e.g., 'async-await', 'python'
  category: TagCategory;           // topic | skill | concept | industry | tool
  weight: number;                  // 0-1 relevance score
  parent?: string;                 // Hierarchical parent tag
  sectionIds?: string[];           // Activity UIDs where tag applies
}
```

### Problem

```typescript
interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;                // e.g., 'data-analysis', 'web-development'
  difficulty: DifficultyLevel;
  requiredSkills: string[];
  estimatedTime: number;           // Minutes
}
```

### LearningOutcome

```typescript
interface LearningOutcome {
  id: string;
  description: string;             // What learner will be able to do
  bloomLevel: BloomLevel;          // remember | understand | apply | analyze | evaluate | create
  measurable: boolean;
  assessmentCriteria?: string[];
}
```

### LearnerProfile

```typescript
interface LearnerProfile {
  id: string;
  answers: Record<string, number[]>;

  // 6D affinities (topic, skill, concept, industry, tool, goal)
  affinities: DimensionalAffinities;
  experienceLevel?: DifficultyLevel;

  // Explicit data
  goals: string[];

  // Behavioral tracking
  recentTags: string[];
  visitHistory?: VisitEntry[];
  engagement?: EngagementMetrics;

  createdAt: Date;
  updatedAt: Date;
}
```

### RelatedContent

```typescript
interface RelatedContent {
  id: string;
  name: string;
  score: number;                   // 0-100
  reason: string;                  // Human-readable explanation
  relationship: RelationshipType;  // similar-topic | builds-on | complementary
  sharedTags: string[];
  sharedProblems: string[];
  sectionId?: string;              // Best matching activity UID
}
```

## Configuration

### MetadataGeneratorOptions

```typescript
interface MetadataGeneratorOptions {
  maxProblems?: number;            // Default: 5
  maxTags?: number;                // Default: 10
  maxOutcomes?: number;            // Default: 5
  concurrency?: number;            // Default: 3
}
```

### LearnerProfilerOptions

```typescript
interface LearnerProfilerOptions {
  // Survey generation
  maxQuestions?: number;           // Default: 5
  minOptionsPerQuestion?: number;  // Default: 3
  maxOptionsPerQuestion?: number;  // Default: 5

  // Profile updates
  trackDifficulty?: boolean;       // Default: false
  maxRecentTags?: number;          // Default: 10
  trackConsumedContent?: boolean;  // Default: true
  nodeResolver?: NodeResolver;     // Optional: resolve node details

  // Logging
  logger?: GarmentLogger;
}
```

## Advanced Features

### Section-Level Matching

Tags can include `sectionIds` (activity UIDs) for granular matching:

```typescript
// Generate metadata with section IDs
const metadata = await generator.generate(repository);

// metadata.tags[0].sectionIds = ['activity-123', 'activity-456']

// Find content similar to specific activity
const similar = profiler.getMoreLikeThis('repo-id', profile, {
  sectionId: 'activity-123',  // Only match tags from this activity
  limit: 5,
});

// Result includes best matching section
// similar[0].sectionId = 'activity-789'
```

### Granular Interaction Tracking

Track interactions at any content level (repository, activity, container, element):

```typescript
const profiler = new LearnerProfiler(analyzer, aiProvider, {
  nodeResolver: (nodeId) => {
    const node = findNode(nodeId);
    return {
      repositoryId: node.repositoryId,
      nodeType: node.type,           // 'repository' | 'activity' | 'container' | 'element'
      nodeTags: node.tags,           // Optional: specific tags for this node
    };
  },
});

// Track element-level interaction
profiler.updateFromInteraction(profile, 'element-uid-123', 'view', 5000);

// Track activity completion
profiler.updateFromInteraction(profile, 'activity-uid-456', 'complete');

// Track repository bookmark
profiler.updateFromInteraction(profile, 'repo-uid-789', 'bookmark');
```

### Interest Decay

Prevent stale interests from dominating recommendations:

```typescript
// Call periodically (e.g., daily)
const decayed = profiler.decayInterests(profile, 0.95);

// After 30 days: weight * 0.95^30 ≈ 21% of original
```

### Custom Element Extractors

Handle custom content types:

```typescript
const extractor = new ContentExtractor();

extractor.registerExtractor('CUSTOM_VIDEO', (element) => {
  return [
    element.data.title,
    element.data.description,
    element.data.transcript,
  ]
    .filter(Boolean)
    .join(' ');
});

extractor.registerExtractor('FLASHCARD_DECK', (element) => {
  const cards = element.data.cards || [];
  return cards
    .map(card => `${card.front} ${card.back}`)
    .join(' ');
});
```

## Best Practices

### Cost Management

- Cache generated metadata to avoid re-processing unchanged content
- Use appropriate `concurrency` settings based on API rate limits
- Consider token costs when setting `maxTokens` in completion options

### Performance

- Use `chunk()` for large content that exceeds token limits
- Batch process repositories with `generateBatch()` for efficiency
- Cache analyzer results with `analyze()` (cached after first call)

### Monitoring

- Implement progress callbacks for batch operations
- Track `processingTime` in batch results
- Use structured logging with custom logger

### Error Handling

```typescript
try {
  const results = await generator.generateBatch(repositories);

  if (results.errorCount > 0) {
    console.warn(`${results.errorCount} repositories failed:`);
    for (const error of results.errors) {
      console.error(`  ${error.id}: ${error.error}`);
    }
  }

  console.log(`Success: ${results.successCount}/${repositories.length}`);
} catch (error) {
  console.error('Batch generation failed:', error);
}
```

## Module Structure

```
src/ai/
├── index.ts                       # Main exports
├── types.ts                       # Type re-exports
├── core-settings.ts               # Constants and thresholds
├── README.md                      # This file
│
├── content-analysis/              # Content extraction and analysis
│   ├── ContentExtractor.ts        # Text extraction
│   ├── MetadataGenerator.ts       # AI metadata generation
│   ├── ContentAnalyzer.ts         # Catalog analysis
│   ├── index.ts
│   ├── README.md
│   └── prompts/                   # AI prompts
│       ├── problem-prompt.ts
│       ├── tag-prompt.ts
│       ├── outcome-prompt.ts
│       ├── summary-prompt.ts
│       └── index.ts
│
├── learner-profile/               # Learner profiling and matching
│   ├── LearnerProfiler.ts         # Main orchestrator
│   ├── ProfileMatcher.ts          # Content matching
│   ├── ProfileUpdater.ts          # Behavioral updates
│   ├── utils.ts                   # Utilities
│   ├── index.ts
│   ├── README.md
│   ├── DATA-FLOW.md
│   └── survey-profiling/
│       ├── ProfileBuilder.ts      # Build profiles from answers
│       └── survey/                # Survey generation
│           ├── SurveyGenerator.ts
│           ├── create-multiple-choice.ts
│           ├── survey-default.ts
│           ├── survey-creation-prompt.ts
│           └── index.ts
│
├── providers/                     # AI provider implementations
│   ├── base.ts                    # Base provider class
│   ├── openai.ts                  # OpenAI implementation
│   ├── index.ts
│   └── README.md
│
└── types/                         # Type definitions
    ├── index.ts                   # Main type exports
    ├── taxonomies.ts              # Enums and classifications
    ├── content-metadata.ts        # Content metadata types
    ├── content-extraction.ts      # Extraction types
    ├── learner-profile.ts         # Profile types
    ├── recommendations.ts         # Recommendation types
    ├── analysis.ts                # Analysis result types
    ├── ai-provider.ts             # Provider interfaces
    └── persistence.ts             # Serialization types
```

## Examples

See the sub-module READMEs for detailed examples:
- [Content Analysis Examples](./content-analysis/README.md)
- [Learner Profile Examples](./learner-profile/README.md)
- [Provider Examples](./providers/README.md)

## License

Part of @tailor-cms/garment
