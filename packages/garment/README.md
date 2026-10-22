# 👕 Garment

Type-safe TypeScript library for loading and managing Tailor CMS content from S3 storage.

## Features

- **Bulk Loading** - Single compressed file instead of hundreds of S3 requests
- **Indexed Search** - Fast entity search across repositories
- **Access Control** - Built-in user and group permission management
- **Smart Caching** - Separate serialization for caching vs storage
- **Event System** - Track loading, signing, and dirty state changes
- **Deferred Operations** - Non-blocking re-signing for stale content
- **Type Safe** - Full TypeScript support
- **Flexible Logging** - Pluggable logger with telemetry control

## Installation

```bash
npm install @tailor-cms/garment
# or
pnpm add @tailor-cms/garment
```

## Quick Start

```typescript
import Garment from '@tailor-cms/garment';
import { TailorContent } from '@tailor-cms/garment';

// Initialize Garment storage
const garment = new Garment({
  provider: 'aws',
  bucket: 'my-bucket',
  aws: {
    keyId: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
  },
});

// Create TailorContent and load repositories
const content = new TailorContent({ garment });
await content.init(); // Load content and sync changes

// Search across all repositories
const videos = content.search('ContentElement', { type: 'MUX_VIDEO' });

// Sign all URLs
await content.makePublic();
```

## Table of Contents

- [Core Concepts](#core-concepts)
- [AI-Powered Recommendations](#ai-powered-recommendations)
  - [Complete Workflow Example](#complete-workflow-example)
- [Logging](#logging)
- [TailorContent](#tailorcontent)
- [Loading Individual Repositories](#loading-individual-repositories)
- [Repository Access Control](#repository-access-control)
- [Indexed Search](#indexed-search)
- [Content Graph](#content-graph)
- [Bulk Operations](#bulk-operations)
- [Signing & Public URLs](#signing--public-urls)
- [Collections & Queries](#collections--queries)
- [Caching & Serialization](#caching--serialization)
- [Events & State Management](#events--state-management)
- [API Reference](#api-reference)

## AI-Powered Recommendations

Garment includes a powerful AI module for content analysis, learner profiling, and personalized recommendations.

### Complete Workflow Example

Here's a complete workflow from metadata generation to learner profiling and personalized recommendations:

```typescript
import Garment from '@tailor-cms/garment';
import { TailorContent, OpenAIProvider } from '@tailor-cms/garment';

// 1. Set up storage and AI provider
const garment = new Garment({
  provider: 'aws',
  bucket: 'my-bucket',
  aws: {
    keyId: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
  },
});

const aiProvider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
});

// 2. Initialize TailorContent with AI provider
const content = new TailorContent({
  garment,
  aiProvider, // Pass aiProvider to constructor
});
await content.init(); // Load content and check for changes

console.log(`Loaded ${content.repositories.length} repositories`);

// 3. Generate AI metadata for all repositories (one-time operation)
// This analyzes each repository and generates:
// - Tags (topics, skills, concepts)
// - Learning outcomes
// - Problems learners can solve
// - Difficulty levels
// - Cross-repository analysis
// - Profiling questions
await content.analyzeContent({
  onProgress: (done, total) => console.log(`${done}/${total} analyzed`),
  concurrency: 3, // Parallel processing
});

// Save metadata to bulk.json (persisted with repositories)
await content.save();

// 4. Get comprehensive analysis summary
const summary = content.getAnalysisSummary();
console.log('Analysis Coverage:', `${summary.coveragePercentage}%`);
console.log('Top Tags:', summary.tagDistribution.slice(0, 10).map(t => t.tag));
console.log('Difficulty Distribution:', summary.difficultyDistribution);
console.log('Profiling Questions:', summary.profilingQuestions.length);

// 5. Present profiling questions to learner and collect answers
const answers = {
  'interests': [0, 2],      // Selected option indexes
  'experience': [1],        // Intermediate level
  'goals': [0],
};

// 6. Build learner profile from survey answers
const profile = content.profiler.buildProfile(
  'user-123',  // User ID
  answers,
  summary.profilingQuestions,
  { trackDifficulty: true }
);

console.log('Experience Level:', profile.experienceLevel);
console.log('Goals:', profile.goals);

// 7. Get personalized recommendations
const suggestions = await content.suggestContent(profile, {
  limit: 10,
  includeCompleted: false,  // Exclude completed content
  boostRecent: true,        // Boost recently updated content
});

console.log('\n=== Recommended for You ===');
suggestions.forEach(rec => {
  console.log(`${rec.name} (${rec.score}% match)`);
  console.log(`  Reason: ${rec.reason}`);
  console.log(`  Topics: ${rec.sharedTags.join(', ')}`);
});

// 8. Get "more like this" recommendations for a specific repository
const similarContent = await content.getSimilarActivities(
  'repo-123',        // Repository UID
  'activity-456',    // Section UID (activity/container)
  profile,
  { limit: 5 }
);

// 9. Track learner activity and update profile
const { profile: updatedProfile, updates } = content.activity.update(
  profile,
  'repo-123',      // Content node UID
  'complete',      // action: 'view' | 'complete' | 'bookmark' | 'skip'
  3600000          // duration in ms (optional)
);

console.log('\n=== Profile Updates ===');
updates.forEach(update => {
  console.log(`${update.tag}: ${update.oldValue.toFixed(3)} → ${update.newValue.toFixed(3)}`);
});

// 10. Get updated recommendations based on new interactions
const nextRecs = await content.suggestContent(updatedProfile, {
  limit: 5,
  onlyInProgress: false,
});

// 11. Serialize profile for storage
const serialized = content.profiler.serializeProfile(updatedProfile);
// Store in database: await db.users.update(userId, { activity: serialized });

// 12. Restore profile from storage
const restoredProfile = content.profiler.deserializeProfile(serialized);
```

### What Gets Generated

When you call `analyzeContent()`, Garment generates:

**Per-Repository Metadata:**
- **Tags**: `{ name: 'async-await', category: 'skill', weight: 0.85 }`
- **Problems**: Real-world scenarios learners can solve
- **Learning Outcomes**: Bloom's taxonomy-aligned objectives
- **Difficulty**: beginner | intermediate | advanced | expert
- **Duration**: Estimated completion time in minutes
- **Prerequisites**: Required knowledge and skills
- **Metrics**: Content complexity, practical focus, interactivity

**Cross-Repository Analysis:**
- **Tag Distribution**: Frequency of topics across all content
- **Category Distribution**: Content type distribution
- **Difficulty Distribution**: Difficulty level breakdown
- **Profiling Questions**: Auto-generated survey for learner assessment

All metadata is automatically saved to `bulk.json` and loaded on subsequent initializations.

### Key Features

✅ **Integrated with TailorContent** - AI features built into core entities with automatic persistence
✅ **Automatic Generation** - One command analyzes all repositories and generates metadata
✅ **Cross-Repository Analysis** - Identify trends, gaps, and patterns across all content
✅ **Learner Profiling** - Build profiles from survey responses with `LearnerProfiler`
✅ **Smart Matching** - Match learners to content based on interests and experience
✅ **Behavioral Tracking** - Update profiles dynamically with `ProfileUpdater` as learners engage
✅ **Activity-Level Recommendations** - Get similar content for specific activities/sections
✅ **Profile Serialization** - Efficient JSON serialization for database storage
✅ **Recommendation Caching** - Analysis results cached for performance

### API Integration

The AI module is fully integrated with `TailorContent`:

```typescript
// Access AI components
content.profiler       // LearnerProfiler - profile building and management
content.activity       // ProfileUpdater - track user interactions
content.analyzer       // ContentAnalyzer - get formatted analysis data

// Check analysis status
content.hasAnalysis                 // boolean: has complete analysis
content.getAnalysisSummary()        // Get full analysis with questions
content.getAnalysisStats()          // Get coverage and status
content.getMetadataCount()          // Count of analyzed repositories

// Get recommendations
await content.suggestContent(profile, options)
await content.getSimilarActivities(repoUid, sectionUid, profile, options)

// Manage content analysis
await content.analyzeContent(options)      // Generate/update metadata
content.getAnalysisCoverage()              // Get coverage stats
```

See [`src/ai/README.md`](./src/ai/README.md) for detailed API documentation and advanced usage.

## Core Concepts

### Content Hierarchy

```
TailorContent
  └── repositories: Repository[]
      └── structure: Activity[]
          └── contentContainers: ContentContainer[]
              ├── elements: ContentElement[]
              └── containers: ContentContainer[] (nested)
```

### Entity Types

- **TailorContent** - Collection wrapper for all repositories
- **Repository** - Top-level content structure
- **Activity** - Learning activities or modules
- **ContentContainer** - Groups of content (can be nested)
- **ContentElement** - Individual content items
- **CatalogEntry** - Lightweight repository metadata

## Logging

By default, only errors are logged. Enable debug mode for detailed operation logs.

### Silent Mode (Default)

```typescript
const garment = new Garment(storageConfig, {
  sourcePath: 'repository',    // Default
  snapshotPath: 'snapshots',   // Default
  fileKeyProp: 'id',           // Default
})
```

### Debug Mode

```typescript
const garment = new Garment(storageConfig, {
  ...config,
  logger: {
    logLevel: 'debug',    // Enable debug output
    telemetry: true,      // Show metrics (default)
    colors: true,         // Color output (default)
  },
})
```

**Example output with telemetry:**
```
[TailorContent] Loaded from cache (10 repos, 1234 entities)
[Repository:123] Loaded (50 activities, 234 containers, 1000 elements)
```

**Example output without telemetry:**
```typescript
logger: { logLevel: 'debug', telemetry: false }
```
```
[TailorContent] Loaded from cache
[Repository:123] Loaded from S3
```

### Custom Logger

```typescript
import pino from 'pino'

const garment = new Garment(storageConfig, {
  ...config,
  logger: {
    logger: pino({ level: 'debug' }),
    logLevel: 'debug',
    colors: false,
  },
})
```

### Configuration

```typescript
interface LoggerConfig {
  logger?: Logger          // Custom logger (default: console)
  logLevel?: LogLevel      // 'debug' | 'info' | 'warn' | 'error' (default: 'error')
  colors?: boolean         // Enable colorization (default: true)
  silent?: boolean         // Disable all logging (default: false)
  telemetry?: boolean      // Show metrics (default: true)
}
```

## TailorContent

Unified access to all repositories with intelligent caching and automatic refresh.

### Initializing Content

```typescript
import Garment from '@tailor-cms/garment';
import { TailorContent } from '@tailor-cms/garment';

// Set up Garment storage
const garment = new Garment({
  provider: 'aws',
  bucket: 'my-bucket',
  aws: {
    keyId: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
  },
});

// Create and initialize TailorContent
const content = new TailorContent({ garment });
await content.init(); // Load repositories and sync changes
```

### How It Works

**First Initialization:**
1. Fetch `repository/index.json` (catalog)
2. Load each repository from individual files
3. Save to `repository/bulk.json.zst` (compressed)

**Subsequent Initializations:**
1. Load `repository/bulk.json.zst` (single request)
2. Check catalog for changes
3. Reload only changed repositories
4. Sync new/deleted repositories

**Manual Refresh:**
```typescript
// Check for and sync repository changes
await content.init() // Automatically checks catalog
await content.syncChangedRepositories() // Force sync changed repos
```

### Accessing Repositories

```typescript
// Get all repositories via view
const view = content.forGroup(groupId); // or content.forUser(userId)
const all = view.all(); // Returns RepositoryCollection

// Find by ID or UID
const repo = view.find(123);
const repo = view.find('repo-uid-123');

// Get any content node by UID (O(1) lookup)
const result = view.findNode('activity-uid-123');
console.log(result.entity);      // The entity (Activity, Container, etc.)
console.log(result.entityType);  // 'Activity'
console.log(result.repositoryUid); // Parent repository UID

// Get statistics
const stats = view.getStats();
// { repositories: 10, activities: 150, containers: 1200, elements: 5000 }
```

## Loading Individual Repositories

```typescript
import Garment from '@tailor-cms/garment'

const garment = new Garment({
  provider: 'aws',
  bucket: 'my-bucket',
  aws: {
    keyId: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
  },
})

// Load repository outline (fast, no nested content)
const repository = await garment.source().get(123)

// Load all nested content
await repository.load()

// Or eager load in one call
const repository = await garment.source().get(123, { eager: true })
```

## Repository Access Control

Manage user and group access permissions for repositories. The backend automatically maintains access files in S3 whenever:
- Users are added/removed from repositories
- User groups are added/removed from repositories
- Users join/leave groups
- User roles change

### Basic Usage

```typescript
import Garment from '@tailor-cms/garment'

const garment = new Garment({
  provider: 'aws',
  bucket: 'my-bucket',
  aws: {
    keyId: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
  },
})

// Load repository
const repository = await garment.source().get(123)

// Access data is automatically loaded with save()
await repository.load()
await repository.save()

// Access repository permissions
console.log(repository.access?.id)             // 123
console.log(repository.access?.uid)            // "repo_abc123"
console.log(repository.access?.users.length)   // Direct user access
console.log(repository.access?.groups.length)  // Group-based access

// Manually reload access data
await repository.reloadAccess()
```

### Access Data Structure

```typescript
interface RepositoryAccessData {
  id: number                         // Repository ID
  uid: string                        // Repository UID
  users: RepositoryAccessUser[]      // All users (direct access or group members)
  groups: RepositoryAccessGroup[]    // All user groups with access
  updatedAt: string                  // ISO timestamp of last update
}
```

### User Access

Users can access repositories in two ways:

1. **Direct Access** - Assigned directly to repository (role: ADMIN or AUTHOR)
2. **Group Access** - Via user group membership (various roles)

The `users` array contains **only directly assigned users**:

```typescript
const repository = await garment.source().get(123)
await repository.load()
await repository.save()

// User with direct repository access
repository.access?.users[0]
{
  id: 1,
  email: "admin@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "ADMIN",
  assignedAt: "2025-11-16T18:27:25.519Z"
}
```

Users with **only group access** do NOT appear in the `users` array - 
they only appear in `groups[].members`.

### Group Information

User groups include their members with group-specific roles:

```typescript
repository.access?.groups.forEach(group => {
  console.log(group.id)       // 1
  console.log(group.name)     // "Engineering Team"
  console.log(group.logoUrl)  // "https://..."

  // Group members with their roles
  group.members.forEach(member => {
    console.log(member.id)         // 4
    console.log(member.email)      // "user@example.com"
    console.log(member.firstName)  // "Jane"
    console.log(member.lastName)   // "Smith"
    console.log(member.role)       // "ADMIN" (role within this group)
  })
})
```

**Note**: A user can have both direct repository access AND group access. In this case:
- They appear in the `users` array with their direct role
- They also appear in `groups[].members` with their group-specific role(s)

### Managing Access Across Repositories

Use `AccessManager` to aggregate and query access control across multiple repositories:

```typescript
import { AccessManager, TailorContent } from '@tailor-cms/garment'

// Load all content
const content = await TailorContent.load({
  provider: 'aws',
  bucket: 'my-bucket',
  aws: { /* ... */ },
})

// Create access manager and load access data
const accessManager = new AccessManager(content.repositories)
await accessManager.loadAll()

// Query users and groups
const allUsers = accessManager.getUsers()
const allGroups = accessManager.getGroups()
const groupUsers = accessManager.getUsers(groupId)

// Check repository access
const hasAccess = accessManager.hasRepositoryAccess(userId, repositoryId)
const userRepos = accessManager.getUserRepositories(userId)
const groupRepos = accessManager.getGroupRepositories(groupId)

// Get user roles (direct + group-based)
const roles = accessManager.getUserRoles(userId, repositoryId)
// Returns: [
//   { groupId: undefined, role: 'ADMIN' },      // Direct access
//   { groupId: 5, role: 'COLLABORATOR' },       // Via group 5
//   { groupId: 8, role: 'USER' }                // Via group 8
// ]

// Get specific role
const directRole = accessManager.getUserRole(userId, repositoryId, undefined)
const groupRole = accessManager.getUserRole(userId, repositoryId, groupId)

// Reload all access data (e.g., after updates)
await accessManager.reloadAll()
```

## Indexed Search

Search across all repositories with O(1) UID lookups and efficient indexed queries.

### Search by Type

```typescript
const content = new TailorContent({ garment });
await content.init();

// Create a view for searching
const view = content.forGroup(groupId); // or content.forUser(userId)

// Search by entity type and criteria
const videos = view.search('ContentElement', { type: 'MUX_VIDEO' });
const assessments = view.search('ContentContainer', { type: 'ASSESSMENT' });
const lessons = view.search('Activity', { type: 'LESSON' });
```

### Search Results

```typescript
const results = view.search('ContentElement', { type: 'MUX_VIDEO' });

for (const result of results) {
  console.log(result.entity.data.src);  // Element data
  console.log(result.entityType);       // 'ContentElement'
  console.log(result.repositoryUid);    // Repository UID
}
```

### Search Options

```typescript
// Limit results
const videos = view.search('ContentElement', { type: 'MUX_VIDEO' }, {
  limit: 10,
});

// Filter by repository
const repoVideos = view.search('ContentElement', { type: 'MUX_VIDEO' }, {
  repositoryUid: 'repo-123',
  limit: 20,
});

// Multiple criteria (AND)
const results = view.search('ContentElement', {
  type: 'HTML',
  position: 0,
});
```

### Find by UID (O(1) lookup)

```typescript
// Fast UID lookup across all content
const result = view.findNode('ce_abc123');

if (result) {
  console.log(result.entity);        // The entity
  console.log(result.entityType);    // 'ContentElement'
  console.log(result.repositoryUid); // Parent repository
}

// Direct repository lookup
const repo = view.find('repo-uid-123');
const repo = view.find(123); // or by ID
```

## Content Graph

Lightweight, indexed representation of repository structure.

### What Is It?

```typescript
// Full entities (heavy)
const repository = await garment.source().get(123)
await repository.load()

// Content Graph (lightweight)
const graph = await repository.getContentGraph()
// Only node metadata: [id, uid, type, parentId, position]
```

### Indexed Lookups

```typescript
const graph = await ContentGraph.load(123, 'repository')

// Fast lookups
const node1 = graph.findNodeByUid('activity-123')
const node2 = graph.findActivityById(789)
const node3 = graph.findElementById(101112)
```

### Navigation

```typescript
// Get full path
const path = graph.getNodePath('container-uid')
// {
//   outline: [activity1, activity2],
//   activity: activity2,
//   activityPath: 'contentContainers.0.containers.1'
// }

// Find ancestors
const ancestors = graph.getAncestors('node-uid')
```

### Loading Entities

```typescript
const entity = await graph.loadEntity('some-uid')

if (ContentEntity.isActivity(entity)) {
  await entity.load()
}
```

### When to Use

| Feature | ContentGraph | TailorContent |
|---------|-------------|---------------|
| Single Repository | ✅ Perfect | ⚠️ Overkill |
| Multiple Repositories | ❌ | ✅ Perfect |
| Entity Search | ❌ | ✅ Indexed search |
| Find by UID | ✅ Within repo | ✅ Across all |
| Navigation | ✅ Full paths | ⚠️ Basic |
| Memory | ~50 KB | ~2-3 MB |

## Bulk Operations

### The Problem

Traditional loading requires many S3 calls:

```typescript
const repo = await garment.source().get(123)  // 1 request
await repo.load()                             // N more requests
```

### The Solution

```typescript
// Save as single compressed file
const repository = await garment.source().get(123)
await repository.load()
await repository.save()
// Saves both:
// - repository/123/bulk.json (raw, for compatibility)
// - repository/123/bulk.json.zst (compressed, for performance)

// Load in ONE request (uses compressed version)
const loaded = await Repository.loadFromBulk(123, 'repository')
```

### Compression

Uses zstd compression (~80% size reduction). Both raw and compressed versions are stored for flexibility.

### TailorContent Bulk

```typescript
// Saves compressed bulk automatically
const content = await TailorContent.load()
await content.save()

// Loads from compressed bulk
const loaded = await TailorContent.load()
```

## Signing & Public URLs

### Basic Signing

```typescript
const repository = await garment.source().get(123)
await repository.load()

// Sign for 12 hours (default)
await repository.makePublic()

// Sign for custom duration (seconds)
await repository.makePublic(24 * 60 * 60)
```

### Signing All Content

```typescript
const content = await TailorContent.load()

// Forces ALL repositories to re-sign
await content.makePublic()
```

### Expiration States

```typescript
import { ExpirationState } from '@tailor-cms/garment'

const state = repository.getExpirationState()

switch (state) {
  case ExpirationState.FRESH:
    // URLs valid, plenty of time left
    break
  case ExpirationState.STALE:
    // URLs valid but approaching expiration
    break
  case ExpirationState.EXPIRED:
    // URLs expired, must re-sign
    break
  case ExpirationState.NEVER_SIGNED:
    // Never been signed
    break
}
```

### Conditional Signing

```typescript
if (repository.needsResigning()) {
  await repository.makePublic()
}

if (repository.isStale()) {
  console.warn('URLs will expire soon')
}
```

### Deferred Re-Signing

When content is stale, trigger non-blocking re-signing:

```typescript
const repository = await Repository.fromJSON(cachedData)

// If stale, returns immediately but triggers background re-signing
await repository.makePublic()

// Continue working with current URLs
response.send(repository.toJSON())

// Later: wait for deferred operation
await repository.settled()

// Save updated entity
await cache.set('repo:123', repository.toJSON())
```

## Collections & Queries

### Catalog Collections

```typescript
const catalog = await garment.source().list()

// Get all
const all = catalog.all()

// Count
console.log(catalog.count())

// Find
const entry = catalog.find('repo-uid-123')
const entry = catalog.findById(123)
const first = catalog.first()
```

### Filtering

**Object-style:**

```typescript
const courses = catalog.where({ schema: 'course' })

const published = catalog.where({
  schema: 'course',
  name: 'Introduction to React'
})
```

**Function-style:**

```typescript
const advanced = catalog.where(entry =>
  entry.schema === 'course' && entry.meta.level === 'advanced'
)

const recent = catalog.where(entry =>
  new Date(entry.publishedAt) > new Date('2024-01-01')
)
```

### Searching

```typescript
// Case-insensitive partial match
const results = catalog.search('intro')
```

### Chaining

```typescript
const results = catalog
  .whereSchema('course')
  .where(entry => entry.meta.level === 'advanced')
  .search('react')
  .sortBy('publishedAt', 'desc')
```

### Loading

```typescript
// Load all
const repositories = await catalog.load()

// Or filter first
const courses = catalog.whereSchema('course')
const courseRepos = await courses.load()
```

## Caching & Serialization

### Two Methods

| Method | Use Case | Includes Metadata? |
|--------|----------|-------------------|
| `toJSON()` | Caching (Redis, memory) | ✅ Yes (signedAt, etc.) |
| `toStorage()` | Persistence (S3) | ❌ No (clean data) |

### Caching with Metadata

```typescript
const content = await TailorContent.load()
await content.makePublic()

// Cache with metadata
await cache.set('content', content.toJSON(), { ttl: 3600 })

// Restore from cache
const cached = TailorContent.fromJSON(await cache.get('content'))
```

### Storage without Metadata

```typescript
const content = await TailorContent.load()

// Store clean data (compressed)
await content.save()

// Restore
const stored = await TailorContent.load()
```

### Clone

```typescript
const content = await TailorContent.load()
const clone = content.clone()
```

## Events & State Management

### Event Types

```typescript
import { EntityEvent } from '@tailor-cms/garment'

EntityEvent.LOADED   // Fired when load() completes
EntityEvent.SIGNED   // Fired when makePublic() completes
EntityEvent.DIRTY    // Fired when entity state changes
```

### Listening to Events

```typescript
const repository = await garment.source().get(123)

repository.on(EntityEvent.LOADED, (data) => {
  console.log('Repository loaded:', data.uid)
})

repository.on(EntityEvent.SIGNED, (data) => {
  console.log('URLs signed:', data.signedAt)
})

repository.on(EntityEvent.DIRTY, (data) => {
  // Trigger cache invalidation
  cache.delete(`repo:${data.uid}`)
})

await repository.load()
```

### Dirty Tracking

Entities track unsaved changes:

```typescript
const repository = await garment.source().get(123)
console.log(repository.isDirty) // false

await repository.load()
console.log(repository.isDirty) // true

await repository.makePublic()
console.log(repository.isDirty) // true

// Mark as clean after saving
repository.markClean()
console.log(repository.isDirty) // false
```

### Save Optimization

The `save()` method checks dirty state:

```typescript
// Skips if not dirty
await repository.save()

// Force save
await repository.save({ force: true })
```

### Cache Invalidation

```typescript
function setupCacheInvalidation(entity: Repository) {
  entity.on(EntityEvent.DIRTY, async (data) => {
    await cache.delete(`repo:${data.uid}`)
  })
}

const repository = await garment.source().get(123)
setupCacheInvalidation(repository)

await repository.load() // Automatically invalidates cache
```

## API Reference

### Garment

```typescript
class Garment {
  constructor(storageConfig: FileStorageConfig, garmentConfig?: Partial<GarmentConfig>)

  source(): {
    list(): Promise<CatalogCollection>
    get(id: number | string, options?: { eager?: boolean }): Promise<Repository>
    getContainer(id: string, repositoryId: string): Promise<ContentContainer>
  }

  snapshot(): {
    get(id: number | string, version: string, options?: { eager?: boolean }): Promise<Repository>
    getContainer(id: string, repositoryId: string): Promise<ContentContainer>
  }

  addContentElementProcessor(processorRegistry: (type: string) => Function): void
  toRepositoryInstance(repository: any): Repository
}

// Config
interface GarmentConfig {
  sourcePath: string       // Default: 'repository'
  snapshotPath: string     // Default: 'snapshots'
  fileKeyProp: 'id' | 'uid'  // Default: 'id'
  logger?: LoggerConfig
}

// Access Control Types
interface RepositoryAccessData {
  id: number
  uid: string
  users: RepositoryAccessUser[]
  groups: RepositoryAccessGroup[]
  updatedAt: string
}

interface RepositoryAccessUser {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  assignedAt: string
}

interface RepositoryAccessGroupMember {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: string
}

interface RepositoryAccessGroup {
  id: number
  name: string
  logoUrl: string | null
  members: RepositoryAccessGroupMember[]
}
```

### TailorContent

```typescript
class TailorContent extends BaseEntity<TailorContent> {
  // Properties
  repositories: Repository[]
  contentAnalysis?: AggregatedContentAnalysis
  profilingQuestions?: ProfileQuestion[]
  contentAnalysisAt?: Date

  // AI Components
  profiler: LearnerProfiler      // Profile building and management
  activity: ProfileUpdater       // Track user interactions
  analyzer: ContentAnalyzer      // Get formatted analysis data

  // Constructor
  constructor(options: TailorContentOptions)

  // Views (with access control)
  forGroup(groupId: number): TailorContentView
  forUser(userId: number): TailorContentView

  // Via TailorContentView:
  view.all(): RepositoryCollection
  view.find(id: number | string): Repository | undefined
  view.findNode(uid: string): SearchResult | null
  view.search(entityType, criteria, options?): SearchResult[]
  view.getStats(): ContentStats
  view.getCatalog(): Promise<CatalogCollection>

  // Initialization & Sync
  async init(): Promise<void>
  async syncChangedRepositories(): Promise<void>
  async save(): Promise<void>
  updateRepositoryAccess(repositoryId: number, accessData: any): void

  // AI & Analysis
  async analyzeContent(options?: AnalyzeContentOptions): Promise<void>
  getAnalysisSummary(): AnalysisSummary
  getAnalysisStats(): AnalysisStats
  getAnalysisCoverage(): CoverageStats
  getMetadataCount(): number
  get hasAnalysis(): boolean

  // Recommendations
  async suggestContent(profile: LearnerProfile, options?: RecommendationOptions): Promise<Recommendation[]>
  async getSimilarActivities(repoUid: string, sectionUid: string, profile: LearnerProfile, options?): Promise<Recommendation[]>

  // Signing
  async makePublic(interval?: number): Promise<TailorContent>

  // Serialization
  toJSON(): any
  toStorage(): any
  clone(): TailorContent
  static fromJSON(data: any): TailorContent

  // Events & State
  on(event: EntityEvent, handler: Function): () => void
  needsResigning(): boolean
  isStale(): boolean
  get isDirty(): boolean
  markClean(): void
  settled(): Promise<this>
}

interface TailorContentOptions {
  garment: Garment
  aiProvider?: AIProvider
}

interface AnalyzeContentOptions {
  repositoryIds?: string[]
  force?: boolean
  onProgress?: (completed: number, total: number) => void
  concurrency?: number
}

interface AnalysisSummary {
  hasAnalysis: boolean
  analyzedRepositories: number
  totalRepositories: number
  coveragePercentage: number
  repositoryIds: string[]
  generatedAt: Date | null
  tagDistribution: Array<{ tag: string; count: number }>
  categoryDistribution: Array<{ category: string; count: number }>
  difficultyDistribution: Array<{ level: string; count: number }>
  profilingQuestions: ProfileQuestion[]
}
```

### Repository

```typescript
class Repository extends BaseEntity<Repository> {
  // Properties
  id: number
  uid: string
  schema: string
  name: string
  description: string
  meta: { [key: string]: any }
  structure: Activity[]
  publishedAt: Date
  access?: RepositoryAccessData

  // Getters
  get isLoaded(): boolean
  get containers(): ContentContainer[]
  get activitiesWithContainers(): Activity[]

  // Methods
  async load(options?: LoadOptions): Promise<Repository>
  async makePublic(interval?: number, options?: MakePublicOptions): Promise<Repository>
  async getContentGraph(): Promise<ContentGraph>
  async save(options?: { force?: boolean }): Promise<void>
  async reloadAccess(): Promise<void>
  async getContainer(id: number | string): Promise<ContentContainer>
  copy(dstPath: string): Promise<void>
  snapshot(): Promise<void>

  // Serialization
  toJSON(): any
  toStorage(): any
  clone(): Repository

  // Static
  static fromJSON(data: any): Repository
  static loadFromBulk(repositoryId: number, envPath: string): Promise<Repository>

  // Events & State
  on(event: EntityEvent, handler: Function): () => void
  needsResigning(): boolean
  isStale(): boolean
  get isDirty(): boolean
  markClean(): void
  settled(): Promise<this>
}
```

### ContentGraph

```typescript
class ContentGraph {
  // Properties
  repositoryId: number
  nodes: GraphNode[]
  activities: GraphNode[]
  elements: GraphNode[]

  // Queries
  findNodeByUid(uid: string): GraphNode | null
  findActivityById(id: number): GraphNode | null
  findElementById(id: number): GraphNode | null

  // Navigation
  getNodePath(uid: string): NodePath | null
  getAncestors(uid: string): GraphNode[]

  // Loading
  async loadEntity(uid: string): Promise<AnyContentEntity>

  // Persistence
  async save(): Promise<void>
  toJSON(): object
  clone(): ContentGraph

  // Static
  static load(repositoryId: number, envPath: string): Promise<ContentGraph>
  static fromJSON(data: any): ContentGraph
}
```

### AccessManager

```typescript
class AccessManager {
  constructor(repositories: Repository[])

  // Loading
  async loadAll(): Promise<void>
  async reloadAll(): Promise<void>

  // Query users and groups
  getUsers(groupId?: number): EnrichedUser[]
  getGroups(): EnrichedGroup[]
  getUser(userId: number): EnrichedUser | undefined
  getGroup(groupId: number): EnrichedGroup | undefined

  // Repository access
  hasRepositoryAccess(userId: number, repositoryId: number, groupId?: number): boolean
  getUserRepositories(userId: number): Repository[]
  getGroupRepositories(groupId: number): Repository[]

  // User roles
  getUserRoles(userId: number, repositoryId: number): Array<{ groupId?: number; role: string }>
  getUserRole(userId: number, repositoryId: number, groupId: number | undefined): string | undefined
}

// Enriched types
interface EnrichedUser {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  repositories: Repository[]
  accessDetails: Map<number, Array<{ groupId?: number; role: string }>>
}

interface EnrichedGroup extends RepositoryAccessGroup {
  repositories: Repository[]
}
```

### Types

```typescript
// Search
type SearchEntityType = 'ContentElement' | 'ContentContainer' | 'Activity' | 'Repository'
type SearchPredicate<T> = (entity: T) => boolean
type SearchCriteria = Record<string, any>

interface SearchResult<T = any> {
  entity: T
  repository: Repository
  repositoryId: number
  entityType: SearchEntityType
}

interface ContentStats {
  repositories: number
  activities: number
  containers: number
  elements: number
}

// Events
enum EntityEvent {
  LOADED = 'loaded',
  SIGNED = 'signed',
  DIRTY = 'dirty',
}

// Expiration
enum ExpirationState {
  FRESH = 'fresh',
  STALE = 'stale',
  EXPIRED = 'expired',
  NEVER_SIGNED = 'never_signed',
}

// Options
interface LoadOptions {
  force?: boolean
}

interface MakePublicOptions {
  force?: boolean
  deferred?: boolean
}

// AI & Recommendations
interface LearnerProfile {
  id: string
  answers: Record<string, number[]>
  affinities: DimensionalAffinities  // 6D affinities
  experienceLevel?: DifficultyLevel
  goals: string[]
  recentTags: string[]
  visitHistory?: VisitEntry[]
  engagement?: EngagementMetrics
  createdAt: Date
  updatedAt: Date
}

interface Recommendation {
  repositoryId: string
  name: string
  description: string
  score: number
  reason: string
  sharedTags: string[]
  sharedProblems: string[]
  difficulty?: DifficultyLevel
  duration?: number
}

interface RecommendationOptions {
  limit?: number
  includeCompleted?: boolean
  onlyInProgress?: boolean
  boostRecent?: boolean
  recentBoostWeight?: number
  recentDays?: number
}

interface ProfileQuestion {
  id: string
  question: string
  category: string
  options: Array<{ label: string; tags: string[] }>
  multiSelect?: boolean
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
```

## License

MIT
