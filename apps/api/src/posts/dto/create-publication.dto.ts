import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreatePublicationDto {
  @ApiProperty({
    description: 'Target website ID',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsUUID('4')
  @IsNotEmpty()
  siteId!: string;

  @ApiProperty({ description: 'Site-scoped unique slug', example: 'hidden-gems-of-the-alps' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(96)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and single hyphens',
  })
  slug!: string;

  @ApiPropertyOptional({ description: 'Specific revision ID to pin (defaults to newest revision)' })
  @IsOptional()
  @IsUUID('4')
  revisionId?: string;

  @ApiPropertyOptional({
    description: 'Publication state',
    enum: PUBLICATION_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsIn(PUBLICATION_STATUSES)
  status?: PublicationStatus;

  @ApiPropertyOptional({ description: 'SEO title override for this site' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  seoTitle?: string;

  @ApiPropertyOptional({ description: 'SEO description override for this site' })
  @IsOptional()
  @IsString()
  @MaxLength(320)
  seoDescription?: string;

  @ApiPropertyOptional({ description: 'Canonical URL override for cross-domain syndication' })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/[^\s]+$/, {
    message: 'Canonical URL must be a valid absolute http(s) URL without whitespace',
  })
  canonicalUrl?: string;

  @ApiPropertyOptional({ description: 'Featured image media asset ID on the same site' })
  @IsOptional()
  @IsUUID('4')
  featuredImageId?: string;

  @ApiPropertyOptional({ description: 'Event on the same site this publication reports on' })
  @IsOptional()
  @IsUUID('4')
  eventId?: string;

  @ApiPropertyOptional({ description: 'Template key', example: 'standard-article' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9-]{0,63}$/, {
    message: 'Template key must be lowercase alphanumeric with hyphens',
  })
  templateKey?: string;

  @ApiPropertyOptional({
    description: 'Scheduled publication time (required if status is scheduled)',
  })
  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @ApiPropertyOptional({ description: 'Actual published timestamp' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

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
