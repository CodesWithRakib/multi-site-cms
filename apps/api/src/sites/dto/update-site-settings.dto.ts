import { IsObject } from 'class-validator';

export class UpdateSiteSettingsDto {
  @IsObject()
  settings!: Record<string, unknown>;
}
