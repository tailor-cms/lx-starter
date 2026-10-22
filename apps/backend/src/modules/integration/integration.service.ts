import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  QueryIntegrationDto,
} from './dto/integration.dto';
import type {
  IntegrationResponseDto,
  PaginatedIntegrationsResponseDto,
} from './dto/integration-response.dto';
import { User } from '@/database/entities';
import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Integration } from './entities/integration.entity';
import { IntegrationRepository } from './integration.repository';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class IntegrationService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly em: EntityManager,
    @InjectRepository(Integration)
    private readonly integrationRepo: IntegrationRepository,
  ) {
    this.logger.setContext(IntegrationService.name);
  }

  async create(dto: CreateIntegrationDto, creator: User): Promise<Integration> {
    this.logger.debug(`Creating integration: ${dto.name}`);
    const exists = await this.integrationRepo.findByName(dto.name);
    if (exists) {
      throw new ConflictException(`Integration "${dto.name}" already exists`);
    }
    const integration = this.integrationRepo.create({
      name: dto.name,
      description: dto.description,
      createdBy: creator,
      isActive: true,
    } as any);
    await this.em.persistAndFlush(integration);
    this.logger.debug(`Integration created: ${integration.id}`);
    return integration;
  }

  async findAll(
    query: QueryIntegrationDto = {},
  ): Promise<PaginatedIntegrationsResponseDto> {
    const { search, isActive, limit = 20, offset = 0 } = query;
    const where: FilterQuery<Integration> = { deletedAt: null };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.$or = [
        { name: { $ilike: `%${search}%` } },
        { description: { $ilike: `%${search}%` } },
      ];
    }
    const [data, total] = await this.integrationRepo.findAndCount(where, {
      limit,
      offset,
      populate: false,
      orderBy: { createdAt: 'DESC' },
    });
    return {
      data: data.map((integration) =>
        integration.toJSON(),
      ) as IntegrationResponseDto[],
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string): Promise<Integration> {
    this.logger.debug(`Finding integration: ${id}`);
    const integration = await this.integrationRepo.get(id);
    if (!integration || integration.isDeleted) {
      throw new NotFoundException(`Integration "${id}" not found`);
    }
    return integration;
  }

  async update(id: string, dto: UpdateIntegrationDto): Promise<Integration> {
    this.logger.debug(`Updating integration: ${id}`);
    const integration = await this.findOne(id);
    // Check for name conflict if changing name
    if (dto.name && dto.name !== integration.name) {
      const existing = await this.integrationRepo.findByName(dto.name);
      if (existing) {
        throw new ConflictException(`Integration "${dto.name}" already exists`);
      }
    }
    if (dto.name) integration.name = dto.name;
    if (dto.description !== undefined)
      integration.description = dto.description;
    if (dto.isActive !== undefined) integration.isActive = dto.isActive;
    await this.em.flush();
    this.logger.debug(`Integration updated: ${integration.id}`);
    return integration;
  }

  async delete(id: string): Promise<void> {
    this.logger.debug(`Deleting integration: ${id}`);
    const integration = await this.integrationRepo.findOne(
      { id },
      { populate: ['oauthClients'] },
    );
    if (!integration || integration.isDeleted) {
      throw new NotFoundException(`Integration "${id}" not found`);
    }
    if (integration.hasActiveClients) {
      throw new BadRequestException(`
        Cannot delete integration with active OAuth clients.
        Disable or delete clients first.`);
    }
    integration.softDelete();
    await this.em.flush();
    this.logger.debug(`Integration soft-deleted: ${integration.id}`);
  }

  async restore(id: string): Promise<Integration> {
    this.logger.debug(`Restoring integration: ${id}`);
    const integration = await this.integrationRepo.findOne(
      { id },
      { filters: false },
    );
    if (!integration) {
      throw new NotFoundException(`Integration "${id}" not found`);
    }
    if (!integration.isDeleted) {
      throw new BadRequestException('Integration is not deleted');
    }
    integration.restore();
    await this.em.flush();
    this.logger.debug(`Integration restored: ${integration.id}`);
    return integration;
  }

  async trackUsage(integration: Integration): Promise<void> {
    integration.lastUsedAt = new Date();
    await this.em.flush();
  }
}
