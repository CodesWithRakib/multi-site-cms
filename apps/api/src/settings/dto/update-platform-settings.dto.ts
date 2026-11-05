import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsTimeZone,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type {
  PlatformGeneralSettings,
  PlatformMaintenanceSettings,
  PlatformMediaSettings,
  PlatformPublishingSettings,
  PlatformSecuritySettings,
  UpdatePlatformSettingsPayload,
} from '@multi-site-cms/types';

/*
 * Every section is a partial update, so every field is optional, but each
 * present field is type- and range-checked. Unknown keys are rejected by the
 * global ValidationPipe (`forbidNonWhitelisted`) now that the nested objects
 * are validated, so nothing arbitrary can be merged into the stored JSON.
 * Ranges mirror the admin forms.
 */

class GeneralSettingsDto implements Partial<PlatformGeneralSettings> {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) platformName?: string;
  @IsOptional() @IsString() @MaxLength(200) tagline?: string;
  @IsOptional() @IsEmail() @MaxLength(255) contactEmail?: string;
  @IsOptional() @IsIn(['en', 'bn']) defaultLocale?: string;
  @IsOptional() @IsTimeZone() defaultTimezone?: string;
}

class SecuritySettingsDto implements Partial<PlatformSecuritySettings> {
  @IsOptional() @IsInt() @Min(1) @Max(720) sessionTtlHours?: number;
  @IsOptional() @IsInt() @Min(1) @Max(20) maxLoginAttempts?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1440) lockoutDurationMinutes?: number;
  @IsOptional() @IsInt() @Min(8) @Max(64) passwordMinLength?: number;
  @IsOptional() @IsBoolean() requireStrongPasswords?: boolean;
}

class MediaSettingsDto implements Partial<PlatformMediaSettings> {
  @IsOptional() @IsInt() @Min(1) @Max(100 * 1024 * 1024) maxUploadSizeBytes?: number;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @Matches(/^[a-z]+\/[a-z0-9.+-]+$/, { each: true })
  allowedMimeTypes?: string[];
}

class PublishingSettingsDto implements Partial<PlatformPublishingSettings> {
  @IsOptional() @IsIn(['draft', 'in_review']) defaultPostStatus?: 'draft' | 'in_review';
  @IsOptional() @IsInt() @Min(5) @Max(300) autoSaveIntervalSeconds?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) maxRevisionHistory?: number;
  @IsOptional() @IsInt() @Min(5) @Max(1440) previewTokenTtlMinutes?: number;
}

class MaintenanceSettingsDto implements Partial<PlatformMaintenanceSettings> {
  @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @IsOptional() @IsString() @MaxLength(500) maintenanceNoticeEn?: string;
  @IsOptional() @IsString() @MaxLength(500) maintenanceNoticeBn?: string;
  // Audit history is kept at least a year (enforced again in platform-policy.ts).
  @IsOptional() @IsInt() @Min(365) @Max(3650) auditRetentionDays?: number;
}

export class UpdatePlatformSettingsDto implements UpdatePlatformSettingsPayload {
  @ApiPropertyOptional({ type: GeneralSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  general?: GeneralSettingsDto;

  @ApiPropertyOptional({ type: SecuritySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  security?: SecuritySettingsDto;

  @ApiPropertyOptional({ type: MediaSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MediaSettingsDto)
  media?: MediaSettingsDto;

  @ApiPropertyOptional({ type: PublishingSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PublishingSettingsDto)
  publishing?: PublishingSettingsDto;

  @ApiPropertyOptional({ type: MaintenanceSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MaintenanceSettingsDto)
  maintenance?: MaintenanceSettingsDto;
}
