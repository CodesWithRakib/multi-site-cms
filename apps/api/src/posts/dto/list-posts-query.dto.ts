import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

import {
  POST_STATUSES,
  POST_TYPES,
  PUBLICATION_STATUSES,
  type PostStatus,
  type PostType,
  type PublicationStatus,
} from '../../database/entities/types';

export const POST_FILTER_STATUSES = Array.from(
  new Set([...POST_STATUSES, ...PUBLICATION_STATUSES]),
);
export type PostFilterStatus = PostStatus | PublicationStatus;

export class ListPostsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by content type', enum: POST_TYPES })
  @IsOptional()
  @IsIn(POST_TYPES)
  type?: PostType;

  @ApiPropertyOptional({ description: 'Filter by editorial or publication status', enum: POST_FILTER_STATUSES })
  @IsOptional()
  @IsIn(POST_FILTER_STATUSES)
  status?: PostFilterStatus;

  @ApiPropertyOptional({ description: 'Filter by author user ID' })
  @IsOptional()
  @IsUUID('4')
  authorId?: string;

  @ApiPropertyOptional({ description: 'Filter posts published on a specific site ID' })
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @ApiPropertyOptional({ description: 'Search term across title or excerpt' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by created after timestamp' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by created before timestamp' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt'])
  sortBy?: 'createdAt' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
