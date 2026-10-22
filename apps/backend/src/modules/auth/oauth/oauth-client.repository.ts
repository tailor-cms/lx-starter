import { EntityRepository } from '@mikro-orm/core';
import type { OAuthClient } from './entities/oauth-client.entity';

export class OAuthClientRepository extends EntityRepository<OAuthClient> {
  async get(id: string): Promise<OAuthClient | null> {
    return this.findOne(id, {
      filters: false,
      populate: ['ownerIntegration'],
    });
  }

  async findByClientId(clientId: string): Promise<OAuthClient | null> {
    return this.findOne(
      { clientId },
      {
        filters: false,
        populate: ['ownerIntegration'],
      },
    );
  }

  async findByIntegration(integrationId: string): Promise<OAuthClient[]> {
    return this.find(
      { ownerIntegration: integrationId },
      { filters: false, populate: ['ownerIntegration'] },
    );
  }

  async findActive(): Promise<OAuthClient[]> {
    return this.find(
      {
        isActive: true,
        deletedAt: null,
      },
      { populate: ['ownerIntegration'] },
    );
  }
}
