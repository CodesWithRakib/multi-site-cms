import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { PaginatedResult, SiteDomainItem, SiteItem } from '@multi-site-cms/types';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireSiteContext } from '../auth/decorators/site-context.decorator';
import { SiteAccessGuard } from '../auth/guards/site-access.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import type { RequestContext } from '../common/http/request-context';
import {
  CreateDomainDto,
  CreateSiteDto,
  ListSitesQueryDto,
  UpdateBrandingDto,
  UpdateDomainDto,
  UpdateLocalesDto,
  UpdateNavigationDto,
  UpdateSeoDto,
  UpdateSiteDto,
  UpdateSiteSettingsDto,
} from './dto';
import { SitesAdminService, type VerificationChallengeDto } from './sites-admin.service';

@Controller('sites')
@UseGuards(SiteAccessGuard)
export class SitesAdminController {
  constructor(private readonly sitesService: SitesAdminService) {}

  @Post()
  @RequirePermissions('site:create')
  async createSite(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Body() dto: CreateSiteDto,
    @Req() req: Request,
  ): Promise<SiteItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.createSite(authContext, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Get()
  async listSites(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Query() query: ListSitesQueryDto,
  ): Promise<PaginatedResult<SiteItem>> {
    return this.sitesService.listSites(authContext, query);
  }

  @Get(':siteId')
  @RequireSiteContext()
  @RequirePermissions('site:read')
  async getSite(
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
  ): Promise<SiteItem> {
    return this.sitesService.getSiteById(siteId);
  }

  @Patch(':siteId')
  @RequireSiteContext()
  @RequirePermissions('site:update_settings')
  async updateSite(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: UpdateSiteDto,
    @Req() req: Request,
  ): Promise<SiteItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.updateSite(authContext, siteId, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Delete(':siteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireSiteContext()
  @RequirePermissions('site:delete')
  async deleteSite(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Req() req: Request,
  ): Promise<void> {
    const reqContext = req as RequestContext;
    return this.sitesService.archiveOrDeleteSite(authContext, siteId, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Patch(':siteId/settings')
  @RequireSiteContext()
  @RequirePermissions('site:update_settings')
  async updateSettings(
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: UpdateSiteSettingsDto,
    @Req() req: Request,
  ): Promise<SiteItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.updateSiteSettings(siteId, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Patch(':siteId/branding')
  @RequireSiteContext()
  @RequirePermissions('site:update_settings')
  async updateBranding(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: UpdateBrandingDto,
    @Req() req: Request,
  ): Promise<SiteItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.updateBranding(authContext, siteId, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Patch(':siteId/navigation')
  @RequireSiteContext()
  @RequirePermissions('site:update_settings')
  async updateNavigation(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: UpdateNavigationDto,
    @Req() req: Request,
  ): Promise<SiteItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.updateNavigation(authContext, siteId, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Patch(':siteId/seo')
  @RequireSiteContext()
  @RequirePermissions('site:update_settings')
  async updateSeo(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: UpdateSeoDto,
    @Req() req: Request,
  ): Promise<SiteItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.updateSeo(authContext, siteId, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Patch(':siteId/locales')
  @RequireSiteContext()
  @RequirePermissions('site:update_settings')
  async updateLocales(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: UpdateLocalesDto,
    @Req() req: Request,
  ): Promise<SiteItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.updateLocales(authContext, siteId, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Get(':siteId/domains')
  @RequireSiteContext()
  @RequirePermissions('domain:manage')
  async listDomains(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
  ): Promise<SiteDomainItem[]> {
    return this.sitesService.listDomains(authContext, siteId);
  }

  @Post(':siteId/domains')
  @RequireSiteContext()
  @RequirePermissions('domain:manage')
  async addDomain(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: CreateDomainDto,
    @Req() req: Request,
  ): Promise<{ domain: SiteDomainItem; challenge: VerificationChallengeDto }> {
    const reqContext = req as RequestContext;
    return this.sitesService.addDomain(authContext, siteId, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Patch(':siteId/domains/:domainId')
  @RequireSiteContext()
  @RequirePermissions('domain:manage')
  async updateDomain(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('domainId', new ParseUUIDPipe({ version: '4' })) domainId: string,
    @Body() dto: UpdateDomainDto,
    @Req() req: Request,
  ): Promise<SiteDomainItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.updateDomain(authContext, siteId, domainId, dto, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Delete(':siteId/domains/:domainId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireSiteContext()
  @RequirePermissions('domain:manage')
  async removeDomain(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('domainId', new ParseUUIDPipe({ version: '4' })) domainId: string,
    @Req() req: Request,
  ): Promise<void> {
    const reqContext = req as RequestContext;
    return this.sitesService.removeDomain(authContext, siteId, domainId, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }

  @Get(':siteId/domains/:domainId/challenge')
  @RequireSiteContext()
  @RequirePermissions('domain:manage')
  async getVerificationChallenge(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('domainId', new ParseUUIDPipe({ version: '4' })) domainId: string,
  ): Promise<VerificationChallengeDto> {
    return this.sitesService.getVerificationChallenge(authContext, siteId, domainId);
  }

  @Post(':siteId/domains/:domainId/verify')
  @RequireSiteContext()
  @RequirePermissions('domain:manage')
  async verifyDomain(
    @CurrentUser() authContext: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('domainId', new ParseUUIDPipe({ version: '4' })) domainId: string,
    @Req() req: Request,
  ): Promise<SiteDomainItem> {
    const reqContext = req as RequestContext;
    return this.sitesService.verifyDomain(authContext, siteId, domainId, {
      requestId: reqContext.requestId,
      ipAddress: req.ip,
    });
  }
}
