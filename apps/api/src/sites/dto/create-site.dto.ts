import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsTimeZone,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { SiteStatus } from '@multi-site-cms/types';

export class CreateSiteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(63)
  @Matches(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/, {
    message: 'key must be lowercase alphanumeric with optional single hyphens',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  key!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{2,8})*$/, {
    message: 'defaultLocale must be a valid BCP 47 locale tag',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : 'en'))
  defaultLocale: string = 'en';

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @IsTimeZone({ message: 'timezone must be an IANA time zone such as Asia/Dhaka' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : 'UTC'))
  timezone?: string = 'UTC';

  @IsString()
  @IsOptional()
  @IsIn(['active', 'paused', 'archived', 'suspended'])
  status?: SiteStatus = 'active';

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}
