import type { Activity } from '../../garment/entities/activity/Activity';
import type {
  ContentContainer,
} from '../../garment/entities/content-container/ContentContainer';
import type {
  ContentElement,
} from '../../garment/entities/content-element/ContentElement';
import type { Repository } from '../../garment/entities/repository/Repository';
import type { GarmentLogger } from '../../garment/logger';
import type {
  ContentChunk,
  ContentExtractorOptions,
  ExtractedElement,
  ExtractedRepository,
  ExtractedSection,
} from '../types';

type ElementExtractor = (element: ContentElement) => string;

/**
 * Content Extractor
 * Extracts text content from repository entities for AI analysis
 */
export class ContentExtractor {
  private extractors: Map<string, ElementExtractor> = new Map();
  private options: Required<ContentExtractorOptions>;
  private logger?: GarmentLogger;

  /**
   * Create a new ContentExtractor instance
   * @param options - Configuration options
   * @param options.maxContentLength - Max chars to extract per el (def: 100000)
   * @param options.includeMetadata - Include repo meta in extraction (def: true)
   * @param options.logger - Optional logger for debugging
   */
  constructor(options?: ContentExtractorOptions & { logger?: GarmentLogger }) {
    this.options = {
      maxContentLength: options?.maxContentLength ?? 100000,
      includeMetadata: options?.includeMetadata ?? true,
    };
    this.logger = options?.logger;
    // Register default extractors
    this.registerDefaultExtractors();
  }

  /**
   * Register default extractors for common element types
   */
  private registerDefaultExtractors(): void {
    this.registerExtractor('TIPTAP_HTML', (el) =>
      this.stripHtml(el.data?.content || ''),
    );

    this.registerExtractor('FILE', (el) => {
      return [el.data?.label?.trim() || el.data?.name?.trim() || '']
        .filter(Boolean)
        .join(' ');
    });

    this.registerExtractor('MUX_VIDEO', (el) => {
      return [el.data?.filename || '', el.data?.captions || '']
        .filter(Boolean)
        .join(' ');
    });

    this.registerExtractor('IMAGE', (el) => {
      return [el.data?.alt || ''].filter(Boolean).join(' ');
    });

    this.registerExtractor('PDF', (el) => {
      return el.data?.title || '';
    });

    // Question types
    this.registerExtractor('MULTIPLE_CHOICE', (el) =>
      this.extractMultipleChoice(el),
    );
    this.registerExtractor('SINGLE_CHOICE', (el) =>
      this.extractSingleChoice(el),
    );
  }

  /**
   * Register a custom extractor for an element type
   */
  registerExtractor(type: string, extractor: ElementExtractor): void {
    this.extractors.set(type, extractor);
  }

  /**
   * Extract all text content from a repository
   */
  async extract(repository: Repository): Promise<ExtractedRepository> {
    const start = Date.now();
    this.logger?.debug(
      `[ContentExtractor] Extracting content from repository: ${repository.uid}`,
    );

    const content: ExtractedRepository = {
      id: repository.uid,
      title: repository.name,
      description: repository.description || '',
      sections: [],
      totalElements: 0,
      totalWordCount: 0,
      extractedAt: new Date(),
    };
    // Extract from each activity
    for (const activity of repository.structure || []) {
      const section = this.extractActivity(activity);
      content.sections.push(section);
      content.totalWordCount! += section.wordCount || 0;
      content.totalElements += this.countElements(section);
    }
    // Include metadata if configured
    if (this.options.includeMetadata && repository.meta) {
      const metaContent = this.extractMetadata(repository.meta);
      if (metaContent) {
        content.description += ` ${metaContent}`;
      }
    }

    const duration = Date.now() - start;
    this.logger?.debug(
      `[ContentExtractor] Extracted ${content.totalElements} elements, ` +
      `${content.totalWordCount} words from ${repository.uid} in ${duration}ms`,
    );

    return content;
  }

  /**
   * Extract content from an activity
   */
  private extractActivity(val: Activity): ExtractedSection {
    const section: ExtractedSection = {
      id: val.uid,
      type: val.type,
      title: val.meta?.name,
      content: val.meta?.description ? `${val.meta?.description}:` : '',
      wordCount: 0,
      elements: [],
      children: [],
    };
    // Extract content containers as child sections
    for (const container of val.contentContainers || []) {
      const childSection = this.extractContainer(container);
      section.content += childSection.content + ' ';
      section.wordCount! += childSection.wordCount || 0;
      section.children!.push(childSection);
    }
    section.content = (section.content || '').trim();
    return section;
  }

  /**
   * Extract content from a container as a section.
   * Recursively extracts nested containers as child sections.
   */
  private extractContainer(container: ContentContainer): ExtractedSection {
    const section: ExtractedSection = {
      id: container.uid,
      type: container.type,
      title: container.data?.title || container.type,
      content: this.extractContainerTags(container.data?.tags),
      wordCount: 0,
      elements: [],
      children: [],
    };

    // Extract elements
    for (let i = 0; i < (container.elements || []).length; i++) {
      const element = container.elements![i];
      const extracted = this.extractElement(element, i);
      if (extracted) {
        section.elements.push(extracted);
        section.content += extracted.content + ' ';
        section.wordCount! += extracted.wordCount || 0;
      }
    }
    // Extract nested containers as child sections
    for (const nested of container.containers || []) {
      const childSection = this.extractContainer(nested);
      section.children!.push(childSection);
      section.content += childSection.content + ' ';
      section.wordCount! += childSection.wordCount || 0;
    }
    section.content = (section.content || '').trim();
    return section;
  }

  /**
   * Extract content from a single content element
   */
  private extractElement(
    element: ContentElement,
    position: number,
  ): ExtractedElement {
    const extractor = this.extractors.get(element.type);
    let content = extractor
      ? extractor(element)
      : this.extractGeneric(element.data || {});
    // Truncate if too long
    if (content.length > this.options.maxContentLength) {
      content = content.substring(0, this.options.maxContentLength) + '...';
    }
    return {
      id: element.uid,
      type: element.type,
      content,
      position,
      wordCount: this.countWords(content),
    };
  }

  /**
   * Extract and format user-defined tags from container
   */
  private extractContainerTags(tags?: string[]): string {
    if (!tags?.length) return '';
    return `Tags: ${tags
      .map((t) => t.trim())
      .filter(Boolean)
      .join(', ')}. `;
  }

  /**
   * Generic extraction for unknown element types
   */
  private extractGeneric(data: Record<string, any>): string {
    const textProps = ['title', 'name', 'label', 'description', 'content'];
    const parts: string[] = [];
    for (const prop of textProps) {
      if (data[prop] && typeof data[prop] === 'string') {
        parts.push(this.stripHtml(data[prop]));
      }
    }
    if (!parts.length) return 'JSON Content: ' + JSON.stringify(data);
    return parts.join(' ');
  }

  /**
   * Extract Multiple Choice question
   */
  private extractMultipleChoice(element: ContentElement): string {
    const data = element.data || {};
    const answers = data.answers || [];
    // MC: correct is array of indexes
    const correctAnswers = Array.isArray(data.correct)
      ? data.correct.map((i: number) => answers[i]).filter(Boolean)
      : [];
    return this.formatQuestion(element, correctAnswers);
  }

  /**
   * Extract Single Choice question
   */
  private extractSingleChoice(element: ContentElement): string {
    const data = element.data || {};
    const answers = data.answers || [];
    // SC: correct is single index
    const correctAnswer =
      typeof data.correct === 'number' ? answers[data.correct] : null;
    return this.formatQuestion(element, correctAnswer ? [correctAnswer] : []);
  }

  /**
   * Format question content with resolved correct answers
   */
  private formatQuestion(
    element: ContentElement,
    correctAnswers: string[],
  ): string {
    const data = element.data || {};
    const answers = data.answers || [];
    const parts: string[] = [];

    // Question prompt (array of embed IDs, content in data.embeds)
    if (Array.isArray(data.question) && data.embeds) {
      const questionText = data.question
        .map((id: string) => {
          const embed = data.embeds[id];
          return embed ? this.stripHtml(embed.data?.content || '') : '';
        })
        .filter(Boolean)
        .join(' ');
      if (questionText) parts.push(questionText);
    }

    // Answer options
    if (answers.length) {
      parts.push(`Options: ${answers.join(', ')}`);
    }

    // Correct answers
    if (correctAnswers.length) {
      parts.push(`Correct: ${correctAnswers.join(', ')}`);
    }

    // Hint
    if (data.hint) parts.push(`Hint: ${data.hint}`);

    return parts.join(' ');
  }

  /**
   * Extract relevant metadata
   */
  private extractMetadata(meta: Record<string, any>): string {
    const parts: string[] = [];
    for (const key of Object.keys(meta)) {
      if (meta[key]) {
        if (Array.isArray(meta[key])) {
          parts.push(`${key}: ${meta[key].join(', ')}`);
        } else if (typeof meta[key] === 'string') {
          parts.push(`${key}: ${meta[key]}`);
        }
      }
    }
    return parts.join(' ');
  }

  /**
   * Strip HTML tags from content
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, '\'')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Count total elements in a section recursively
   */
  private countElements(section: ExtractedSection): number {
    let count = section.elements.length;
    for (const child of section.children || []) {
      count += this.countElements(child);
    }
    return count;
  }

  /**
   * Convert extracted content to plain text
   */
  toPlainText(content: ExtractedRepository): string {
    const parts: string[] = [];

    // Repository start marker
    parts.push(`# [${content.id}] ${content.title}`);
    if (content.description) parts.push(`Description: ${content.description}`);

    const formatSection = (section: ExtractedSection, depth: number = 0) => {
      const prefix = '#'.repeat(Math.min(depth + 2, 6));
      parts.push(
        `\n${prefix} [${section.id}] ${section.title || section.type}`,
      );
      if (section.content) parts.push(section.content);
      for (const child of section.children || []) {
        formatSection(child, depth + 1);
      }
      parts.push(`[/${section.id}]`);
    };

    for (const section of content.sections) {
      formatSection(section);
    }

    // Repository end marker
    parts.push(`\n[/${content.id}]`);
    return parts.join('\n');
  }

  /**
   * Chunk content for processing within AI token limits
   *
   * SMART CHUNKING: Works with structure, not giant strings
   * Instead of flattening to text then chunking, we chunk sections directly.
   * This avoids massive string operations and regex scanning for better performance.
   *
   * Features:
   * - Structure-aware chunking (groups complete sections together)
   * - Overlap between chunks for context continuity
   * - Section ID tracking for each chunk
   * - Token estimation for AI processing
   * - Deferred text conversion (only converts sections being used)
   *
   * @param content Extracted content to chunk
   * @param maxTokens Maximum tokens per chunk (default: 8000)
   * @param overlap Token overlap between consecutive chunks (default: 200)
   * @returns Array of content chunks with metadata and section mappings
   *
   * @example
   * const chunks = extractor.chunk(content, 4000, 100);
   * First chunk: tokens 0-4000
   * Second chunk: tokens 3900-7900 (100 token overlap)
   */
  chunk(
    content: ExtractedRepository,
    maxTokens: number = 8000,
    overlap: number = 200,
  ): ContentChunk[] {
    if (!content.sections.length) return [];
    const CHARS_PER_TOKEN = 4;
    const maxTokensPerChunk = maxTokens;
    const chunks: ContentChunk[] = [];

    // Group sections together until we hit token limit
    let currentSections: ExtractedSection[] = [];
    let currentTokens = 0;
    let chunkIndex = 0;

    for (const it of content.sections) {
      // Estimate tokens for this section (use wordCount if available
      // otherwise content length)
      const sectionChars = it.content?.length || this.estimateSectionSize(it);
      const sectionTokens = Math.ceil(sectionChars / CHARS_PER_TOKEN);
      // If adding this section would exceed limit AND we already have sections
      // create chunk
      if (
        currentTokens + sectionTokens > maxTokensPerChunk &&
        currentSections.length > 0
      ) {
        // Build chunk from accumulated sections
        chunks.push(
          this.buildChunkFromSections(content, currentSections, chunkIndex),
        );
        // Start new chunk (with overlap from last section if small enough)
        const overlapSection = currentSections[currentSections.length - 1];
        const overlapTokens = Math.ceil(
          (overlapSection.content?.length || 0) / CHARS_PER_TOKEN,
        );
        if (overlapTokens < overlap) {
          currentSections = [overlapSection];
          currentTokens = overlapTokens;
        } else {
          currentSections = [];
          currentTokens = 0;
        }
        chunkIndex++;
      }
      // Add section to current chunk
      currentSections.push(it);
      currentTokens += sectionTokens;
    }
    // Add final chunk if there are remaining sections
    if (currentSections.length > 0) {
      chunks.push(
        this.buildChunkFromSections(content, currentSections, chunkIndex),
      );
    }
    return chunks;
  }

  /**
   * Build a ContentChunk from a group of sections
   * Only converts to text at this point - no giant string operations earlier
   */
  private buildChunkFromSections(
    content: ExtractedRepository,
    sections: ExtractedSection[],
    index: number,
  ): ContentChunk {
    // Convert only these sections to text (not the entire content!)
    const chunkText = this.sectionsToPlainText(content.title, sections);
    const sectionIds = sections.map((s) => s.id);
    return {
      id: `${content.id}-chunk-${index}`,
      repositoryId: content.id,
      index,
      content: chunkText,
      metadata: {
        title: content.title,
        description: content.description,
        sections: sections.map((s) => ({
          id: s.id,
          title: s.title,
          elementCount: this.countElements(s),
        })),
      },
      tokenEstimate: Math.ceil(chunkText.length / 4),
      sectionIds,
    };
  }

  /**
   * Convert a subset of sections to plain text (for chunking)
   * Much more efficient than converting entire content then chunking
   */
  private sectionsToPlainText(
    contentTitle: string,
    sections: ExtractedSection[],
  ): string {
    const parts: string[] = [];
    parts.push(`# ${contentTitle}\n`);
    const formatSection = (section: ExtractedSection, depth: number = 0) => {
      const prefix = '#'.repeat(Math.min(depth + 2, 6));
      parts.push(
        `\n${prefix} [${section.id}] ${section.title || section.type}`,
      );
      if (section.content) parts.push(section.content);
      for (const child of section.children || []) {
        formatSection(child, depth + 1);
      }
      parts.push(`[/${section.id}]`);
    };
    for (const section of sections) {
      formatSection(section, 0);
    }
    return parts.join('\n');
  }

  /**
   * Estimate section size by counting all content recursively
   */
  private estimateSectionSize(section: ExtractedSection): number {
    let size = section.content?.length || 0;
    size += section.title?.length || 0;
    for (const child of section.children || []) {
      size += this.estimateSectionSize(child);
    }
    return size;
  }
}
