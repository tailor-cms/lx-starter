/**
 * Courseware Assistant Service
 * Conversational front door to the courseware. Answers free-text questions,
 * recommends content, and proposes multi-step pathways.
 */
import type {
  AssistantCatalogItemDto,
  AssistantMessageDto,
  AssistantPathwayDto,
  AssistantPathwayStepDto,
  AssistantReplyDto,
} from './dto/assistant.dto';
import type { AIConfig } from '../../config/ai.config';

import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from '@tailor-cms/garment';
import { PinoLogger } from 'nestjs-pino';
import { stripIndent } from 'common-tags';
import { isPlainObject, map, orderBy, sumBy, truncate } from 'lodash';

import {
  CoursewareTypes,
} from './dto/assistant.dto';
import { ContentService } from '../content/services/content.service';
import { UserService } from '../user/user.service';

const PRACTICE_ACTIVITY_TYPES = new Set(['PRACTICE']);
const THUMBNAIL_META_KEYS = ['thumbnailImage', 'thumbnail'];

// How many of each thing we accept back from the model.
const LIMITS = {
  items: 6,
  questions: 3,
  suggestions: 3,
  pathwaySteps: 8,
  minPathwaySteps: 2,
  digestTags: 12,
  digestProblems: 4,
  learnerGoals: 4,
  learnerInterests: 8,
};

const MAX_CHARS = {
  reply: 1200,
  title: 200,
  listEntry: 300,
  stepTitle: 200,
  stepDescription: 400,
  pathwayTitle: 200,
  pathwayNote: 300,
  pathwayDescription: 600,
  courseAbout: 300,
};

const COMPLETION_OPTIONS = { responseFormat: 'json' } as const;

const FALLBACK = {
  reply: 'Here is what I found in the catalog.',
  pathwayTitle: 'Your pathway',
  emptyCatalog: 'The courseware is still being prepared. Try again in a moment.',
  unparseable: 'Sorry, I had trouble putting that together. Could you rephrase?',
  unresolved:
    'I could not pin that down to specific content in the courseware. '
    + 'Could you tell me a bit more about what you are trying to learn?',
};

// A catalog entity the assistant may reference
type CatalogNode = Omit<AssistantCatalogItemDto, 'thumbnail'> & {
  source: any;
};

// A pathway step the model proposed
interface ResolvedStep {
  title: string;
  description: string;
  node: CatalogNode;
}

// An overview of courseware for quick reference.
interface CatalogProjection {
  key: string;
  index: Map<string, CatalogNode>;
  digest: string;
}

// One step of a pathway as the model proposes it
interface ModelPathwayStep {
  uid?: string;
  title?: string;
  description?: string;
}

// Raw shape we ask the model for
interface ModelReply {
  text?: string;
  itemUids?: string[];
  questions?: string[];
  suggestions?: string[];
  pathway?: {
    title?: string;
    note?: string;
    description?: string;
    steps?: ModelPathwayStep[];
  };
}

@Injectable()
export class CoursewareAssistantService {
  private readonly aiProvider?: OpenAIProvider;
  private projection?: CatalogProjection;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
    private readonly contentService: ContentService,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(CoursewareAssistantService.name);
    const aiConfig = this.config.get('ai') as AIConfig;
    this.aiProvider = aiConfig
      ? new OpenAIProvider({
        apiKey: aiConfig.apiKey,
        model: aiConfig.model,
        baseURL: aiConfig.baseURL,
      })
      : undefined;
  }

  /**
   * Answer one conversational turn.
   * @param userId - Learner, used only to personalize; absent profile is fine
   * @param messages - Full conversation, oldest first, new user turn last
   * @returns Reply with prose plus any resolved items, pathway or questions
   * @throws Error if the AI provider is not configured
   */
  async chat(
    userId: string,
    messages: AssistantMessageDto[],
  ): Promise<AssistantReplyDto> {
    if (!this.aiProvider) throw new Error('AI provider is not configured');

    const { index, digest } = await this.getCatalog();
    if (!index.size) {
      this.logger.warn('Courseware assistant invoked with an empty catalog');
      return { text: FALLBACK.emptyCatalog };
    }

    const systemPrompt = buildSystemPrompt(
      digest,
      await this.buildLearnerContext(userId),
    );
    const history = messages.map(({ role, text }) => ({
      role,
      content: text,
    }));
    this.logger.debug(
      { turns: history.length, nodes: index.size, chars: systemPrompt.length },
      'Courseware assistant turn',
    );

    const raw = await this.aiProvider.chat(
      systemPrompt,
      history,
      COMPLETION_OPTIONS,
    );
    const parsed = parseModelReply(raw);
    if (!parsed) {
      this.logger.error(
        { sample: raw.slice(0, 500) },
        'Courseware assistant returned unparseable JSON',
      );
      return { text: FALLBACK.unparseable };
    }
    return this.hydrateReply(parsed, index);
  }

  /**
   * Turn the model's reply into resolved content.
   * Unknown uids are dropped.
   */
  private async hydrateReply(
    parsed: ModelReply,
    index: Map<string, CatalogNode>,
  ): Promise<AssistantReplyDto> {
    const resolver = new UidResolver(index);
    const steps = resolvePathwaySteps(parsed.pathway, resolver);
    const itemNodes = asArray<string>(parsed.itemUids)
      .map((uid) => resolver.take(uid))
      .filter(isPresent);
    const reply: AssistantReplyDto = {
      text: cap(parsed.text, MAX_CHARS.reply) || FALLBACK.reply,
    };
    const questions = cleanStrings(parsed.questions, LIMITS.questions);
    if (questions.length) reply.questions = questions;
    const suggestions = cleanStrings(parsed.suggestions, LIMITS.suggestions);
    if (suggestions.length) reply.suggestions = suggestions;
    // Too few steps survived to be a pathway; keep them as plain items
    if (steps.length >= LIMITS.minPathwaySteps) {
      reply.pathway = buildPathway(parsed.pathway, await toSteps(steps));
    } else {
      itemNodes.unshift(...steps.map((step) => step.node));
    }
    const shown = await toItems(itemNodes.slice(0, LIMITS.items));
    if (shown.length) reply.items = shown;
    if (resolver.missed.length) {
      this.logger.warn(
        { missed: resolver.missed, shown: shown.length, nodes: index.size },
        'Courseware assistant referenced uids that are not in the catalog',
      );
    }
    // The model named content but none of it resolved
    const hasNothingToShow = !reply.items && !reply.pathway && !reply.questions;
    if (resolver.requested && hasNothingToShow) {
      this.logger.warn(
        { requested: resolver.requested },
        'Courseware assistant recommendation resolved to nothing',
      );
      const fallback: AssistantReplyDto = { text: FALLBACK.unresolved };
      if (suggestions.length) fallback.suggestions = suggestions;
      return fallback;
    }

    this.logger.debug(
      {
        items: reply.items?.length ?? 0,
        pathwaySteps: reply.pathway?.steps.length ?? 0,
        questions: reply.questions?.length ?? 0,
      },
      'Courseware assistant reply resolved',
    );
    return reply;
  }

  /**
   * Build (or reuse) the courseware projection over the repositories this
   * audience may see; the assistant must never describe content the learner
   * cannot open. Rebuilt only when the content itself changes;
   */
  private async getCatalog(): Promise<CatalogProjection> {
    const repositories = await this.contentService.getAccessibleRepositories();
    const { publishedAt } = this.contentService.content;
    const key = `${repositories.length}:${publishedAt?.getTime() ?? 0}`;
    if (this.projection?.key === key) return this.projection;
    const index = new Map<string, CatalogNode>();
    const blocks: string[] = [];
    for (const repository of repositories) {
      const activities = repository.activitiesWithContainers.map(
        (activity: any) => toActivityNode(activity, repository),
      );
      const course = toCourseNode(repository, activities);
      for (const node of [course, ...activities]) {
        index.set(normalizeUid(node.uid), node);
      }
      blocks.push(renderCourseBlock(repository, course, activities));
    }
    this.projection = { key, index, digest: blocks.join('\n\n') };
    this.logger.debug(
      { key, nodes: index.size, digestChars: this.projection.digest.length },
      'Catalog projection rebuilt',
    );
    return this.projection;
  }

  /**
   * Summarize what we know about the learner, so the assistant can pitch at
   * the right level without being asked. Returns an empty string when there
   * is no profile yet.
   */
  private async buildLearnerContext(userId: string): Promise<string> {
    try {
      const { activity } = await this.userService.getProfile(userId);
      if (!activity) return '';
      const { experienceLevel, goals, affinities, recentTags } = activity;
      const interests = topAffinities(affinities, LIMITS.learnerInterests);
      return [
        experienceLevel && `Experience level: ${experienceLevel}`,
        listLine('Stated goals', goals, LIMITS.learnerGoals, '; '),
        interests.length && `Strongest interests: ${interests.join(', ')}`,
        listLine('Recently engaged with', recentTags, LIMITS.learnerInterests),
      ]
        .filter(Boolean)
        .join('\n');
    } catch (error: any) {
      this.logger.debug(
        { err: error.message },
        'No learner profile available for assistant personalization',
      );
      return '';
    }
  }
}

// ============================================================================
// ID RESOLUTION
// ============================================================================

class UidResolver {
  // Uids the model produced that are not in the catalog.
  readonly missed: string[] = [];
  // How many uids the model referenced in total.
  requested = 0;

  private readonly taken = new Set<string>();

  // The index of catalog nodes
  constructor(private readonly index: Map<string, CatalogNode>) {}

  // Returns the node, or undefined if it is unknown or already used.
  take(raw: unknown): CatalogNode | undefined {
    if (typeof raw !== 'string') return undefined;
    this.requested += 1;

    const uid = normalizeUid(raw);
    const node = this.index.get(uid);
    if (!node) {
      this.missed.push(raw);
      return undefined;
    }
    if (this.taken.has(uid)) return undefined;
    this.taken.add(uid);
    return node;
  }
}

function normalizeUid(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function resolvePathwaySteps(
  proposed: ModelReply['pathway'],
  resolver: UidResolver,
): ResolvedStep[] {
  return asArray<ModelPathwayStep>(proposed?.steps)
    .map((step) => {
      const node = resolver.take(step?.uid);
      if (!node) return undefined;
      return {
        title: cap(step?.title, MAX_CHARS.stepTitle) || node.title,
        description: cap(step?.description, MAX_CHARS.stepDescription),
        node,
      };
    })
    .filter(isPresent)
    .slice(0, LIMITS.pathwaySteps);
}

function toSteps(steps: ResolvedStep[]): Promise<AssistantPathwayStepDto[]> {
  return Promise.all(
    steps.map(async ({ node, ...step }) => ({
      ...step,
      item: await toItem(node),
    })),
  );
}

function buildPathway(
  proposed: ModelReply['pathway'],
  steps: AssistantPathwayStepDto[],
): AssistantPathwayDto {
  return {
    title:
      cap(proposed?.title, MAX_CHARS.pathwayTitle)
      || FALLBACK.pathwayTitle,
    note: cap(proposed?.note, MAX_CHARS.pathwayNote),
    description: cap(proposed?.description, MAX_CHARS.pathwayDescription),
    steps,
  };
}

// ============================================================================
// CATALOG PROJECTION
// ============================================================================

/**
 * A course node is the repository itself, so its uid and title are the
 * repository's own.
 */
function toCourseNode(repository: any, activities: CatalogNode[]): CatalogNode {
  const ref = repositoryRef(repository);
  const meta = repository.recommendationMetadata;
  return {
    ...ref,
    uid: ref.repositoryUid,
    type: CoursewareTypes.COURSE,
    title: ref.repositoryName,
    // Fall back to the sum of its parts when the analysis has no estimate.
    duration: meta?.estimatedDuration || sumBy(activities, 'duration'),
    source: repository,
  };
}

function toActivityNode(activity: any, repository: any): CatalogNode {
  const meta = activity.meta ?? {};
  const isPractice = PRACTICE_ACTIVITY_TYPES.has(activityTypeOf(activity));
  return {
    ...repositoryRef(repository),
    uid: activity.uid,
    type: isPractice ? CoursewareTypes.PRACTICE : CoursewareTypes.LESSON,
    title: cap(meta.name, MAX_CHARS.title),
    duration: Number(meta.estimatedTime) || 0,
    source: activity,
  };
}

/**
 * Outline activities are stored as `<SCHEMA_ID>/<TYPE>` (content containers
 * are not), so compare on the suffix and stay agnostic about which schema
 */
function activityTypeOf(activity: any): string {
  return String(activity?.type ?? '').split('/').pop() ?? '';
}

// Repository reference data
function repositoryRef(repository: any) {
  return {
    repositoryUid: repository.uid,
    repositoryName: cap(repository.name, MAX_CHARS.title),
  };
}

// Render one course and its activities as a compact prompt block.
function renderCourseBlock(
  repository: any,
  course: CatalogNode,
  activities: CatalogNode[],
): string {
  const meta = repository.recommendationMetadata;
  const lines = [
    [
      `COURSE ${course.uid} | ${course.title}`,
      meta?.difficulty,
      course.duration && `${course.duration}min`,
    ]
      .filter(Boolean)
      .join(' | '),
    labelled('  About', cap(repository.description, MAX_CHARS.courseAbout)),
    listLine('  Topics', map(meta?.tags, 'name'), LIMITS.digestTags),
    listLine('  Helps with', map(meta?.problems, 'title'),
      LIMITS.digestProblems, '; '),
  ];

  for (const node of activities) {
    const duration = node.duration ? ` | ${node.duration}min` : '';
    lines.push(
      `  - ${node.type} ${node.uid} | ${node.title}${duration}`,
    );
  }
  return lines.filter(Boolean).join('\n');
}

// ============================================================================
// PROMPT
// ============================================================================

function buildSystemPrompt(digest: string, learnerContext: string): string {
  const learnerBlock = learnerContext
    ? `\nWHAT YOU KNOW ABOUT THIS LEARNER\n${learnerContext}\n`
    : '';

  return stripIndent`
    You are the courseware assistant for a professional learning platform.
    You help people find content, answer questions about what is available,
    and design custom pathways from the catalog below.

    VOICE
    - Warm, direct, specific. Two to four sentences of prose.
    - Talk about the content, not about yourself. Never mention being an AI.
    - Never promise content that is not in the catalog. If the catalog does
      not cover something, say so plainly and offer the closest thing.
    - Ask in prose or in "questions", never both. Do not restate a question
      you already put in "questions".

    HOW TO RESPOND
    - Someone browsing or asking what exists: answer in prose and attach a
      few relevant items, at the level they asked about. Asked about
      lessons, practice or a subject, attach those - never the course that
      contains them. Attach a course only when they are choosing between
      whole programmes.
    - Someone asking for a pathway, plan, or programme, when you do not yet
      know their level or how much time they have: ask at most two
      clarifying questions and attach nothing else. Do not guess.
    - Once you know enough: propose a pathway whose steps build on each
      other, and explain the ordering in each step's title.
    - Someone refining ("make it shorter", "go back to the full version"):
      return a revised pathway, not questions.

    READING THE TRANSCRIPT
    Your own past turns are replayed with annotations recording what was
    attached to them, for example:
      [shown: uid-a, uid-b]
      [proposed pathway "Retirement Income Essentials" steps: uid-a, uid-b]
    Use these to resolve references like "it", "that pathway" or "the second
    one". Never repeat the annotations back in your prose.

    CATALOG REFERENCE RULES - THESE ARE ABSOLUTE
    - You may only reference uids that appear in the CATALOG below, copied
      character for character. Never invent a uid, and never reconstruct one
      from memory - scroll back and copy it.
    - Any uid you return that is not in the catalog is discarded. If every
      uid in a reply is discarded, the learner is told you found nothing, so
      a half-remembered uid is worse than recommending less.
    - Do not write titles, durations, or links into your prose as facts -
      they are filled in from the catalog for you. Refer to content by name
      naturally, but attach the uid so it renders correctly.
    ${learnerBlock}
    CATALOG
    Every COURSE line is followed by the lessons and practices inside it,
    indented. All three levels can be attached, but the indented lines are
    usually the better answer - a course card is a whole programme.
    ${digest}

    RESPONSE FORMAT
    Reply with a single JSON object, no markdown fences, with these keys:
    {
      "text": "your prose reply (required)",
      "questions": ["at most 2 clarifying questions"],
      "itemUids": ["catalog uids to show as cards, at most 6"],
      "pathway": {
        "title": "pathway name",
        "note": "one line on pacing or assumptions",
        "description": "what this gets them to",
        "steps": [
          {
            "title": "why this step comes here",
            "description": "what they take away",
            "uid": "catalog uid"
          }
        ]
      },
      "suggestions": ["at most 3 replies the learner could tap, see below"]
    }
    Omit any key you are not using. Never send both "questions" and
    "pathway" in the same reply.

    Each entry in "suggestions" is rendered as a button that sends that
    exact text as the learner's next message, so write it in their voice,
    under eight words: "2 hours, on habits", "Show me the practice
    scenarios". Never write it as an instruction to them ("Say '2 hours,
    habits' and I'll build it") - the button already does that.
  `;
}

// ============================================================================
// HELPERS
// ============================================================================

// Narrows away the gaps left by a .map() that skips entries it cannot use.
function isPresent<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Anything that is not already an array becomes an empty one.
 */
function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function toItems(nodes: CatalogNode[]): Promise<AssistantCatalogItemDto[]> {
  return Promise.all(nodes.map(toItem));
}

/**
 * Turn a catalog node into the card the client renders.
 */
async function toItem(node: CatalogNode): Promise<AssistantCatalogItemDto> {
  const { source, ...item } = node;
  await source.makePublic();
  return { ...item, thumbnail: thumbnailOf(source.meta) };
}

/**
 * Signed thumbnail URL for a repository or activity, when it has one.
 */
function thumbnailOf(meta: any): string | undefined {
  for (const key of THUMBNAIL_META_KEYS) {
    const url = meta?.[key]?.publicUrl;
    if (typeof url === 'string' && url) return url;
  }
  return undefined;
}

/**
 * Coerce anything the model gave us to a trimmed, length-bounded string.
 */
function cap(value: unknown, max: number): string {
  return truncate(String(value ?? '').trim(), { length: max });
}

// Cap and limit model-authored strings
function cleanStrings(values: unknown, limit: number): string[] {
  return asArray<unknown>(values)
    .map((it) => (typeof it === 'string' ? cap(it, MAX_CHARS.listEntry) : ''))
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Render one `label: a, b, c` line of a prompt block.
 *
 * Every list we put in front of the model; a course's topics, the problems
 * it helps with, a learner's goals; needs the same treatment: drop blanks,
 * keep the first `limit`, cap each entry, and collapse to an empty string
 * when nothing survives.
 *
 * @example <caption>Blanks dropped, limit applied</caption>
 * listLine('  Topics', ['tax-planning', '', 'annuities'], 2)
 * '  Topics: tax-planning, annuities'
 *
 * @example <caption>Nothing to say, so the caller drops the line</caption>
 * listLine('  Topics', undefined, 5) // ''
 *
 * @param label - Line prefix, carrying whatever indentation the block needs
 * @param values - Candidate entries; non-strings and blanks are discarded
 * @param limit - How many entries to keep
 * @param separator - Placed between entries
 * @returns The rendered line, or '' when no entry survived
 */
function listLine(
  label: string,
  values: unknown,
  limit: number,
  separator = ', ',
): string {
  const entries = asArray<unknown>(values)
    .filter((it): it is string => typeof it === 'string' && !!it.trim())
    .slice(0, limit)
    .map((it) => cap(it, MAX_CHARS.listEntry));
  return labelled(label, entries.join(separator));
}

// `label: value`, or nothing at all when there is no value.
function labelled(label: string, value: string): string {
  return value ? `${label}: ${value}` : '';
}

/**
 * The learner's strongest interests, flattened across all six affinity
 * dimensions (topic, skill, concept, industry, tool, goal) and ranked by
 * score, so the assistant can pitch at the right subjects unprompted.
 *
 * @example
 * topAffinities({ topic: { python: { value: 0.9 } },
 *                 skill: { debugging: { value: 0.4 } } }, 5)
 * ['python', 'debugging']
 */
function topAffinities(affinities: any, limit: number): string[] {
  if (!isPlainObject(affinities)) return [];
  const scored: { tag: string; value: number }[] = [];
  for (const dimension of Object.values<any>(affinities)) {
    if (!isPlainObject(dimension)) continue;
    for (const [tag, score] of Object.entries<any>(dimension)) {
      const value = Number(score?.value);
      if (Number.isFinite(value) && value > 0) scored.push({ tag, value });
    }
  }
  return map(orderBy(scored, 'value', 'desc').slice(0, limit), 'tag');
}

/**
 * Parse the model's JSON reply; safely fall back to extraction;
 */
function parseModelReply(raw: string): ModelReply | null {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as ModelReply;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as ModelReply;
    } catch {
      return null;
    }
  }
}
