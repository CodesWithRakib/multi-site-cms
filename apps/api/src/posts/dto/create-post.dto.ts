import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import {
  POST_STATUSES,
  POST_TYPES,
  type PostStatus,
  type PostType,
} from '../../database/entities/types';
import { CreatePublicationDto } from './create-publication.dto';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the initial revision',
    example: 'Discovering the Hidden Gems of the Alps',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    description: 'Optional summary or excerpt',
    example: 'A complete guide to alpine exploration.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  excerpt?: string;

  @ApiProperty({
    description: 'Structured editor JSON body (e.g. ProseMirror / Tiptap schema)',
    example: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }],
    },
  })
  @IsObject()
  @IsNotEmpty()
  body!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Content type',
    enum: POST_TYPES,
    default: 'article',
  })
  @IsOptional()
  @IsIn(POST_TYPES)
  type?: PostType;

  @ApiPropertyOptional({
    description: 'Editorial status of the canonical post',
    enum: POST_STATUSES,
    default: 'draft',
  })
  @IsOptional()
  @IsIn(POST_STATUSES)
  status?: PostStatus;

  @ApiPropertyOptional({ description: 'Source language code', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  sourceLocale?: string;

  @ApiPropertyOptional({ description: 'Summary of changes for revision history' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  changeSummary?: string;

  @ApiPropertyOptional({
    description: 'Optional initial site publications to create along with the post',
    type: () => [CreatePublicationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePublicationDto)
  publications?: CreatePublicationDto[];
}
