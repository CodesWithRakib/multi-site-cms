import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import type { DomainStatus } from '@multi-site-cms/types';

export class UpdateDomainDto {
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'disabled'])
  status?: DomainStatus;
}
