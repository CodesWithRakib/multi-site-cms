import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type {
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
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const requestId = (req.headers['x-request-id'] as string) || null;
    return this.settingsService.updatePlatformSettings(actor, dto, {
      ipAddress,
      requestId,
    });
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

