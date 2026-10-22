import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class TokenRequestDto {
  @ApiProperty({
    description: 'OAuth 2.0 grant type',
    example: 'client_credentials',
    enum: ['client_credentials'],
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^client_credentials$/, {
    message: 'Only \'client_credentials\' grant_type is supported.',
  })
  grant_type!: string;

  @ApiProperty({
    description:
      'OAuth client ID (required if not using Basic Authentication)',
    example: 'client_abc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  client_id?: string;

  @ApiProperty({
    description:
      'OAuth client secret (required if not using Basic Authentication)',
    example: 'sk_xyz789',
    required: false,
  })
  @IsString()
  @IsOptional()
  client_secret?: string;

  @ApiProperty({
    description: 'Requested scopes (space-separated)',
    example: 'read:users write:content',
    required: false,
  })
  @IsString()
  @IsOptional()
  scope?: string;
}

export interface OAuthTokenPayload {
  sub: string; // OAuthClient ID
  client_id: string; // Client ID (for quick lookup)
  owner_type: 'USER' | 'INTEGRATION';
  owner_id: string; // User or Integration ID
  scope: string[]; // Granted scopes
  aud: 'oauth:api'; // OAuth token audience
  iss: string; // Issuer
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  jti: string; // JWT ID (for revocation)
}

export class OAuthTokenResponseDto {
  @ApiProperty({
    description: 'OAuth 2.0 access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    enum: ['Bearer'],
  })
  token_type!: 'Bearer';

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expires_in!: number;

  @ApiProperty({
    description: 'Granted scopes (space-separated)',
    example: 'read:users write:content',
  })
  scope!: string;
}
