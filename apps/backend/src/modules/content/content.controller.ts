import type {
  Activity,
  CatalogEntry,
  ContentContainer,
  ContentElement,
  Repository,
} from '@tailor-cms/garment';
import {
  ApiExtension,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import {
  AccessWebhookPayloadDto,
  ActivityFilterQueryDto,
  ActivitySearchResultDto,
  CatalogEntryDto,
  ContainerFilterQueryDto,
  ContainerSearchResultDto,
  ContentAnalysisDto,
  ContentStatsDto,
  ForceAnalysisResponseDto,
  LearningGoalsQueryDto,
  LearningGoalsResponseDto,
  RepositoryDto,
} from './dto';
import { ContentService } from './services/content.service';
import { oneLine } from 'common-tags';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOperation({
    summary: 'Fetch list of content packages (repositories)',
    description: oneLine`
      Returns catalog entries for all published content packages (repositories).
      Each entry includes basic metadata like name, description, schema type,
      and publication timestamp. Use GET /content/:id for full repository
      details.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'List of content packages (repositories)',
    type: [CatalogEntryDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiExtension('x-order', 1)
  async list(): Promise<CatalogEntry[]> {
    const items = await this.contentService.list();
    return items.map((item) => item.toJSON());
  }

  @Get('activities')
  @ApiOperation({
    summary: 'Filter activities across all repositories',
    description: 'Search for activities using Garment indexed search.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of activities matching the filter criteria',
    type: [ActivitySearchResultDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async filterActivities(
    @Query() query: ActivityFilterQueryDto,
  ): Promise<ActivitySearchResultDto[]> {
    return this.contentService.findActivities(query);
  }

  @Get('containers')
  @ApiOperation({
    summary: 'Filter content containers across all repositories',
    description: 'Search for content containers using Garment indexed search.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of content containers matching the filter criteria',
    type: [ContainerSearchResultDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async filterContainers(
    @Query() query: ContainerFilterQueryDto,
  ): Promise<ContainerSearchResultDto[]> {
    return this.contentService.findContainers(query);
  }

  @Get('goals')
  @ApiOperation({
    summary: 'Get all learning goals (problems and outcomes)',
    description: 'Returns searchable problems and learning outcomes.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of learning goals',
    type: LearningGoalsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLearningGoals(
    @Query() query: LearningGoalsQueryDto,
  ): Promise<LearningGoalsResponseDto> {
    return this.contentService.getLearningGoals(query);
  }

  @Get('analysis')
  @ApiOperation({
    summary: 'Get content analysis and profiling questions',
    description: oneLine`
      Returns aggregated content analysis including tag distribution,
      difficulty levels, category breakdown, and global profiling
      questions for learner assessment.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Content analysis data with profiling questions',
    type: ContentAnalysisDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalysis(): Promise<ContentAnalysisDto> {
    return this.contentService.getAnalysis();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get content statistics across all repositories',
    description: oneLine`
      Returns aggregate statistics including total repositories, activities,
      containers, elements, and bulk storage metrics (compressed vs uncompressed
      sizes). Useful for admin dashboards and monitoring.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Published content stats and storage metrics',
    type: ContentStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(): Promise<ContentStatsDto> {
    return this.contentService.getStats();
  }

  @Post('analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force regeneration of content analysis',
    description: 'Triggers re-analysis of content.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis regeneration completed',
    type: ForceAnalysisResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async forceAnalysis(): Promise<ForceAnalysisResponseDto> {
    const stats = await this.contentService.forceAnalysis();
    return {
      success: true,
      message: 'Analysis completed successfully',
      ...stats,
    };
  }

  @Get('node/:id')
  @ApiOperation({
    summary: 'Get specific content node by id',
    description: oneLine`
      Retrieves any content node by its ID using O(1) lookup. Returns the node
      with its full data including nested children. Supports Repository, Activity,
      ContentContainer, and ContentElement types. Useful for direct navigation
      to specific content sections.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Content node id',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description:
      'Node details (Repository, Activity, ContentContainer, or ContentElement)',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/RepositoryDto' },
        { $ref: '#/components/schemas/ActivityDto' },
        { $ref: '#/components/schemas/ContentContainerDto' },
        { $ref: '#/components/schemas/ContentElementDto' },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Content package (repository) or node not found',
  })
  @ApiExtension('x-order', 4)
  async getNode(
    @Param('id') id: string,
  ): Promise<Repository | Activity | ContentContainer | ContentElement> {
    const node = await this.contentService.getNode(id);
    if (!node) {
      const errorMsg = `Content node ${id} not found!`;
      throw new NotFoundException(errorMsg);
    }
    return node.toJSON();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get content package entity (repository) by id',
    description: 'Returns the full repository structure',
  })
  @ApiParam({
    name: 'id',
    description: 'Content package (repository) id',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Content package overview',
    type: RepositoryDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Content package not found',
  })
  @ApiExtension('x-order', 2)
  async getPackage(@Param('id') id: string): Promise<Repository> {
    const item = await this.contentService.get(id);
    if (!item) throw new NotFoundException(`Content package ${id} not found`);
    return item.toJSON();
  }

  @Get(':id/access')
  @ApiExtension('x-order', 3)
  @ApiOperation({
    summary: 'Get Tailor CMS repository access information (users and roles)',
    description: 'Returns list of all users who have access to the repository',
  })
  @ApiParam({
    name: 'id',
    description: 'Repository ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @ApiResponse({
    status: 200,
    description: 'Repository access information',
    type: AccessWebhookPayloadDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Repository not found or access data not available',
  })
  async getRepositoryAccess(
    @Param('id') id: string,
  ): Promise<AccessWebhookPayloadDto> {
    const accessData = await this.contentService.getRepositoryAccess(id);
    if (!accessData) {
      throw new NotFoundException(
        `Repository ${id} not found or access data not available`,
      );
    }
    return accessData;
  }
}
