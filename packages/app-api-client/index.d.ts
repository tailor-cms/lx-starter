/**
 * TypeScript definitions for axios-based API client
 */
import type { AxiosInstance, AxiosResponse } from 'axios';

      // Auto-generated schema types from OpenAPI spec
export interface LoginDto {
  /** User email address */
  email: string;

  /** User password */
  password: string;
}

export interface OnboardingAnswerDto {
  /** Question ID */
  questionId: string;

  /** Selected option values */
  selectedValues: Array<string>;

  /** Tag affinities for this answer */
  tagAffinities: object;
}

export interface OnboardingSurveyDto {
  /** Survey question answers */
  survey: Array<OnboardingAnswerDto>;

  /** When the onboarding survey was completed */
  completedAt?: object;
}

export interface UserActivityDto {
  /** Onboarding survey data */
  onboarding?: OnboardingSurveyDto;

  /** 6D affinities by dimension (topic, skill, concept, industry, tool) */
  affinities?: object;

  /** Learner's experience/difficulty level */
  experienceLevel?: string;

  /** Learning goals */
  goals?: Array<string>;

  /** Recently interacted tags (most recent first) */
  recentTags?: Array<string>;

  /** When the activity data was last updated */
  lastUpdatedAt: object;
}

export interface UserDto {
  id: string;

  email: string;

  role: 'ADMIN' | 'USER';

  firstName: string;

  lastName: string;

  fullName: object;

  label: string;

  imgUrl: string;

  isAdmin: boolean;

  isDeleted: boolean;

  lastLoginAt: string;

  createdAt: string;

  updatedAt: string;

  deletedAt: object;

  activity: UserActivityDto;
}

export interface LoginResponseDto {
  user: UserDto;

  /** Token expiration time in milliseconds (token sent via httpOnly cookie) */
  expiresIn: number;
}

export interface ChangePasswordDto {
  /** Current password */
  currentPassword: string;

  /** New password */
  newPassword: string;
}

export interface ChangePasswordResponseDto {
  /** Success message */
  message: string;
}

export interface ForgotPasswordDto {
  /** Email address to send reset link to */
  email: string;
}

export interface ResetPasswordDto {
  /** Password reset token */
  token: string;

  /** New password */
  newPassword: string;
}

export interface OAuthClientResponseDto {
  id: string;

  clientId: string;

  name: string;

  description?: string;

  ownerType: 'INTEGRATION';

  allowedScopes: Array<string>;

  allowedGrantTypes: Array<'client_credentials'>;

  isActive: boolean;

  expiresAt?: object;

  lastUsedAt?: object;

  usageCount: number;

  rateLimit?: number;

  createdAt: string;

  updatedAt: string;

  isExpired: boolean;

  canAuthenticate: boolean;
}

export interface PaginatedOAuthClientsResponseDto {
  data: Array<OAuthClientResponseDto>;

  /** Total number of items */
  total: number;

  /** Number of items per page */
  limit: number;

  /** Offset for pagination */
  offset: number;
}

export interface CreateOAuthClientDto {
  /** OAuth client name */
  name: string;

  /** OAuth client description */
  description?: string;

  /** Allowed scopes for this client */
  scopes: Array<Array<any>>;

  /** Client expiration date */
  expiresAt?: string;

  /** Rate limit (requests per hour) */
  rateLimit?: number;
}

export interface OAuthClientWithSecretResponseDto {
  id: string;

  clientId: string;

  name: string;

  description?: string;

  ownerType: 'INTEGRATION';

  allowedScopes: Array<string>;

  allowedGrantTypes: Array<'client_credentials'>;

  isActive: boolean;

  expiresAt?: object;

  lastUsedAt?: object;

  usageCount: number;

  rateLimit?: number;

  createdAt: string;

  updatedAt: string;

  isExpired: boolean;

  canAuthenticate: boolean;

  /** Client secret - only shown once on creation/rotation */
  clientSecret: string;
}

export interface TokenRequestDto {
  /** OAuth 2.0 grant type */
  grant_type: 'client_credentials';

  /** OAuth client ID (required if not using Basic Authentication) */
  client_id?: string;

  /** OAuth client secret (required if not using Basic Authentication) */
  client_secret?: string;

  /** Requested scopes (space-separated) */
  scope?: string;
}

export interface OAuthTokenResponseDto {
  /** OAuth 2.0 access token */
  access_token: string;

  /** Token type */
  token_type: 'Bearer';

  /** Token expiration time in seconds */
  expires_in: number;

  /** Granted scopes (space-separated) */
  scope: string;
}

export interface UpdateProfileDto {
  /** User email address */
  email?: string;

  /** User first name */
  firstName?: string;

  /** User last name */
  lastName?: string;

  /** User avatar as data URL (base64 encoded image) */
  imgUrl?: string;
}

export interface PaginatedUsersDto {
  data: Array<UserDto>;

  /** Total number of items */
  total: number;

  /** Number of items per page */
  limit: number;

  /** Current page number */
  page: number;

  /** Total number of pages */
  totalPages: number;

  /** Has previous page */
  hasPrevious: boolean;

  /** Has next page */
  hasNext: boolean;
}

export interface CreateUserDto {
  /** User email address */
  email: string;

  /** User first name */
  firstName?: string;

  /** User last name */
  lastName?: string;

  /** User role */
  role?: 'ADMIN' | 'USER';
}

export interface UpdateUserDto {
  /** User email address */
  email?: string;

  /** User first name */
  firstName?: string;

  /** User last name */
  lastName?: string;

  /** User avatar as data URL (base64 encoded image) */
  imgUrl?: string;

  /** User role (admin only) */
  role?: 'ADMIN' | 'USER';
}

export interface IntegrationResponseDto {
  id: string;

  name: string;

  description?: string;

  isActive: boolean;

  lastUsedAt?: string;

  createdAt: string;

  updatedAt: string;

  hasActiveClients: boolean;
}

export interface PaginatedIntegrationsResponseDto {
  data: Array<IntegrationResponseDto>;

  /** Total number of items */
  total: number;

  /** Number of items per page */
  limit: number;

  /** Offset for pagination */
  offset: number;
}

export interface CreateIntegrationDto {
}

export interface UpdateIntegrationDto {
}

export interface CatalogEntryDto {
  /** Repository ID */
  id: number;

  /** Repository UID */
  uid: string;

  /** Content schema identifier */
  schema: string;

  /** Repository name */
  name: string;

  /** Repository description */
  description: string;

  /** Repository metadata, defined by the content schema */
  meta: object;

  /** Publication timestamp */
  publishedAt: string;

  /** Detachment timestamp */
  detachedAt?: string;
}

export interface ActivitySearchResultDto {
  /** The activity entity */
  entity: object;

  /** Entity type */
  entityType: string;

  /** Repository ID that contains this activity */
  repositoryId: string;
}

export interface ContainerSearchResultDto {
  /** The content container entity */
  entity: object;

  /** Entity type */
  entityType: string;

  /** Repository ID that contains this container */
  repositoryId: string;
}

export interface SectionNodeDto {
  /** Section ID (uid) */
  id: string;

  /** Schema type (e.g., module, lesson, page) */
  type: string;

  /** Entity type (e.g., Activity, Repository) */
  entity: string;

  /** Section name */
  name?: string;

  /** Parent section (e.g., module containing a lesson) */
  parent?: SectionNodeDto;
}

export interface LearningGoalItemDto {
  /** Unique identifier for the learning goal */
  id: string;

  /** Type of learning goal */
  type: 'problem' | 'outcome';

  /** Title or description of the learning goal */
  title: string;

  /** Detailed description (for problems) */
  description?: string;

  /** Category (problem.category or outcome.bloomLevel) */
  category?: string;

  /** Difficulty level (for problems) */
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  /** Required skills (for problems) */
  requiredSkills?: Array<string>;

  /** Repository uid for navigation */
  repositoryId: string;

  /** Repository name for display */
  repositoryName: string;

  /** Resolved section nodes for navigation (all sectionIds resolved) */
  sections?: Array<SectionNodeDto>;
}

export interface LearningGoalsResponseDto {
  /** List of learning goal items */
  items: Array<LearningGoalItemDto>;

  /** Total number of problems across all repositories */
  totalProblems: number;

  /** Total number of learning outcomes across all repositories */
  totalOutcomes: number;
}

export interface TagDistributionDto {
  /** Tag name */
  tag: string;

  /** Tag category */
  category: 'topic' | 'skill' | 'concept' | 'industry' | 'tool';

  /** Number of repositories containing this tag */
  count: number;
}

export interface CategoryDistributionDto {
  /** Category name */
  category: string;

  /** Number of tags in this category */
  count: number;
}

export interface DifficultyDistributionDto {
  /** Difficulty level */
  level: string;

  /** Number of repositories at this difficulty level */
  count: number;
}

export interface ProfileQuestionOptionDto {
  /** Option text */
  label: string;

  /** Tag affinities for this option */
  tagAffinities: object;
}

export interface ProfileQuestionDto {
  /** Question ID */
  id: string;

  /** Question type */
  type: 'single' | 'multiple';

  /** Question text */
  question: string;

  /** Question category */
  category: string;

  /** Whether multiple answers can be selected */
  allowMultiple: boolean;

  /** Answer options */
  options: Array<ProfileQuestionOptionDto>;

  /** Question weight in profiling (0-1) */
  weight: number;
}

export interface ContentAnalysisDto {
  /** Whether AI analysis has been generated */
  hasAnalysis: boolean;

  /** Number of repositories with AI metadata */
  analyzedRepositories: number;

  /** Repository IDs that were included in the aggregated content analysis */
  analysisRepositoryIds: Array<string>;

  /** Total number of repositories */
  totalRepositories: number;

  /** Percentage of repositories analyzed */
  coveragePercentage: number;

  /** When the analysis was last generated */
  generatedAt: object;

  /** Tag distribution across all content */
  tagDistribution: Array<TagDistributionDto>;

  /** Category distribution */
  categoryDistribution: Array<CategoryDistributionDto>;

  /** Difficulty level distribution */
  difficultyDistribution: Array<DifficultyDistributionDto>;

  /** Global profiling questions */
  profilingQuestions: Array<ProfileQuestionDto>;
}

export interface BulkStorageDto {
  /** Uncompressed JSON size in bytes */
  jsonSize: number;

  /** Compressed storage size in bytes (zstd) */
  compressedSize: number;

  /** Compression ratio as percentage */
  compressionRatio: string;
}

export interface ContentStatsDto {
  /** Total number of repositories */
  repositories: number;

  /** Total number of activities across all repositories */
  activities: number;

  /** Total number of content containers */
  containers: number;

  /** Total number of content elements */
  elements: number;

  /** Bulk storage metrics (null if no content) */
  bulk?: BulkStorageDto;
}

export interface ForceAnalysisResponseDto {
  /** Whether the operation succeeded */
  success: boolean;

  /** Status message */
  message: string;

  /** Number of repositories analyzed */
  repositoriesAnalyzed?: number;

  /** Number of tags found */
  tags?: number;

  /** Number of profiling questions generated */
  questions?: number;
}

export interface ContentElementDto {
  /** Element ID */
  id: number;

  /** Element UID */
  uid: string;

  /** Content ID */
  contentId: string;

  /** Content signature hash, can be used to differentiate elements */
  contentSignature: string;

  /** Element type */
  type: string;

  /** Position in parent container */
  position: number;

  /** Element references to other content elements */
  refs: object;

  /** Element metadata, configurable by schema per element type */
  meta: object;

  /** Element data including assets */
  data: object;

  /** Human-readable size */
  size: string;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

export interface ContentContainerDto {
  /** Container ID */
  id: number;

  /** Container UID */
  uid: string;

  /** Parent activity ID */
  parentId: number;

  /** Container type */
  type: string;

  /** Position in parent */
  position: number;

  /** Publication filename */
  publishedAs: string;

  /** Container data, defined by the container type */
  data: object;

  /** Content elements within container */
  elements: Array<ContentElementDto>;

  /** Nested containers (e.g. sections within a page) */
  containers: Array<ContentContainerDto>;

  /** Human-readable size */
  size: string;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

export interface ActivityDto {
  /** Activity ID */
  id: number;

  /** Activity UID */
  uid: string;

  /** Parent activity ID */
  parentId: number;

  /** Activity type */
  type: string;

  /** Position in repository (within parent or repository root) */
  position: number;

  /** Activity relationships, defined by the repository schema */
  relationships: object;

  /** Activity metadata, configurable by schema per activity type */
  meta: object;

  /** Content containers within activity, e.g. pages */
  contentContainers: Array<ContentContainerDto>;

  /** Human-readable size */
  size: string;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;

  /** Publication timestamp */
  publishedAt: string;
}

export interface RepositoryDto {
  /** Repository id */
  id: number;

  /** Repository uid */
  uid: string;

  /** Content schema identifier */
  schema: string;

  /** Schema version */
  version: string;

  /** Repository name */
  name: string;

  /** Repository description */
  description: string;

  /** Repository metadata, defined by the content schema */
  meta: object;

  /** Repository structure (activities/modules) */
  structure: Array<ActivityDto>;

  /** Human-readable total size */
  size: string;

  /** Publication timestamp */
  publishedAt: string;
}

export interface AccessUserDto {
  id: number;

  email: string;

  firstName: object;

  lastName: object;

  role: string;

  assignedAt: string;
}

export interface AccessGroupMemberDto {
  id: number;

  email: string;

  firstName: object;

  lastName: object;

  role: string;
}

export interface AccessGroupDto {
  id: number;

  name: string;

  logoUrl: object;

  members: Array<AccessGroupMemberDto>;
}

export interface AccessWebhookPayloadDto {
  id: number;

  uid: string;

  users: Array<AccessUserDto>;

  groups: Array<AccessGroupDto>;

  updatedAt: string;
}

export interface WebhookPayloadDto {
  /** Repository ID */
  repositoryId: number;

  /** Activity ID (present when activity is published) */
  activityId?: number;
}

export interface ElementInteractDto {
  /** Element UID to interact with */
  elementUid: string;

  /** Interaction data (e.g., user response) */
  data: object;
}

export interface ElementInteractResponseDto {
  /** Whether the response is correct */
  isCorrect?: boolean;

  /** User response */
  response?: string;

  /** Whether the element has been submitted */
  isSubmitted?: boolean;
}

export interface VisitContextDto {
  /** Client-generated session ID. Groups visits in the same browsing session */
  sessionId?: string;

  /** Visit order within session (1, 2, 3...). Tracks navigation */
  sequenceNumber?: number;

  /** How user arrived at the content */
  entryPoint?: 'recommendation' | 'search' | 'browse' | 'direct' | 'pathway' | 'continue';

  /** Previous page URL or content ID that led here */
  referrer?: string;

  /** Learning path ID if user is following a structured path */
  learningPathId?: string;
}

export interface ContentProgressEntryDto {
  /** Unique content element identifier */
  elementId: string;

  /** Content element type from Tailor CMS (MUX_VIDEO, PDF, etc.) */
  type: string;

  /** Progress percentage (0-100). Used for video, audio, PDF */
  percent?: number;

  /** Type-specific data. For quizzes: { attempts, correct, score } */
  data?: object;
}

export interface VisitEngagementDto {
  /** How far user scrolled (0-100%). Max value during visit */
  scrollDepth?: number;

  /** Number of interactions (clicks, expands) during the visit */
  interactionCount?: number;

  /** Per-element progress tracking. Each entry includes elementId, type, and progress data (percent for media, data for quizzes) */
  contentProgress?: Array<ContentProgressEntryDto>;
}

export interface DeviceInfoDto {
  /** Device type */
  type: 'desktop' | 'tablet' | 'mobile';

  /** Browser name */
  browser?: string;

  /** Operating system */
  os?: string;
}

export interface RecordActivityDto {
  /** Content node id. Can be repository, activity, container, or element */
  nodeId: string;

  /** Action: view (started), complete (finished), bookmark (saved), skip (passed) */
  action: 'view' | 'complete' | 'bookmark' | 'skip';

  /** Time spent in milliseconds. Auto-calculated from visit start if not provided */
  duration?: number;

  /** Navigation context: session, entry point, referrer */
  context?: VisitContextDto;

  /** Engagement signals: scroll depth, interactions, progress */
  engagement?: VisitEngagementDto;

  /** Device information: type, browser, OS */
  device?: DeviceInfoDto;
}

export interface ProfileUpdateResultDto {
  /** Whether the profile was updated */
  updated: boolean;

  /** Number of tag affinities that changed */
  changesCount: number;

  /** Top interest updates from this activity */
  topChanges: Array<string>;
}

export interface SubmitOnboardingDto {
  /** Map of questionId to selected answer indexes (0-based). ProfileBuilder.build() uses these to compute affinities */
  answers: object;
}

export interface ContinueLearningItemDto {
  /** Parent repository identifier */
  repositoryId: string;

  /** Most recent content node visited within this repository. This is the suggested resume point for the learner */
  nodeId: string;

  /** Content title */
  title: string;

  /** Thumbnail image URL */
  thumbnail?: string;

  /** Content node type */
  nodeType: 'repository' | 'activity' | 'container' | 'element';

  /** Last action: view=visited, complete=finished, bookmark=saved, skip=intentionally skipped */
  lastAction: 'view' | 'complete' | 'bookmark' | 'skip';

  /** ISO 8601 timestamp of the most recent visit to this content */
  lastVisitedAt: string;

  /** Total time spent across all visits in milliseconds (720000 = 12 min) */
  totalTimeSpent: number;

  /** Progress percentage (0-100). 100 indicates completion; otherwise reflects max scroll depth or element completion percentage */
  progress: number;

  /** Content difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  /** Content tags captured at time of visit */
  tags: Array<string>;
}

export interface ContinueLearningDto {
  /** Ordered list of content to continue, sorted by most recently visited first */
  items: Array<ContinueLearningItemDto>;

  /** Number of items returned. May be less than requested limit if learner has fewer in-progress items */
  count: number;

  /** ISO 8601 timestamp when this response was generated */
  generatedAt: string;
}

export interface RepositoryMatchDto {
  /** Unique repository identifier */
  id: string;

  /** Repository display name */
  name: string;

  /** Similarity/relevance score (0-100). Higher scores indicate stronger semantic relationship. Typical range for good matches: 50-95 */
  score: number;

  /** Human-readable explanation of why this content is related. Generated based on relationship type and shared attributes */
  reason: string;

  /** Semantic relationship type between source and target content */
  relationship: 'prerequisite' | 'next-level' | 'similar-topic' | 'alternative-approach' | 'complement' | 'builds-on' | 'similar-problems' | 'alternative';

  /** Tag names shared between source and target repositories, indicating topical overlap */
  sharedTags: Array<string>;

  /** Problem IDs that both repositories address, indicating similar practical applications */
  sharedProblems: Array<string>;

  /** Best matching section (activity) id in the target repository. Useful for deep-linking to the most relevant content section */
  sectionId?: string;
}

export interface RecommendationsDto {
  /** Ordered list of recommended content, sorted by relevance score (highest first) */
  recommendations: Array<RepositoryMatchDto>;

  /** Number of recommendations returned. May be less than requested limit if fewer matches meet the minimum score threshold */
  count: number;

  /** Total repositories analyzed during recommendation generation. Useful for understanding content catalog coverage */
  totalRepositories: number;

  /** ISO 8601 timestamp when recommendations were generated */
  generatedAt: string;
}

export interface ResetActivityDto {
  /** Reset onboarding data (survey answers, completion status) */
  resetOnboarding?: boolean;

  /** Reset progress data (visit history, engagement, affinities, experience level) */
  resetProgress?: boolean;
}

export interface ResetActivityResultDto {
  /** Whether onboarding data was reset */
  onboardingReset: boolean;

  /** Whether progress data was reset */
  progressReset: boolean;

  /** Message describing what was reset */
  message: string;
}

export interface ScenarioGenerateRequestDto {
  /** The prompt to send to the AI */
  prompt: string;
}

export interface ScenarioGenerateResponseDto {
  /** Generated text response from AI */
  response: string;
}

export interface MessageDto {
  /** Role of the message sender */
  role: 'user' | 'assistant';

  /** Content of the message */
  content: string;
}

export interface ChatRequestDto {
  /** System prompt defining the AI role */
  prompt: string;

  /** Conversation history */
  messages: Array<MessageDto>;
}

export interface ChatResponseDto {
  /** AI response */
  response: string;
}

export interface RealtimeSessionRequestDto {
  /** System prompt/instructions for the Realtime session */
  prompt: string;

  /** TTS voice for audio output */
  voice?: string;
}

export interface RealtimeSessionResponseDto {
  /** Ephemeral client secret for WebRTC connection */
  token: string;

  /** Token expiration as Unix timestamp */
  expiresAt: number;
}

export interface AssistantMessageDto {
  /** Who produced this turn */
  role: 'user' | 'assistant';

  /** Plain-text content of the turn */
  text: string;
}

export interface AssistantChatRequestDto {
  /** Full conversation so far, oldest first, including the new user turn as the last entry. The endpoint is stateless; the client owns history. */
  messages: Array<AssistantMessageDto>;
}

export interface AssistantCatalogItemDto {
  /** Repository or activity uid, resolvable via /content/node */
  uid: string;

  /** Catalog entity kind, used by the client to build the link */
  type: 'COURSE' | 'LESSON' | 'PRACTICE';

  /** Display title */
  title: string;

  /** Estimated duration in minutes */
  duration: number;

  /** Thumbnail URL when the content has one */
  thumbnail?: string;

  /** uid of the owning repository */
  repositoryUid: string;

  /** Name of the owning repository */
  repositoryName: string;
}

export interface AssistantPathwayStepDto {
  /** Why this step comes here */
  title: string;

  /** What the learner takes away from this step */
  description: string;

  /** The catalog entity this step points at */
  item: AssistantCatalogItemDto;
}

export interface AssistantPathwayDto {
  /** Pathway title */
  title: string;

  /** Short note on pacing or assumptions, shown under the title */
  note: string;

  /** What the pathway gets the learner to */
  description: string;

  /** Ordered steps, each pointing at real catalog content */
  steps: Array<AssistantPathwayStepDto>;
}

export interface AssistantReplyDto {
  /** Assistant reply, always present */
  text: string;

  /** Clarifying questions, when the assistant needs more to go on */
  questions?: Array<string>;

  /** Courseware content matching the request */
  items?: Array<AssistantCatalogItemDto>;

  /** A proposed pathway the learner can save */
  pathway?: AssistantPathwayDto;

  /** Follow-up prompts offered as chips */
  suggestions?: Array<string>;
}

export interface SeedResponseDto {
  /** Result message */
  message: string;

  /** Response data */
  data?: object;
}
      // Response wrapper interface
export interface ApiResponse<T = any> {
  statusCode: number;
  headers: any;
  body: {
    success: boolean;
    data: T;
    meta?: {
      pagination?: {
        total: number;
        limit: number;
        page: number;
        totalPages: number;
        hasPrevious: boolean;
        hasNext: boolean;
      };
    };
    error?: any;
  };
  data: T;
}

// Raw method interface
export interface RawMethod<TRequest, TResponse> {
  (request?: TRequest): Promise<AxiosResponse<TResponse>>;
}

// API method interface
export interface ApiMethod<TRequest, TResponse> {
  (request?: TRequest): Promise<ApiResponse<TResponse>>;
  raw: RawMethod<TRequest, TResponse>;
}

// Helper function interfaces
export interface ResponseHelpers {
  extractData(res: AxiosResponse): any;
  extractFullResponse(res: AxiosResponse): any;
  extractPaginationMeta(res: AxiosResponse): any;
}

      // Namespace interfaces
      export interface AuthNamespace { /**
 * User login
 */
login: ApiMethod<{body: LoginDto}, LoginResponseDto>;
/**
 * User logout
 */
logout: ApiMethod<{}, any>;
/**
 * Change current password
 */
changePassword: ApiMethod<{body: ChangePasswordDto}, ChangePasswordResponseDto>;
/**
 * Request password reset
 */
forgotPassword: ApiMethod<{body: ForgotPasswordDto}, any>;
/**
 * Reset password with token
 */
resetPassword: ApiMethod<{body: ResetPasswordDto}, any>;
/**
 * Validate reset token
 */
validateResetToken: ApiMethod<{}, any>; }
export interface ContentNamespace { /**
 * Fetch list of content packages (repositories)
 */
list: ApiMethod<{}, Array<CatalogEntryDto>>;
/**
 * Get content package entity (repository) by id
 */
getPackage: ApiMethod<{path: {id: string}}, RepositoryDto>;
/**
 * Get Tailor CMS repository access information (users and roles)
 */
getRepositoryAccess: ApiMethod<{path: {id: string}}, AccessWebhookPayloadDto>;
/**
 * Get specific content node by id
 */
getNode: ApiMethod<{path: {id: string}}, any>;
/**
 * Filter activities across all repositories
 */
filterActivities: ApiMethod<{query?: {repositoryId?: string; parentId?: number; type?: string; tags?: string; limit?: number}}, Array<ActivitySearchResultDto>>;
/**
 * Filter content containers across all repositories
 */
filterContainers: ApiMethod<{query?: {repositoryId?: string; parentId?: number; type?: string; tags?: string; limit?: number}}, Array<ContainerSearchResultDto>>;
/**
 * Get all learning goals (problems and outcomes)
 */
getLearningGoals: ApiMethod<{query?: {query?: string; type?: 'problem' | 'outcome'; limit?: number}}, LearningGoalsResponseDto>;
/**
 * Get content analysis and profiling questions
 */
getAnalysis: ApiMethod<{}, ContentAnalysisDto>;
/**
 * Force regeneration of content analysis
 */
forceAnalysis: ApiMethod<{}, ForceAnalysisResponseDto>;
/**
 * Get content statistics across all repositories
 */
getStats: ApiMethod<{}, ContentStatsDto>; }
export interface CoursewareAssistantNamespace { /**
 * Ask the courseware assistant
 */
chat: ApiMethod<{body: AssistantChatRequestDto}, AssistantReplyDto>; }
export interface CurrentUserNamespace { /**
 * Get current user profile
 */
get: ApiMethod<{}, UserDto>;
/**
 * Update user profile
 */
update: ApiMethod<{body: UpdateProfileDto}, UserDto>; }
export interface HealthNamespace { /**
 * Basic health check
 */
healthCheck: ApiMethod<{}, any>;
/**
 * Liveness probe
 */
liveness: ApiMethod<{}, any>;
/**
 * Readiness probe
 */
readiness: ApiMethod<{}, any>;
/**
 * Test Sentry error capture (development only)
 */
sentryDebug: ApiMethod<{}, any>;
/**
 * Test Sentry message capture (development only)
 */
sentryMessage: ApiMethod<{}, any>; }
export interface IntegrationOAuthClientsNamespace { /**
 * List OAuth clients for integration (Admin only)
 */
list: ApiMethod<{path: {id: string}; query?: {ownerId?: string; isActive?: boolean; limit?: number; offset?: number}}, Array<OAuthClientResponseDto>>;
/**
 * Create OAuth client for integration (Admin only)
 */
create: ApiMethod<{path: {id: string}; body: CreateOAuthClientDto}, OAuthClientWithSecretResponseDto>;
/**
 * Get integration OAuth client (Admin only)
 */
findOne: ApiMethod<{path: {id: string; clientId: string}}, OAuthClientResponseDto>;
/**
 * Delete integration OAuth client (Admin only)
 */
delete: ApiMethod<{path: {id: string; clientId: string}}, any>;
/**
 * Rotate integration OAuth client secret (Admin only)
 */
rotateSecret: ApiMethod<{path: {id: string; clientId: string}}, OAuthClientWithSecretResponseDto>; }
export interface IntegrationsNamespace { /**
 * List integrations (Admin only)
 */
list: ApiMethod<{}, Array<IntegrationResponseDto>>;
/**
 * Create integration (Admin only)
 */
create: ApiMethod<{body: CreateIntegrationDto}, IntegrationResponseDto>;
/**
 * Get integration by ID (Admin only)
 */
findOne: ApiMethod<{path: {id: string}}, IntegrationResponseDto>;
/**
 * Update integration (Admin only)
 */
update: ApiMethod<{path: {id: string}; body: UpdateIntegrationDto}, IntegrationResponseDto>;
/**
 * Delete integration (Admin only)
 */
delete: ApiMethod<{path: {id: string}}, any>;
/**
 * Restore soft-deleted integration (Admin only)
 */
restore: ApiMethod<{path: {id: string}}, IntegrationResponseDto>; }
export interface LearningNamespace { /**
 * Process learner interaction with the content element (Tailor CMS content element hook)
 */
interact: ApiMethod<{body: ElementInteractDto}, ElementInteractResponseDto>;
/**
 * Record content consumption activity
 */
recordActivity: ApiMethod<{body: RecordActivityDto}, ProfileUpdateResultDto>;
/**
 * Initialize learner profile with onboarding survey
 */
submitOnboarding: ApiMethod<{body: SubmitOnboardingDto}, any>;
/**
 * Get in-progress content
 */
getContinueLearning: ApiMethod<{query?: {limit?: number; includeCompleted?: boolean}}, ContinueLearningDto>;
/**
 * Get personalized content recommendations
 */
getRecommendations: ApiMethod<{query?: {limit?: number; includeCompleted?: boolean; onlyInProgress?: boolean; boostRecent?: boolean; recentBoostWeight?: number; recentDays?: number}}, RecommendationsDto>;
/**
 * Find similar content
 */
getMoreLikeThis: ApiMethod<{path: {id: string}; query?: {sectionId?: string; limit?: number}}, RecommendationsDto>;
/**
 * Reset user activity (admin)
 */
resetUserActivity: ApiMethod<{path: {userId: string}; body: ResetActivityDto}, ResetActivityResultDto>; }
export interface OAuthTokenNamespace { /**
 * OAuth 2.0 Token Endpoint (Client Credentials Flow)
 */
token: ApiMethod<{body: TokenRequestDto}, OAuthTokenResponseDto>; }
export interface OidcNamespace { /**
 * Initiate Google OAuth flow or logout
 */
handleOidc: ApiMethod<{query?: {action?: 'logout'}}, any>;
/**
 * Google OAuth callback
 */
googleAuthCallback: ApiMethod<{}, any>; }
export interface ScenarioNamespace { /**
 * Generate AI text for scenario context
 */
generate: ApiMethod<{body: ScenarioGenerateRequestDto}, ScenarioGenerateResponseDto>;
/**
 * Chat with AI using a system prompt and message history
 */
chat: ApiMethod<{body: ChatRequestDto}, ChatResponseDto>;
/**
 * Create ephemeral token for OpenAI Realtime API
 */
realtimeSession: ApiMethod<{body: RealtimeSessionRequestDto}, RealtimeSessionResponseDto>; }
export interface SeedNamespace { /**
 * Reset database with base seed data
 */
resetDatabase: ApiMethod<{}, SeedResponseDto>;
/**
 * Create a single test user
 */
seedUser: ApiMethod<{}, SeedResponseDto>; }
export interface UserNamespace { /**
 * List users
 */
fetch: ApiMethod<{query?: {email?: string; search?: string; includeArchived?: boolean; page?: number; limit?: number; sortBy?: 'id' | 'email' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt'; sortOrder?: 'ASC' | 'DESC'}}, Array<UserDto>>;
/**
 * Create or invite user (Admin only)
 */
create: ApiMethod<{body: CreateUserDto}, UserDto>;
/**
 * Get user by ID (Admin only)
 */
get: ApiMethod<{path: {id: string}}, UserDto>;
/**
 * Update user by ID
 */
update: ApiMethod<{path: {id: string}; body: UpdateUserDto}, UserDto>;
/**
 * Delete user (Admin only)
 */
remove: ApiMethod<{path: {id: string}}, any>;
/**
 * Restore soft-deleted user (Admin only)
 */
restore: ApiMethod<{path: {id: string}}, UserDto>;
/**
 * Reinvite user (Admin only)
 */
reinvite: ApiMethod<{path: {id: string}}, any>; }
export interface WebhooksNamespace { /**
 * Webhook endpoint for TailorCMS publish events (OAuth only)
 */
handlePublishWebhook: ApiMethod<{body: WebhookPayloadDto}, any>;
/**
 * Endpoint for Tailor CMS access rights updates (OAuth only)
 */
handleAccessWebhook: ApiMethod<{body: AccessWebhookPayloadDto}, any>; }

      // Main client interface
      export interface ApiClient extends ResponseHelpers {
          auth: AuthNamespace;
  content: ContentNamespace;
  coursewareAssistant: CoursewareAssistantNamespace;
  currentUser: CurrentUserNamespace;
  health: HealthNamespace;
  integrationOAuthClients: IntegrationOAuthClientsNamespace;
  integrations: IntegrationsNamespace;
  learning: LearningNamespace;
  oAuthToken: OAuthTokenNamespace;
  oidc: OidcNamespace;
  scenario: ScenarioNamespace;
  seed: SeedNamespace;
  user: UserNamespace;
  webhooks: WebhooksNamespace;
        _axiosClient: AxiosInstance;
      }
      // Client creation options
export interface CreateAcOpts {
  axiosClient: AxiosInstance;
  [key: string]: any;
}
export declare function createApiClient(opts: CreateAcOpts): Promise<ApiClient>;
export default createApiClient;