import { EntityRepository } from '@mikro-orm/core';
import type { Integration } from './entities/integration.entity';

export class IntegrationRepository extends EntityRepository<Integration> {
  async get(id: string): Promise<Integration | null> {
    return this.findOne(id, { filters: false });
  }

  async findByName(name: string): Promise<Integration | null> {
    return this.findOne({ name }, { filters: false });
  }

  async findActive(): Promise<Integration[]> {
    return this.find({ isActive: true, deletedAt: null });
  }
}
