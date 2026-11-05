import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import type { UserStatus } from '@multi-site-cms/types';

export class ListUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsIn(['active', 'invited', 'suspended', 'disabled'])
  status?: UserStatus;

  /** Case-insensitive match on email or display name. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  /** Users holding this role (on any site for site roles). */
  @IsOptional()
  @IsIn(['super_admin', 'admin'])
  roleKey?: 'super_admin' | 'admin';

  /** Users with any role on this site. */
  @IsOptional()
  @IsUUID('4')
  siteId?: string;
}
