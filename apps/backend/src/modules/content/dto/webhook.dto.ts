import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Webhook payload from TailorCMS
 *
 * When a repository meta is published: { repositoryId: number }
 * When an activity is published: { repositoryId: number, activityId: number }
 */
export class WebhookPayloadDto {
  @ApiProperty({
    description: 'Repository ID',
    example: 456,
  })
  @IsNumber()
  repositoryId!: number;

  @ApiProperty({
    description: 'Activity ID (present when activity is published)',
    example: 123,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  activityId?: number;
}

/**
 * User with repository access
 */
class AccessUserDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  email!: string;

  @ApiProperty({ example: 'John', nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @ApiProperty({ example: 'Doe', nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  role!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  assignedAt!: string;
}

/**
 * Group member
 */
class AccessGroupMemberDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 'member@example.com' })
  @IsString()
  email!: string;

  @ApiProperty({ example: 'Jane', nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @ApiProperty({ example: 'Smith', nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiProperty({ example: 'MEMBER' })
  @IsString()
  role!: string;
}

/**
 * Access group with members
 */
class AccessGroupDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 'Content Team' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'https://example.com/logo.png', nullable: true })
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @ApiProperty({ type: [AccessGroupMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccessGroupMemberDto)
  members!: AccessGroupMemberDto[];
}

/**
 * Access webhook payload from TailorCMS
 * Sent when repository access rights are updated
 * The payload IS the access data object itself (not wrapped)
 */
export class AccessWebhookPayloadDto {
  @ApiProperty({ example: 456 })
  @IsNumber()
  id!: number;

  @ApiProperty({ example: 'repo_abc123' })
  @IsString()
  uid!: string;

  @ApiProperty({ type: [AccessUserDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccessUserDto)
  users!: AccessUserDto[];

  @ApiProperty({ type: [AccessGroupDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccessGroupDto)
  groups!: AccessGroupDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  updatedAt!: string;
}
