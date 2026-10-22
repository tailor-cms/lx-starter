import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  CreateOAuthClientDto,
  UpdateOAuthClientDto,
  QueryOAuthClientDto,
} from './dto/oauth-client.dto';
import { ConfigService } from '@nestjs/config';
import { EntityManager, FilterQuery, wrap } from '@mikro-orm/core';
import {
  GrantType,
  OAuthClient,
  OAuthClientOwnerType,
} from './entities/oauth-client.entity';
import type {
  OAuthClientResponseDto,
  PaginatedOAuthClientsResponseDto,
} from './dto/oauth-client-response.dto';
import { User, UserRole } from '@/database/entities';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Integration } from '@/modules/integration/entities/integration.entity';
import type { OAuthClientConfig } from '@/config/oauth-client.config';
import { OAuthClientRepository } from './oauth-client.repository';
import { PinoLogger } from 'nestjs-pino';
import { randomBytes } from 'node:crypto';
import { ScopeValidator } from './scopes';

@Injectable()
export class OAuthClientService {
  private oauthConfig: OAuthClientConfig;

  constructor(
    @InjectRepository(OAuthClient)
    private readonly oauthClientRepo: OAuthClientRepository,
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.oauthConfig = configService.get('oauthClient') as OAuthClientConfig;
    this.logger.setContext(OAuthClientService.name);
  }

  /**
   * Create OAuth client for an Integration
   */
  async createForIntegration(
    dto: CreateOAuthClientDto,
    integration: Integration,
    creator: User,
  ): Promise<{ client: OAuthClient; clientSecret: string }> {
    this.logger.debug(
      `Creating OAuth client for integration: ${integration.name}`,
    );
    if (creator.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can create OAuth clients for integrations',
      );
    }
    const validatedScopes = this.validateScopesForAdmin(dto.scopes);
    const clientId = this.generateClientId();
    const clientSecret = this.generateClientSecret();
    const client = this.oauthClientRepo.create({
      clientId,
      clientSecret, // Will be hashed by entity lifecycle hook
      name: dto.name,
      description: dto.description,
      ownerType: OAuthClientOwnerType.INTEGRATION,
      ownerIntegration: integration,
      allowedScopes: validatedScopes,
      allowedGrantTypes: [GrantType.CLIENT_CREDENTIALS],
      isActive: true,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      rateLimit: dto.rateLimit ?? this.oauthConfig.security.defaultRateLimit,
      usageCount: 0,
    } as any);
    await this.em.persistAndFlush(client);
    this.logger.debug(
      `OAuth client created for integration: ${client.clientId}`,
    );
    return { client, clientSecret };
  }

  /**
   * Find all OAuth clients with pagination
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of OAuth clients
   */
  async findAll(
    query: QueryOAuthClientDto = {},
  ): Promise<PaginatedOAuthClientsResponseDto> {
    const { ownerId, isActive, limit = 20, offset = 0 } = query;
    const where: FilterQuery<OAuthClient> = {
      deletedAt: null,
    };
    if (ownerId) {
      where.ownerIntegration = ownerId;
    }
    if (isActive !== undefined) where.isActive = isActive;
    const [data, total] = await this.oauthClientRepo.findAndCount(where, {
      limit,
      offset,
      populate: false,
      orderBy: { createdAt: 'DESC' },
    });
    return {
      data: data.map((client) => client.toJSON()) as OAuthClientResponseDto[],
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<OAuthClient> {
    this.logger.debug(`Finding OAuth client: ${id}`);
    const client = await this.oauthClientRepo.get(id);
    if (!client || client.isDeleted) {
      throw new NotFoundException(`OAuth client "${id}" not found`);
    }
    return client;
  }

  async findByClientId(clientId: string): Promise<OAuthClient> {
    this.logger.debug(`Finding OAuth client by clientId: ${clientId}`);
    const client = await this.oauthClientRepo.findByClientId(clientId);
    if (!client || client.isDeleted) {
      throw new NotFoundException(`OAuth client not found`);
    }
    return client;
  }

  async update(id: string, dto: UpdateOAuthClientDto): Promise<OAuthClient> {
    this.logger.debug(`Updating OAuth client: ${id}`);
    const client = await this.findOne(id);
    if (dto.scopes) {
      const validatedScopes = this.validateScopesForAdmin(dto.scopes);
      client.allowedScopes = validatedScopes;
    }
    const { scopes, expiresAt, ...fieldsToAssign } = dto;
    wrap(client).assign(fieldsToAssign, {
      updateNestedEntities: false,
      mergeObjectProperties: false,
    });
    if (expiresAt !== undefined) {
      client.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    }
    await this.em.flush();
    this.logger.debug(`OAuth client updated: ${client.clientId}`);
    return client;
  }

  async rotateSecret(
    id: string,
  ): Promise<{ client: OAuthClient; clientSecret: string }> {
    this.logger.debug(`Rotating secret for OAuth client: ${id}`);
    const client = await this.findOne(id);
    const clientSecret = this.generateClientSecret();
    client.clientSecret = clientSecret; // Will be hashed by entity hook
    await this.em.flush();
    this.logger.debug(`OAuth client secret rotated: ${client.clientId}`);
    return { client, clientSecret };
  }

  async delete(id: string): Promise<void> {
    this.logger.debug(`Deleting OAuth client: ${id}`);
    const client = await this.findOne(id);
    client.softDelete();
    await this.em.flush();
    this.logger.debug(`OAuth client soft-deleted: ${client.clientId}`);
  }

  async validateCredentials(
    clientId: string,
    clientSecret: string,
  ): Promise<OAuthClient> {
    const client = await this.findByClientId(clientId);
    if (!client.canAuthenticate) {
      throw new UnauthorizedException(
        'OAuth client is inactive, expired, or deleted',
      );
    }
    const isValid = await client.validateSecret(clientSecret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid client credentials');
    }
    return client;
  }

  async trackUsage(client: OAuthClient): Promise<void> {
    client.lastUsedAt = new Date();
    client.usageCount += 1;
    await this.em.flush();
  }

  /**
   * Verify OAuth client belongs to specified integration
   */
  async verifyIntegrationOwnership(
    clientId: string,
    integration: Integration,
  ): Promise<OAuthClient> {
    const client = await this.findOne(clientId);
    if (
      client.ownerType !== OAuthClientOwnerType.INTEGRATION ||
      client.ownerIntegration?.id !== integration.id
    ) {
      throw new NotFoundException(
        'OAuth client not found for this integration',
      );
    }
    return client;
  }

  private validateScopesForAdmin(scopes: string[]): string[] {
    // Validate that all scopes exist
    const invalid = ScopeValidator.getInvalidScopes(scopes);
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid scopes: ${invalid.join(', ')}`);
    }
    // Note: Admin users CAN assign admin scopes to OAuth clients for
    // first-party integrations that need full control (e.g., admin dashboards,
    // internal automation tools). This is a trusted use case.
    return scopes;
  }

  private generateClientId(): string {
    const random = randomBytes(16).toString('base64url');
    return `client_${random}`;
  }

  private generateClientSecret(): string {
    const random = randomBytes(32).toString('base64url');
    return `sk_${random}`;
  }
}
