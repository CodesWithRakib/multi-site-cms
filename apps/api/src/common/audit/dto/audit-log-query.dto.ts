import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import type { AuditLogCategory } from '@multi-site-cms/types';

export class AuditLogQueryDto {
  @ApiPropertyOptional({ description: 'Filter by site UUID' })
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @ApiPropertyOptional({ description: 'Filter by specific action or action prefix' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Category filter',
    enum: ['all', 'auth', 'content', 'user', 'system', 'media'],
  })
  @IsOptional()
  @IsIn(['all', 'auth', 'content', 'user', 'system', 'media'])
  category?: AuditLogCategory;

  @ApiPropertyOptional({ description: 'Filter by entity type (e.g. post, user, media)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by actor user UUID' })
  @IsOptional()
  @IsUUID('4')
  actorId?: string;

  @ApiPropertyOptional({ description: 'Search query across action, user, IP, or metadata' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ISO date or YYYY-MM-DD start date filter' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ISO date or YYYY-MM-DD end date filter' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description:
      'Opaque keyset cursor from a previous response (`nextCursor`). When set, `page` is ignored and the next older page is returned.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  cursor?: string;

  @ApiPropertyOptional({ description: 'Page limit', default: 20 })
  @IsOptional()
  @Transform(({ value }) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? 20 : Math.min(parsed, 100);
  })
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
