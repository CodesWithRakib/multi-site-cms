import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { SiteStatus } from '@multi-site-cms/types';

export class ListSitesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'archived', 'suspended'])
  status?: SiteStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
