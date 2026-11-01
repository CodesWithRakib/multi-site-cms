import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { PUBLICATION_STATUSES, type PublicationStatus } from '../../database/entities/types';

export class UpdatePublicationDto {
  @ApiPropertyOptional({
    description: 'Site-scoped unique slug',
    example: 'hidden-gems-of-the-alps',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(96)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Specific revision ID to pin' })
  @IsOptional()
  @IsUUID('4')
  revisionId?: string;

  @ApiPropertyOptional({
    description: 'Publication state',
    enum: PUBLICATION_STATUSES,
  })
  @IsOptional()
  @IsIn(PUBLICATION_STATUSES)
  status?: PublicationStatus;

  @ApiPropertyOptional({ description: 'SEO title override for this site' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoTitle?: string | null;

  @ApiPropertyOptional({ description: 'SEO description override for this site' })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string | null;

  @ApiPropertyOptional({ description: 'Canonical URL override for cross-domain syndication' })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/[^\s]+$/, {
    message: 'Canonical URL must be a valid absolute http(s) URL without whitespace',
  })
  canonicalUrl?: string | null;

  @ApiPropertyOptional({ description: 'Featured image media asset ID on the same site' })
  @IsOptional()
  @IsUUID('4')
  featuredImageId?: string | null;

  @ApiPropertyOptional({ description: 'Template key', example: 'standard-article' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{0,63}$/, {
    message: 'Template key must be lowercase alphanumeric with hyphens',
  })
  templateKey?: string | null;

  @ApiPropertyOptional({ description: 'Scheduled publication time' })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string | null;

  @ApiPropertyOptional({ description: 'Actual published timestamp' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;

  @ApiPropertyOptional({
    description: 'Category IDs to associate with this publication',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Tag IDs to associate with this publication',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
