import { ApiProperty } from '@nestjs/swagger';
import {
  GrantType,
  OAuthClientOwnerType,
} from '../entities/oauth-client.entity';

export class OAuthClientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clientId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: OAuthClientOwnerType })
  ownerType: OAuthClientOwnerType;

  @ApiProperty({ type: [String] })
  allowedScopes: string[];

  @ApiProperty({ type: [String], enum: GrantType })
  allowedGrantTypes: GrantType[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false, nullable: true })
  expiresAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  lastUsedAt?: Date | null;

  @ApiProperty()
  usageCount: number;

  @ApiProperty({ required: false })
  rateLimit?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  canAuthenticate: boolean;
}

export class OAuthClientWithSecretResponseDto extends OAuthClientResponseDto {
  @ApiProperty({
    description: 'Client secret - only shown once on creation/rotation',
  })
  clientSecret: string;
}

export class PaginatedOAuthClientsResponseDto {
  @ApiProperty({ type: [OAuthClientResponseDto] })
  data: OAuthClientResponseDto[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Offset for pagination' })
  offset: number;
}
