import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import type { ThemePreference } from '@multi-site-cms/types';

export class UpdateBrandingDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'primaryColor must be a valid hex color code (e.g. #0070f3)',
  })
  primaryColor?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'secondaryColor must be a valid hex color code',
  })
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
    message: 'accentColor must be a valid hex color code',
  })
  accentColor?: string;

  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  themePreference?: ThemePreference;

  @IsUUID('4')
  @IsOptional()
  logoMediaId?: string | null;

  @IsUUID('4')
  @IsOptional()
  faviconMediaId?: string | null;
}
