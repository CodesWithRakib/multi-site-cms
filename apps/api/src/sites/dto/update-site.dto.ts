import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { SiteStatus } from '@multi-site-cms/types';

export class UpdateSiteDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{2,8})*$/, {
    message: 'defaultLocale must be a valid BCP 47 locale tag',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  defaultLocale?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  timezone?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'paused', 'archived', 'suspended'])
  status?: SiteStatus;

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}
