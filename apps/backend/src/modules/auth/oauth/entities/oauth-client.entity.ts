import * as bcrypt from 'bcrypt';
import {
  BeforeCreate,
  BeforeUpdate,
  Entity,
  Enum,
  Index,
  ManyToOne,
  Property,
  Rel,
} from '@mikro-orm/core';
import { BaseEntity } from '@/database/entities/base.entity';
import type { EventArgs } from '@mikro-orm/core';
import { Exclude } from 'class-transformer';
import { Integration } from '@/modules/integration/entities/integration.entity';
import { OAuthClientRepository } from '../oauth-client.repository';

export enum OAuthClientOwnerType {
  INTEGRATION = 'INTEGRATION',
}

/**
 * OAuth 2.0 Grant Types
 *
 * Currently only CLIENT_CREDENTIALS is implemented.
 * This is the standard grant type for machine-to-machine authentication.
 *
 * Future grant types (AUTHORIZATION_CODE) would require additional
 * implementation for user authorization flows.
 * TODO: AUTHORIZATION_CODE = 'authorization_code',
 */
export enum GrantType {
  CLIENT_CREDENTIALS = 'client_credentials',
}

@Entity({ tableName: 'oauth_clients', repository: () => OAuthClientRepository })
export class OAuthClient extends BaseEntity {
  @Property({ unique: true, nullable: false })
  @Index()
  clientId!: string;

  @Property({ hidden: true, nullable: false })
  @Exclude()
  clientSecret!: string;

  @Property({ nullable: false })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Enum(() => OAuthClientOwnerType)
  @Index()
  ownerType!: OAuthClientOwnerType;

  @ManyToOne(() => Integration, { nullable: false })
  ownerIntegration!: Rel<Integration>;

  @Property({ type: 'json', nullable: false })
  allowedScopes!: string[];

  @Property({ type: 'json', nullable: false })
  allowedGrantTypes: GrantType[] = [GrantType.CLIENT_CREDENTIALS];

  @Property({ nullable: false, default: true })
  isActive: boolean = true;

  @Property({ nullable: true })
  expiresAt?: Date;

  @Property({ nullable: true })
  rateLimit?: number;

  @Property({ nullable: true })
  lastUsedAt?: Date;

  @Property({ nullable: false, default: 0 })
  usageCount: number = 0;

  get owner(): Integration {
    return this.ownerIntegration;
  }

  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get canAuthenticate(): boolean {
    return this.isActive && !this.isExpired && !this.isDeleted;
  }

  @BeforeCreate()
  @BeforeUpdate()
  validateOwnership() {
    // For now, only INTEGRATION owner type is supported
    if (!this.ownerIntegration) {
      throw new Error('OAuth client must have an integration owner');
    }
  }

  @BeforeCreate()
  @BeforeUpdate()
  private hashClientSecret(_args: EventArgs<OAuthClient>) {
    // Only hash if clientSecret is being set/changed and isn't hashed
    if (this.clientSecret && !this.clientSecret.startsWith('$2')) {
      const saltRounds = parseInt(process.env.AUTH_SALT_ROUNDS || '10', 10);
      this.clientSecret = bcrypt.hashSync(this.clientSecret, saltRounds);
    }
  }

  async validateSecret(secret: string): Promise<boolean> {
    if (!this.clientSecret) return false;
    return bcrypt.compare(secret, this.clientSecret);
  }

  toJSON() {
    return {
      id: this.id,
      clientId: this.clientId,
      ownerType: this.ownerType,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      isExpired: this.isExpired,
      canAuthenticate: this.canAuthenticate,
      allowedScopes: this.allowedScopes,
      allowedGrantTypes: this.allowedGrantTypes,
      rateLimit: this.rateLimit,
      usageCount: this.usageCount,
      lastUsedAt: this.lastUsedAt ?? null,
      expiresAt: this.expiresAt ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
