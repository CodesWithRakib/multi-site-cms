import { IsArray } from 'class-validator';
import type { SiteNavigationItem } from '@multi-site-cms/types';

export class UpdateNavigationDto {
  @IsArray()
  items!: SiteNavigationItem[];
}
