import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isValidDate', async: false })
export class IsValidDateConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value) return true; // Optional field
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  defaultMessage() {
    return 'expiresAt must be a valid date string';
  }
}

export class CreateOAuthClientDto {
  @ApiProperty({
    description: 'OAuth client name',
    example: 'My Integration',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'OAuth client description',
    example: 'API access for my automation script',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Allowed scopes for this client',
    example: ['read:users', 'write:content'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  scopes!: string[];

  @ApiPropertyOptional({
    description: 'Client expiration date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @Validate(IsValidDateConstraint)
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Rate limit (requests per hour)',
    example: 1000,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  rateLimit?: number;
}

export class UpdateOAuthClientDto {
  @ApiPropertyOptional({
    description: 'OAuth client name',
    example: 'My Integration',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'OAuth client description',
    example: 'API access for my automation script',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Allowed scopes for this client',
    example: ['read:users', 'write:content'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  scopes?: string[];

  @ApiPropertyOptional({
    description: 'Whether the client is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Client expiration date',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @Validate(IsValidDateConstraint)
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Rate limit (requests per hour)',
    example: 1000,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  rateLimit?: number;
}

export class QueryOAuthClientDto {
  @ApiPropertyOptional({
    description: 'Filter by integration ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    default: 20,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Pagination offset',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
