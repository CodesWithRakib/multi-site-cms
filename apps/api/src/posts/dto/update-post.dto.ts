import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import {
  POST_STATUSES,
  POST_TYPES,
  type PostStatus,
  type PostType,
} from '../../database/entities/types';

export class UpdatePostDto {
  @ApiPropertyOptional({
    description:
      'Expected revision number for optimistic concurrency control. Conflicts return HTTP 409.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedRevisionNumber?: number;

  @ApiPropertyOptional({
    description: 'Updated title (creates new revision if changed)',
    example: 'New Title',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated excerpt', example: 'Updated excerpt summary.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  excerpt?: string | null;

  @ApiPropertyOptional({
    description: 'Updated structured editor JSON body (creates new revision if changed)',
  })
  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Content type',
    enum: POST_TYPES,
  })
  @IsOptional()
  @IsIn(POST_TYPES)
  type?: PostType;

  @ApiPropertyOptional({
    description: 'Editorial status of the canonical post',
    enum: POST_STATUSES,
  })
  @IsOptional()
  @IsIn(POST_STATUSES)
  status?: PostStatus;

  @ApiPropertyOptional({ description: 'Source language code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  sourceLocale?: string;

  @ApiPropertyOptional({ description: 'Summary of changes for revision history' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeSummary?: string;
}
