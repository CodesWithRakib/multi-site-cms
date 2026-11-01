import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { RobotsPolicy } from '@multi-site-cms/types';

export class UpdateSeoDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  titleTemplate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  defaultDescription?: string;

  @IsString()
  @IsOptional()
  @IsIn(['all', 'noindex', 'nofollow', 'none'])
  robotsPolicy?: RobotsPolicy;

  @IsBoolean()
  @IsOptional()
  sitemapEnabled?: boolean;

  @IsString()
  @IsOptional()
  canonicalHost?: string;
}
