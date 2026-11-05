import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type {
  EffectivePlatformPolicy,
  PlatformSettings,
  PlatformSystemDiagnostics,
  PublicPlatformSettings,
} from '@multi-site-cms/types';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('platform')
  @RequirePermissions('platform:configure')
  @ApiOperation({ summary: 'Retrieve full platform configuration' })
  @ApiResponse({ status: 200, description: 'Platform settings' })
  async getPlatformSettings(): Promise<PlatformSettings> {
    return this.settingsService.getPlatformSettings();
  }

  @Patch('platform')
  @RequirePermissions('platform:configure')
  @ApiOperation({ summary: 'Update platform configuration sections' })
  @ApiResponse({ status: 200, description: 'Updated platform settings' })
  async updatePlatformSettings(
    @CurrentUser() actor: EffectiveAuthContext,
    @Body() dto: UpdatePlatformSettingsDto,
    @Req() req: Request,
  ): Promise<PlatformSettings> {
    // req.ip honors TRUST_PROXY; a raw X-Forwarded-For header is client-controlled.
    const ipAddress = req.ip ?? req.socket.remoteAddress ?? null;
    const requestId = (req as Request & { id?: string }).id ?? null;
    return this.settingsService.updatePlatformSettings(actor, dto, {
      ipAddress,
      requestId,
    });
  }

  @Get('policy')
  @RequirePermissions('post:read')
  @ApiOperation({
    summary: 'Enforced limits the admin UI needs (uploads, autosave, sign-in rules)',
  })
  @ApiResponse({ status: 200, description: 'Effective platform policy' })
  async getEffectivePolicy(): Promise<EffectivePlatformPolicy> {
    const policy = await this.settingsService.getPolicy();
    return {
      maxUploadSizeBytes: policy.media.maxUploadBytes,
      allowedMimeTypes: [...policy.media.allowedMimeTypes],
      autoSaveIntervalSeconds: policy.publishing.autoSaveIntervalSeconds,
      defaultPostStatus: policy.publishing.defaultPostStatus,
      previewTokenTtlMinutes: policy.publishing.previewTokenTtlMs / 60_000,
      passwordMinLength: policy.password.minLength,
      requireStrongPasswords: policy.password.requireStrong,
    };
  }

  @Get('diagnostics')
  @RequirePermissions('platform:configure')
  @ApiOperation({ summary: 'System diagnostics and infrastructure health telemetry' })
  @ApiResponse({ status: 200, description: 'Platform diagnostics' })
  async getDiagnostics(): Promise<PlatformSystemDiagnostics> {
    return this.settingsService.getDiagnostics();
  }

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Public safe platform metadata and maintenance state' })
  @ApiResponse({ status: 200, description: 'Public settings' })
  async getPublicSettings(): Promise<PublicPlatformSettings> {
    return this.settingsService.getPublicSettings();
  }
}
