import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateIntegrationDto,
  QueryIntegrationDto,
  UpdateIntegrationDto,
} from './dto/integration.dto';
import {
  IntegrationResponseDto,
  PaginatedIntegrationsResponseDto,
} from './dto/integration-response.dto';
import { CurrentUser, Roles } from '@/modules/auth/common';
import { IntegrationService } from './integration.service';
import { UserRole } from '@/database/entities';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List integrations (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of integrations',
    type: PaginatedIntegrationsResponseDto,
  })
  async list(
    @Query() query: QueryIntegrationDto,
  ): Promise<PaginatedIntegrationsResponseDto> {
    return this.integrationService.findAll(query);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create integration (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Integration created successfully',
    type: IntegrationResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Integration already exists' })
  async create(
    @Body() createDto: CreateIntegrationDto,
    @CurrentUser() user: any,
  ): Promise<IntegrationResponseDto> {
    const integration = await this.integrationService.create(createDto, user);
    return integration.toJSON() as IntegrationResponseDto;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get integration by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({
    status: 200,
    description: 'Integration found',
    type: IntegrationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async findOne(@Param('id') id: string): Promise<IntegrationResponseDto> {
    const integration = await this.integrationService.findOne(id);
    return integration.toJSON() as IntegrationResponseDto;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update integration (Admin only)' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({
    status: 200,
    description: 'Integration updated successfully',
    type: IntegrationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateIntegrationDto,
  ): Promise<IntegrationResponseDto> {
    const integration = await this.integrationService.update(id, updateDto);
    return integration.toJSON() as IntegrationResponseDto;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete integration (Admin only)' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({ status: 204, description: 'Integration deleted successfully' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async delete(@Param('id') id: string) {
    return this.integrationService.delete(id);
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted integration (Admin only)' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({
    status: 200,
    description: 'Integration restored successfully',
    type: IntegrationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async restore(@Param('id') id: string): Promise<IntegrationResponseDto> {
    const integration = await this.integrationService.restore(id);
    return integration.toJSON() as IntegrationResponseDto;
  }
}
