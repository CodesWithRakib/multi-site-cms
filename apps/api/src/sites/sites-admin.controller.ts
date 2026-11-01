import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';

import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireSiteContext } from '../auth/decorators/site-context.decorator';
import { SiteAccessGuard } from '../auth/guards/site-access.guard';
import { type UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SitesAdminService, type SiteSummaryDto } from './sites-admin.service';

@Controller('sites')
@UseGuards(SiteAccessGuard)
export class SitesAdminController {
  constructor(private readonly sitesService: SitesAdminService) {}

  @Get(':siteId')
  @RequireSiteContext()
  @RequirePermissions('site:read')
  async getSite(
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
  ): Promise<SiteSummaryDto> {
    return this.sitesService.getSiteById(siteId);
  }

  @Patch(':siteId/settings')
  @RequireSiteContext()
  @RequirePermissions('site:update_settings')
  async updateSettings(
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: UpdateSiteSettingsDto,
  ): Promise<SiteSummaryDto> {
    return this.sitesService.updateSiteSettings(siteId, dto);
  }
}
