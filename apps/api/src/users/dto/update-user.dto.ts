import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { UserStatus } from '@multi-site-cms/types';

import { PhoneField } from './phone';

export class UpdateUserDto {
  /** Optional contact phone (E.164). Null or "" clears it. */
  @PhoneField()
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;

  @IsOptional()
  @IsIn(['active', 'invited', 'suspended', 'disabled'])
  status?: UserStatus;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}
