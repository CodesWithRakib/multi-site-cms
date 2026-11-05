import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { UserStatus } from '@multi-site-cms/types';

import { PhoneField } from './phone';

export class CreateUserDto {
  /** Optional contact phone (E.164). Null or "" clears it. */
  @PhoneField()
  phone?: string | null;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  displayName!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsIn(['active', 'invited', 'suspended', 'disabled'])
  status?: UserStatus;
}
