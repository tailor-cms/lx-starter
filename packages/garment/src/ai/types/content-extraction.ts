/**
 * Content Extraction Types
 * Internal text extraction from repositories
 * Used by: ContentExtractor
 */

/**
 * Extracted text from a single content element
 * Represents the smallest unit of extracted content (e.g., HTML element, text block)
 */
export interface ExtractedElement {
  // Unique identifier of the element
  id: string;
  // Type of element (e.g., 'text', 'heading', 'code', 'image')
  type: string;
  // Extracted text content from the element
  content: string;
  // Additional element metadata (attributes, styling, etc.)
  metadata?: Record<string, any>;
  // Position/order of element within parent section
  // Used to maintain document structure
  position: number;
  // Word count for this element
  // Used for chunking and token estimation
  wordCount?: number;
}

/**
 * Extracted section
 * Represents a logical grouping of content (maps to Activity or ContentContainer)
 * Sections can be nested to represent hierarchical document structure
 */
export interface ExtractedSection {
  // Unique identifier (Activity or Container UID)
  id: string;
  // Section type (e.g., 'activity', 'container', 'module')
  type?: string;
  // Section title or heading
  title: string;
  // Elements contained directly within this section
  elements: ExtractedElement[];
  // Nested subsections (for hierarchical content structure)
  // Example: A module containing multiple lessons
  children?: ExtractedSection[];
  // Additional section metadata
  metadata?: Record<string, any>;
  // Concatenated text content of all elements
  // Used for full-text analysis
  content?: string;
  // Total word count for section including all elements
  // Used for complexity estimation
  wordCount?: number;
}

/**
 * Extracted repository
 * Top-level container for all extracted text and structure from a repository
 * Ready for LLM processing and metadata generation
 */
export interface ExtractedRepository {
  // Repository unique identifier
  id: string;
  // Repository title
  title: string;
  // Repository description
  description?: string;
  // All top-level sections in the repository
  // Maintains hierarchical structure via nested children
  sections: ExtractedSection[];
  // Total number of elements across all sections
  // Used for complexity metrics
  totalElements: number;
  // Total word count across entire repository
  // Used for token estimation and processing decisions
  totalWordCount?: number;
  // Timestamp when extraction was performed
  extractedAt: Date;
}

/**
 * Content chunk for AI processing
 * Extracted content split into LLM-friendly chunks
 * Used when repository content exceeds token limits
 */
export interface ContentChunk {
  // Unique chunk identifier
  id: string;
  // Repository this chunk belongs to
  repositoryId: string;
  // Chunk sequence number (0-indexed)
  // Used for tracking and reassembly
  index?: number;
  // Raw concatenated text content for this chunk
  // Formatted for LLM consumption
  content: string;
  // Context metadata for this chunk
  metadata: {
    // Repository title
    title?: string;
    // Repository description
    description?: string;
    // Sections included in this chunk
    sections: Array<{
      // Section identifier
      id: string;
      // Section title
      title: string;
      // Number of elements in this section
      elementCount: number;
    }>;
  };
  // Estimated token count for LLM processing
  // Used to ensure chunk stays within model limits
  tokenEstimate: number;
  // Activity UIDs included in this chunk
  // Used for traceability and result mapping
  sectionIds: string[];
}

/**
 * Content extractor options
 * Controls how content is extracted and processed from repositories
 */
export interface ContentExtractorOptions {
  // Maximum length of extracted content per element in characters
  // Content exceeding this limit will be truncated
  // Default: unlimited
  maxContentLength?: number;
  // Whether to include repository metadata in extracted content
  // When true, includes title, description, and element attributes
  // Default: true
  includeMetadata?: boolean;
}
