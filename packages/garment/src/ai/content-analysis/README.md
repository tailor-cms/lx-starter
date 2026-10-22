# Content Analysis: Intelligent Content Understanding at Scale

Transform your entire content catalog into a deeply understood, semantically
rich learning library with zero manual effort. Our AI-powered Content Analysis
engine automatically extracts, analyzes, and enriches your educational content
with professional-grade metadata that makes every course discoverable,
personalized, and aligned with real-world outcomes.

## How It Works: Three Powerful Engines Working in Harmony

```
ContentExtractor → MetadataGenerator → ContentAnalyzer
     ↓                    ↓                   ↓
 Smart Extraction   AI-Powered Enrichment   Catalog Intelligence
```

**ContentExtractor** intelligently parses your content structure
**MetadataGenerator** generates rich semantic metadata using advanced AI
**ContentAnalyzer** provides deep insights across your entire catalog

## Components

### ContentExtractor: Intelligent Content Parsing

**Automatically extract and structure content from any learning repository.** No
matter how complex your content hierarchy, ContentExtractor intelligently parses
every lesson, activity, and element—preserving context and relationships that
make AI analysis accurate and meaningful.

```typescript
const extractor = new ContentExtractor({
  maxContentLength: 100000, // Max chars per element
  preserveStructure: true, // Keep activity hierarchy
  includeMetadata: true, // Include repo metadata
});

// Extract from repository
const content = await extractor.extract(repository);
const plainText = extractor.toPlainText(content);

// Chunk for AI token limits
const chunks = extractor.chunk(content, 8000, 200);
```

**Key Benefits:**

- **Preserves Learning Context**: Maintains your content's natural hierarchy and flow
- **AI-Optimized Output**: Structured extraction designed specifically for advanced AI comprehension
- **Flexible & Extensible**: Handles any content type with custom extractors
- **Scale-Ready**: Smart chunking ensures even massive courses are processed efficiently

### MetadataGenerator: AI-Powered Content Enrichment

**Transform hours of manual tagging into seconds of AI magic.** MetadataGenerator
analyzes your content with advanced language models to automatically generate rich,
professional-grade metadata that would take content teams weeks to create manually.
Every repository gets deep semantic understanding that powers personalization,
search, and intelligent recommendations.

```typescript
const generator = new MetadataGenerator(aiProvider, {
  maxProblems: 5, // Max problems to generate
  maxTags: 20, // Max tags to generate
  maxOutcomes: 6, // Max learning outcomes
  concurrency: 3, // Parallel batch processing
});

// Generate for single repository
const metadata = await generator.generate(repository);

// Batch processing with progress
const results = await generator.generateBatch(repositories, (done, total) => {
  console.log(`Progress: ${done}/${total}`);
});
```

**What You Get Automatically:**

- **Real-World Problem Mapping**: Connect content to actual challenges learners can solve—making every course instantly relevant
- **Intelligent Tagging System**: Multi-dimensional tags (topics, skills, concepts, industries, tools) with weighted relevance scores
- **Pedagogically-Sound Learning Outcomes**: Bloom's Taxonomy-aligned outcomes that demonstrate clear skill progression
- **Accurate Difficulty Assessment**: Automatically classify content from beginner to expert level
- **Time Estimates**: Give learners realistic completion expectations
- **Deep Content Insights**: Complexity scores, practical focus ratings, and interactivity levels that inform recommendation algorithms

### ContentAnalyzer: Catalog-Wide Intelligence

**See your entire content library through a new lens.** ContentAnalyzer aggregates
metadata across your entire catalog to reveal powerful insights: skill gaps, topic
coverage, difficulty distribution, and tag patterns. Make data-driven decisions
about what content to create next and how to fill gaps in your learning ecosystem.

```typescript
// Initialize with generated metadata
const contentMeta = await generator.generateBatch(repositories);
const analyzer = new ContentAnalyzer(contentMeta);

// Analyze catalog
const analysis = analyzer.analyze();

// Access distributions
console.log('Top tags:', Object.keys(analysis.tagDistribution).slice(0, 5));
console.log('Skills coverage:', analysis.categoryDistribution.skill);
console.log('Beginner courses:', analysis.difficultyDistribution.beginner);

// Get specific content
const meta = analyzer.get(repositoryId);
```

**Actionable Insights:**

- **Tag Distribution**: Discover which topics and skills dominate your catalog—and which are underrepresented
- **Category Coverage**: Understand the balance between topics, skills, concepts, industries, and tools
- **Difficulty Breakdown**: Instantly see if you're serving beginners, advanced learners, or everyone in between

---

## The Technology Behind the Magic

### AI Prompts: Precision-Engineered for Educational Content

Our specialized AI prompts are carefully crafted to extract maximum value from your content:

| Prompt           | What It Does                                 | Output                             |
| ---------------- | -------------------------------------------- | ---------------------------------- |
| `PROBLEM_PROMPT` | Identifies real-world problems your content solves | `{ problems: Problem[] }` |
| `TAG_PROMPT`     | Generates weighted semantic tags with categories | `{ tags: Tag[] }` |
| `OUTCOME_PROMPT` | Creates Bloom's Taxonomy-aligned learning outcomes | `{ outcomes: LearningOutcome[] }` |
| `SUMMARY_PROMPT` | Assesses difficulty level and time requirements | `{ difficulty, estimatedMinutes }` |

Use `buildPrompt()` to inject content:

```typescript
import { buildPrompt, TAG_PROMPT } from './prompts';

const prompt = buildPrompt(TAG_PROMPT, content, plainText);
// Replaces {{title}} and {{content}}, truncates to ~6000 tokens
```

### Seamless Data Flow

**From raw content to actionable intelligence in four simple steps:**

1. **Extract**: `ContentExtractor.extract(repository)` → Structured content ready for AI
2. **Convert**: `ContentExtractor.toPlainText(content)` → Clean text with preserved context
3. **Generate**: `MetadataGenerator.generate(repository)` → Rich semantic metadata
4. **Analyze**: `ContentAnalyzer.analyze()` → Catalog-wide insights and patterns

---

## Technical Details

### Core Data Types

Every piece of content gets enriched with comprehensive metadata:

```typescript
interface ContentMeta {
  id: string;
  name: string;
  problems: Problem[];               // Real-world applications
  tags: Tag[];                       // Multi-dimensional semantic tags
  difficulty: DifficultyLevel;       // beginner | intermediate | advanced | expert
  learningOutcomes: LearningOutcome[]; // Bloom's Taxonomy outcomes
  prerequisites: Prerequisite[];     // What learners need to know first
  estimatedDuration: number;         // Time to complete (minutes)
  contentComplexity: number;         // 0-1 scale
  practicalFocus: number;            // 0-1, higher = more hands-on
  interactivityLevel: number;        // 0-1, engagement potential
  generatedAt: Date;
  modelVersion: string;              // AI model used
}

interface Tag {
  name: string;
  category: 'topic' | 'skill' | 'concept' | 'industry' | 'tool';
  weight: number;                    // 0-1 relevance score
  parent?: string;                   // Hierarchical relationships
  sectionIds?: string[];             // Granular section mapping
}

interface LearningOutcome {
  id: string;
  description: string;
  bloomLevel: BloomLevel;            // Bloom's Taxonomy level
  measurable: boolean;               // Can this outcome be measured?
  assessmentCriteria?: string[];     // How to assess achievement
}

type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
```

### Integration with LearnerProfiler

**Content Analysis powers personalized learning pathways.** Feed enriched content metadata
directly into LearnerProfiler to enable intelligent recommendations, adaptive learning
paths, and skills-based matching:

```typescript
// Generate metadata for all repositories
const generator = new MetadataGenerator(aiProvider);
const contentMeta = await generator.generateBatch(repositories);

// Create analyzer with catalog intelligence
const analyzer = new ContentAnalyzer(contentMeta);

// Power personalization with deep content understanding
const profiler = new LearnerProfiler(aiProvider, options, analyzer);
```

---

## Why Content Analysis Matters

**Stop guessing. Start knowing.**

- **Eliminate Manual Work**: No more hours spent tagging and categorizing content
- **Improve Discoverability**: Rich metadata means learners find exactly what they need
- **Enable Personalization**: Deep content understanding powers intelligent recommendations
- **Data-Driven Decisions**: Know your catalog's strengths and gaps at a glance
- **Scale Effortlessly**: Process hundreds of courses in the time it takes to tag one manually
- **Future-Proof**: Metadata stays current as your content evolves

Transform your content library from a static collection into an intelligent,
self-understanding learning ecosystem that adapts to every learner's needs.
