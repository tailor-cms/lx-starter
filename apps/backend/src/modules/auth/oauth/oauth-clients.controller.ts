import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  CreateOAuthClientDto,
  QueryOAuthClientDto,
} from './dto/oauth-client.dto';
import {
  OAuthClientResponseDto,
  OAuthClientWithSecretResponseDto,
  PaginatedOAuthClientsResponseDto,
} from './dto/oauth-client-response.dto';
import { UserRole } from '@/database/entities';
import { IntegrationService } from '@/modules/integration/integration.service';
import { OAuthClientService } from './oauth-client.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('integrations')
@Controller('integrations/:id/clients')
export class IntegrationOAuthClientsController {
  constructor(
    private readonly oauthClientService: OAuthClientService,
    private readonly integrationService: IntegrationService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List OAuth clients for integration (Admin only)' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({
    status: 200,
    description: 'List of OAuth clients for this integration',
    type: PaginatedOAuthClientsResponseDto,
  })
  async list(
    @Param('id') id: string,
    @Query() query: QueryOAuthClientDto,
  ): Promise<PaginatedOAuthClientsResponseDto> {
    const integration = await this.integrationService.findOne(id);
    return this.oauthClientService.findAll({
      ...query,
      ownerId: integration.id,
    });
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create OAuth client for integration (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiResponse({
    status: 201,
    description: 'OAuth client created successfully.',
    type: OAuthClientWithSecretResponseDto,
  })
  async create(
    @Param('id') id: string,
    @Body() createDto: CreateOAuthClientDto,
    @CurrentUser() user: any,
  ): Promise<OAuthClientWithSecretResponseDto> {
    const integration = await this.integrationService.findOne(id);
    const result = await this.oauthClientService.createForIntegration(
      createDto,
      integration,
      user,
    );
    return {
      ...result.client.toJSON(),
      clientSecret: result.clientSecret,
    };
  }

  @Get(':clientId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get integration OAuth client (Admin only)' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiParam({ name: 'clientId', description: 'OAuth client ID' })
  @ApiResponse({
    status: 200,
    description: 'OAuth client found',
    type: OAuthClientResponseDto,
  })
  @ApiResponse({ status: 404, description: 'OAuth client not found' })
  async findOne(
    @Param('id') id: string,
    @Param('clientId') clientId: string,
  ): Promise<OAuthClientResponseDto> {
    const integration = await this.integrationService.findOne(id);
    const client = await this.oauthClientService.verifyIntegrationOwnership(
      clientId,
      integration,
    );
    return client.toJSON();
  }

  @Post(':clientId/rotate-secret')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate integration OAuth client secret (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiParam({ name: 'clientId', description: 'OAuth client ID' })
  @ApiResponse({
    status: 200,
    description: 'Client secret rotated successfully.',
    type: OAuthClientWithSecretResponseDto,
  })
  async rotateSecret(
    @Param('id') id: string,
    @Param('clientId') clientId: string,
  ): Promise<OAuthClientWithSecretResponseDto> {
    const integration = await this.integrationService.findOne(id);
    await this.oauthClientService.verifyIntegrationOwnership(
      clientId,
      integration,
    );
    const result = await this.oauthClientService.rotateSecret(clientId);
    return {
      ...result.client.toJSON(),
      clientSecret: result.clientSecret,
    };
  }

  @Delete(':clientId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete integration OAuth client (Admin only)' })
  @ApiParam({ name: 'id', description: 'Integration ID' })
  @ApiParam({ name: 'clientId', description: 'OAuth client ID' })
  @ApiResponse({
    status: 204,
    description: 'OAuth client deleted successfully',
  })
  async delete(@Param('id') id: string, @Param('clientId') clientId: string) {
    const integration = await this.integrationService.findOne(id);
    await this.oauthClientService.verifyIntegrationOwnership(
      clientId,
      integration,
    );
    return this.oauthClientService.delete(clientId);
  }
}
