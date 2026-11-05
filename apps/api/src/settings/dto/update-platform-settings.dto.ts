import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import type {
  PlatformGeneralSettings,
  PlatformMaintenanceSettings,
  PlatformMediaSettings,
  PlatformPublishingSettings,
  PlatformSecuritySettings,
  UpdatePlatformSettingsPayload,
} from '@multi-site-cms/types';

export class UpdatePlatformSettingsDto implements UpdatePlatformSettingsPayload {
  @ApiPropertyOptional()
  @IsOptional()
  general?: Partial<PlatformGeneralSettings>;

  @ApiPropertyOptional()
  @IsOptional()
  security?: Partial<PlatformSecuritySettings>;

  @ApiPropertyOptional()
  @IsOptional()
  media?: Partial<PlatformMediaSettings>;

  @ApiPropertyOptional()
  @IsOptional()
  publishing?: Partial<PlatformPublishingSettings>;

  @ApiPropertyOptional()
  @IsOptional()
  maintenance?: Partial<PlatformMaintenanceSettings>;
}
