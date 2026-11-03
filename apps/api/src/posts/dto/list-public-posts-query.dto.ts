import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { POST_TYPES, type PostType } from '../../database/entities/types';

export class ListPublicPostsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by content type', enum: POST_TYPES })
  @IsOptional()
  @IsIn(POST_TYPES)
  type?: PostType;

  @ApiPropertyOptional({ description: 'Filter by template key (e.g. breaking)' })
  @IsOptional()
  @IsString()
  templateKey?: string;

  @ApiPropertyOptional({ description: 'Filter by event ID' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Filter by category slug' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ description: 'Filter by tag slug' })
  @IsOptional()
  @IsString()
  tagSlug?: string;

  @ApiPropertyOptional({ description: 'Fulltext / title keyword search' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter only featured articles' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Sorting criteria',
    enum: ['newest', 'oldest', 'popular', 'title_asc'],
    default: 'newest',
  })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'popular', 'title_asc'])
  sort?: 'newest' | 'oldest' | 'popular' | 'title_asc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 12, maximum: 50 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}
