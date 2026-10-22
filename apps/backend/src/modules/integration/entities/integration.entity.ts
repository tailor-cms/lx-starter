import {
  Collection,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { BaseEntity } from '@/database/entities/base.entity';
import { IntegrationRepository } from '../integration.repository';
import { User } from '@/database/entities';

@Entity({ tableName: 'integrations', repository: () => IntegrationRepository })
export class Integration extends BaseEntity {
  @Property({ unique: true, nullable: false })
  @Index()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ nullable: false, default: true })
  isActive: boolean = true;

  @ManyToOne(() => User, { nullable: false })
  createdBy!: User;

  @Property({ nullable: true })
  lastUsedAt?: Date;

  @OneToMany('OAuthClient', 'ownerIntegration', {
    nullable: true,
    hidden: true,
    serializer: () => undefined,
  })
  oauthClients = new Collection<any>(this);

  get hasActiveClients(): boolean {
    // Check if collection is initialized to avoid triggering lazy load
    if (!this.oauthClients.isInitialized()) return false;
    return this.oauthClients.getItems().some((c: any) => c.isActive);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      hasActiveClients: this.hasActiveClients,
      lastUsedAt: this.lastUsedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
