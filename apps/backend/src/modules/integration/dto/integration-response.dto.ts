import { ApiProperty } from '@nestjs/swagger';

export class IntegrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ required: false })
  lastUsedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  hasActiveClients: boolean;
}

export class PaginatedIntegrationsResponseDto {
  @ApiProperty({ type: [IntegrationResponseDto] })
  data: IntegrationResponseDto[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Offset for pagination' })
  offset: number;
}
