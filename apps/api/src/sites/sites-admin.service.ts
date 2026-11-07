import { randomBytes } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type {
  PaginatedResult,
  SiteDomainItem,
  SiteItem,
  SiteSettings,
  SiteStatus,
} from '@multi-site-cms/types';
import { normalizeHostname } from '@multi-site-cms/validation';
import { normalizeSiteAbout } from '@multi-site-cms/validation/site-about';
import { type DataSource, type Repository } from 'typeorm';

import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { DATA_SOURCE } from '../database/database.tokens';
import { PostPublication } from '../database/entities/post-publication.entity';
import { SiteDomain } from '../database/entities/site-domain.entity';
import { Site } from '../database/entities/site.entity';
import { getInitializedRepository } from '../database/ensure-connected';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import type {
  CreateDomainDto,
  CreateSiteDto,
  ListSitesQueryDto,
  UpdateAboutDto,
  UpdateBrandingDto,
  UpdateDomainDto,
  UpdateLocalesDto,
  UpdateNavigationDto,
  UpdateSeoDto,
  UpdateSiteDto,
  UpdateSiteSettingsDto,
} from './dto';
import { validateNavigationItems } from './utils/navigation-validator';

export type SiteSummaryDto = SiteItem;

export interface RequestInfo {
  ipAddress?: string | null;
  requestId?: string | null;
  actorId?: string | null;
}

export interface VerificationChallengeDto {
  domainId: string;
  hostname: string;
  verificationToken: string;
  recordType: 'TXT';
  recordName: string;
  recordValue: string;
  expiresAt: string | null;
  isVerified: boolean;
}

@Injectable()
export class SitesAdminService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  private async getSiteRepo(): Promise<Repository<Site>> {
    return getInitializedRepository(this.dataSource, Site);
  }

  private async getDomainRepo(): Promise<Repository<SiteDomain>> {
    return getInitializedRepository(this.dataSource, SiteDomain);
  }

  private async getPublicationRepo(): Promise<Repository<PostPublication>> {
    return getInitializedRepository(this.dataSource, PostPublication);
  }

  /**
   * Lists sites accessible to the current actor with pagination and filtering.
   * Super Admins see all sites; Admins only see explicitly assigned sites.
   */
  async listSites(
    authContext: EffectiveAuthContext,
    query: ListSitesQueryDto,
  ): Promise<PaginatedResult<SiteItem>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    if (!authContext.isSuperAdmin && authContext.authorizedSiteIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const siteRepo = await this.getSiteRepo();
    const qb = siteRepo.createQueryBuilder('site').leftJoinAndSelect('site.domains', 'domain');

    if (!authContext.isSuperAdmin) {
      qb.andWhere('site.id IN (:...siteIds)', { siteIds: authContext.authorizedSiteIds });
    }

    if (query.status) {
      qb.andWhere('site.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('(site.name ILIKE :search OR site.key ILIKE :search)', {
        search: `%${query.search.trim()}%`,
      });
    }

    qb.orderBy('site.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [sites, total] = await qb.getManyAndCount();

    return {
      items: sites.map((s) => this.toSiteItem(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Creates a new site in the registry.
   */
  async createSite(
    authContext: EffectiveAuthContext,
    dto: CreateSiteDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const key = dto.key.toLowerCase().trim();

    const existing = await siteRepo.findOne({ where: { key } });
    if (existing) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'sites.keyConflict');
    }

    const defaultSettings: SiteSettings = {
      branding: {
        displayName: dto.name,
        description: '',
        primaryColor: '#0f172a',
        secondaryColor: '#334155',
        accentColor: '#0284c7',
        themePreference: 'system',
      },
      seo: {
        titleTemplate: `%s | ${dto.name}`,
        defaultDescription: '',
        robotsPolicy: 'all',
        sitemapEnabled: true,
      },
      navigation: [],
      locales: {
        defaultLocale: dto.defaultLocale,
        supportedLocales: [dto.defaultLocale],
        fallbackLocale: dto.defaultLocale,
      },
      ...dto.settings,
    };

    const site = siteRepo.create({
      key,
      name: dto.name.trim(),
      defaultLocale: dto.defaultLocale,
      timezone: dto.timezone ?? 'UTC',
      status: dto.status ?? 'active',
      settings: defaultSettings,
      createdBy: authContext.user.id,
    });

    const saved = await siteRepo.save(site);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId: saved.id,
      action: 'site.create',
      entityType: 'site',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { key: saved.key, name: saved.name },
    });

    return this.toSiteItem(saved);
  }

  /**
   * Retrieves a site by ID.
   */
  async getSiteById(siteId: string): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: { id: siteId },
      relations: { domains: true },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    return this.toSiteItem(site);
  }

  /**
   * Updates basic site metadata or status.
   */
  async updateSite(
    authContext: EffectiveAuthContext,
    siteId: string,
    dto: UpdateSiteDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: { id: siteId },
      relations: { domains: true },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    if (dto.name !== undefined) {
      site.name = dto.name.trim();
    }
    if (dto.defaultLocale !== undefined) {
      site.defaultLocale = dto.defaultLocale.trim();
    }
    if (dto.timezone !== undefined) {
      site.timezone = dto.timezone.trim();
    }
    if (dto.status !== undefined) {
      site.status = dto.status;
    }
    if (dto.settings !== undefined) {
      site.settings = { ...site.settings, ...dto.settings };
    }

    const saved = await siteRepo.save(site);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId: saved.id,
      action: 'site.update',
      entityType: 'site',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { status: saved.status, name: saved.name },
    });

    return this.toSiteItem(saved);
  }

  /**
   * Deletes or archives a site.
   * Active sites must be archived first. Sites with content publications cannot be deleted.
   */
  async archiveOrDeleteSite(
    authContext: EffectiveAuthContext,
    siteId: string,
    reqInfo?: RequestInfo,
  ): Promise<void> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({ where: { id: siteId } });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    if (site.status === 'active') {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'sites.cannotDeleteActive',
      );
    }

    // Check for publications
    const pubRepo = await this.getPublicationRepo();
    const contentCount = await pubRepo.count({ where: { siteId } });
    if (contentCount > 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'sites.cannotDeleteWithContent',
      );
    }

    // Delete associated domains and site in transaction
    await this.dataSource.transaction(async (manager) => {
      const domainRepo = manager.getRepository(SiteDomain);
      await domainRepo.delete({ siteId });
      const localSiteRepo = manager.getRepository(Site);
      await localSiteRepo.delete({ id: siteId });
    });

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId: null,
      action: 'site.delete',
      entityType: 'site',
      entityId: siteId,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { deletedSiteKey: site.key },
    });
  }

  /**
   * Legacy / generic settings updater.
   */
  async updateSiteSettings(
    siteId: string,
    dto: UpdateSiteSettingsDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: { id: siteId },
      relations: { domains: true },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    site.settings = { ...site.settings, ...dto.settings };
    const saved = await siteRepo.save(site);

    const actorId = reqInfo?.actorId ?? null;
    await this.auditService.record({
      actorId,
      actorType: actorId ? 'user' : 'system',
      siteId: saved.id,
      action: 'site.update_settings',
      entityType: 'site',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
    });

    return this.toSiteItem(saved);
  }

  /**
   * Updates site branding without CSS injection risks.
   */
  async updateBranding(
    authContext: EffectiveAuthContext,
    siteId: string,
    dto: UpdateBrandingDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: { id: siteId },
      relations: { domains: true },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    const currentSettings = (site.settings ?? {}) as SiteSettings;
    const currentBranding = currentSettings.branding ?? {};

    const updatedBranding = {
      ...currentBranding,
      ...(dto.displayName !== undefined ? { displayName: dto.displayName.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      ...(dto.primaryColor !== undefined ? { primaryColor: dto.primaryColor } : {}),
      ...(dto.secondaryColor !== undefined ? { secondaryColor: dto.secondaryColor } : {}),
      ...(dto.accentColor !== undefined ? { accentColor: dto.accentColor } : {}),
      ...(dto.themePreference !== undefined ? { themePreference: dto.themePreference } : {}),
      ...(dto.logoMediaId !== undefined ? { logoMediaId: dto.logoMediaId } : {}),
      ...(dto.faviconMediaId !== undefined ? { faviconMediaId: dto.faviconMediaId } : {}),
    };

    site.settings = {
      ...currentSettings,
      branding: updatedBranding,
    };

    const saved = await siteRepo.save(site);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId: saved.id,
      action: 'site.update_branding',
      entityType: 'site',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { branding: updatedBranding },
    });

    return this.toSiteItem(saved);
  }

  /**
   * Replaces the owner-written About page content. Text is normalized (trimmed,
   * bounded, blank pillars dropped) and stored as plain text only.
   */
  async updateAbout(
    authContext: EffectiveAuthContext,
    siteId: string,
    dto: UpdateAboutDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: { id: siteId },
      relations: { domains: true },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    const about = normalizeSiteAbout(dto);
    site.settings = { ...((site.settings ?? {}) as SiteSettings), about };

    const saved = await siteRepo.save(site);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId: saved.id,
      action: 'site.update_about',
      entityType: 'site',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { pillars: about.pillars.length, showWriters: about.showWriters },
    });

    return this.toSiteItem(saved);
  }

  /**
   * Updates site navigation items with cycle detection and scheme protection.
   */
  async updateNavigation(
    authContext: EffectiveAuthContext,
    siteId: string,
    dto: UpdateNavigationDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: { id: siteId },
      relations: { domains: true },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    validateNavigationItems(dto.items);

    const currentSettings = (site.settings ?? {}) as SiteSettings;
    site.settings = {
      ...currentSettings,
      navigation: dto.items,
    };

    const saved = await siteRepo.save(site);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId: saved.id,
      action: 'site.update_navigation',
      entityType: 'site',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { itemCount: dto.items.length },
    });

    return this.toSiteItem(saved);
  }

  /**
   * Updates site SEO configuration.
   */
  async updateSeo(
    authContext: EffectiveAuthContext,
    siteId: string,
    dto: UpdateSeoDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: { id: siteId },
      relations: { domains: true },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    if (dto.canonicalHost) {
      const hostRes = normalizeHostname(dto.canonicalHost);
      if (!hostRes.isValid) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          'VALIDATION_ERROR',
          'domains.invalidHostname',
        );
      }
      dto.canonicalHost = hostRes.normalized;
    }

    const currentSettings = (site.settings ?? {}) as SiteSettings;
    const currentSeo = currentSettings.seo ?? {};

    const updatedSeo = {
      ...currentSeo,
      ...(dto.titleTemplate !== undefined ? { titleTemplate: dto.titleTemplate } : {}),
      ...(dto.defaultDescription !== undefined
        ? { defaultDescription: dto.defaultDescription }
        : {}),
      ...(dto.robotsPolicy !== undefined ? { robotsPolicy: dto.robotsPolicy } : {}),
      ...(dto.sitemapEnabled !== undefined ? { sitemapEnabled: dto.sitemapEnabled } : {}),
      ...(dto.canonicalHost !== undefined ? { canonicalHost: dto.canonicalHost } : {}),
    };

    site.settings = {
      ...currentSettings,
      seo: updatedSeo,
    };

    const saved = await siteRepo.save(site);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId: saved.id,
      action: 'site.update_seo',
      entityType: 'site',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { seo: updatedSeo },
    });

    return this.toSiteItem(saved);
  }

  /**
   * Updates site locale configuration.
   */
  async updateLocales(
    authContext: EffectiveAuthContext,
    siteId: string,
    dto: UpdateLocalesDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteItem> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: { id: siteId },
      relations: { domains: true },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    site.defaultLocale = dto.defaultLocale;

    const currentSettings = (site.settings ?? {}) as SiteSettings;
    site.settings = {
      ...currentSettings,
      locales: {
        defaultLocale: dto.defaultLocale,
        supportedLocales: dto.supportedLocales,
        fallbackLocale: dto.fallbackLocale ?? dto.defaultLocale,
      },
    };

    const saved = await siteRepo.save(site);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId: saved.id,
      action: 'site.update_locales',
      entityType: 'site',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { defaultLocale: dto.defaultLocale, supportedLocales: dto.supportedLocales },
    });

    return this.toSiteItem(saved);
  }

  /**
   * Lists domains associated with a site.
   */
  async listDomains(authContext: EffectiveAuthContext, siteId: string): Promise<SiteDomainItem[]> {
    const domainRepo = await this.getDomainRepo();
    const domains = await domainRepo.find({
      where: { siteId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    return domains.map((d) => this.toSiteDomainItem(d));
  }

  /**
   * Adds a domain to a site with normalization, uniqueness verification, and challenge token.
   */
  async addDomain(
    authContext: EffectiveAuthContext,
    siteId: string,
    dto: CreateDomainDto,
    reqInfo?: RequestInfo,
  ): Promise<{ domain: SiteDomainItem; challenge: VerificationChallengeDto }> {
    const hostRes = normalizeHostname(dto.hostname);
    if (!hostRes.isValid) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'domains.invalidHostname');
    }
    const normalized = hostRes.normalized;

    const domainRepo = await this.getDomainRepo();
    const conflict = await domainRepo.findOne({ where: { hostname: normalized } });
    if (conflict) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'domains.conflict');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const createdDomain = await this.dataSource.transaction(async (manager) => {
      const localDomainRepo = manager.getRepository(SiteDomain);

      if (dto.isPrimary) {
        // Demote existing primary domain atomically
        await localDomainRepo.update({ siteId, isPrimary: true }, { isPrimary: false });
      }

      const domain = localDomainRepo.create({
        siteId,
        hostname: normalized,
        isPrimary: dto.isPrimary ?? false,
        status: 'active',
        verifiedAt: null,
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt,
      });

      return localDomainRepo.save(domain);
    });

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId,
      action: 'domain.create',
      entityType: 'site_domain',
      entityId: createdDomain.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { hostname: normalized, isPrimary: createdDomain.isPrimary },
    });

    const domainItem = this.toSiteDomainItem(createdDomain);
    const challenge: VerificationChallengeDto = {
      domainId: createdDomain.id,
      hostname: normalized,
      verificationToken: token,
      recordType: 'TXT',
      recordName: `_cms-challenge.${normalized}`,
      recordValue: `cms-verify=${token}`,
      expiresAt: expiresAt.toISOString(),
      isVerified: false,
    };

    return { domain: domainItem, challenge };
  }

  /**
   * Updates an existing domain (e.g. promoting to primary or toggling status).
   */
  async updateDomain(
    authContext: EffectiveAuthContext,
    siteId: string,
    domainId: string,
    dto: UpdateDomainDto,
    reqInfo?: RequestInfo,
  ): Promise<SiteDomainItem> {
    const domainRepo = await this.getDomainRepo();
    const domain = await domainRepo.findOne({ where: { id: domainId, siteId } });

    if (!domain) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'domains.notFound');
    }

    if (dto.isPrimary === false && domain.isPrimary) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'domains.cannotRemovePrimary',
      );
    }

    const updated = await this.dataSource.transaction(async (manager) => {
      const localDomainRepo = manager.getRepository(SiteDomain);

      if (dto.isPrimary === true && !domain.isPrimary) {
        // Demote current primary
        await localDomainRepo.update({ siteId, isPrimary: true }, { isPrimary: false });
        domain.isPrimary = true;
      }

      if (dto.status !== undefined) {
        domain.status = dto.status;
      }

      return localDomainRepo.save(domain);
    });

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId,
      action: 'domain.update',
      entityType: 'site_domain',
      entityId: updated.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: {
        hostname: updated.hostname,
        isPrimary: updated.isPrimary,
        status: updated.status,
      },
    });

    return this.toSiteDomainItem(updated);
  }

  /**
   * Removes a domain from a site.
   */
  async removeDomain(
    authContext: EffectiveAuthContext,
    siteId: string,
    domainId: string,
    reqInfo?: RequestInfo,
  ): Promise<void> {
    const domainRepo = await this.getDomainRepo();
    const domain = await domainRepo.findOne({ where: { id: domainId, siteId } });

    if (!domain) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'domains.notFound');
    }

    if (domain.isPrimary) {
      const otherDomainsCount = await domainRepo.count({ where: { siteId } });
      if (otherDomainsCount > 1) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          'VALIDATION_ERROR',
          'domains.cannotRemovePrimary',
        );
      }
    }

    await domainRepo.remove(domain);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId,
      action: 'domain.delete',
      entityType: 'site_domain',
      entityId: domainId,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: { hostname: domain.hostname },
    });
  }

  /**
   * Retrieves the DNS TXT challenge instructions for a domain.
   */
  async getVerificationChallenge(
    authContext: EffectiveAuthContext,
    siteId: string,
    domainId: string,
  ): Promise<VerificationChallengeDto> {
    const domainRepo = await this.getDomainRepo();
    const domain = await domainRepo.findOne({ where: { id: domainId, siteId } });

    if (!domain) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'domains.notFound');
    }

    let token = domain.verificationToken;
    let expiresAt = domain.verificationTokenExpiresAt;

    if (!token || !expiresAt || expiresAt < new Date()) {
      token = randomBytes(32).toString('hex');
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      domain.verificationToken = token;
      domain.verificationTokenExpiresAt = expiresAt;
      await domainRepo.save(domain);
    }

    return {
      domainId: domain.id,
      hostname: domain.hostname,
      verificationToken: token,
      recordType: 'TXT',
      recordName: `_cms-challenge.${domain.hostname}`,
      recordValue: `cms-verify=${token}`,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      isVerified: domain.verifiedAt !== null,
    };
  }

  /**
   * Explicit domain verification operation with audit logging.
   */
  async verifyDomain(
    authContext: EffectiveAuthContext,
    siteId: string,
    domainId: string,
    reqInfo?: RequestInfo,
  ): Promise<SiteDomainItem> {
    const domainRepo = await this.getDomainRepo();
    const domain = await domainRepo.findOne({ where: { id: domainId, siteId } });

    if (!domain) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'domains.notFound');
    }

    if (domain.verifiedAt) {
      return this.toSiteDomainItem(domain);
    }

    domain.verifiedAt = new Date();
    const saved = await domainRepo.save(domain);

    await this.auditService.record({
      actorId: authContext.user.id,
      actorType: 'user',
      siteId,
      action: 'domain.verify',
      entityType: 'site_domain',
      entityId: saved.id,
      requestId: reqInfo?.requestId,
      ipAddress: reqInfo?.ipAddress,
      metadata: {
        hostname: saved.hostname,
        verifiedAt: saved.verifiedAt ? saved.verifiedAt.toISOString() : new Date().toISOString(),
      },
    });

    return this.toSiteDomainItem(saved);
  }

  private toSiteItem(site: Site): SiteItem {
    return {
      id: site.id,
      key: site.key,
      name: site.name,
      defaultLocale: site.defaultLocale,
      timezone: site.timezone,
      status: site.status as SiteStatus,
      settings: (site.settings ?? {}) as SiteSettings,
      domains: (site.domains ?? []).map((d) => this.toSiteDomainItem(d)),
      createdAt: site.createdAt ? site.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: site.updatedAt ? site.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  private toSiteDomainItem(d: SiteDomain): SiteDomainItem {
    return {
      id: d.id,
      siteId: d.siteId,
      hostname: d.hostname,
      status: d.status,
      isPrimary: d.isPrimary,
      verifiedAt: d.verifiedAt ? d.verifiedAt.toISOString() : null,
      verificationToken: d.verificationToken,
      verificationTokenExpiresAt: d.verificationTokenExpiresAt
        ? d.verificationTokenExpiresAt.toISOString()
        : null,
      createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: d.updatedAt ? d.updatedAt.toISOString() : new Date().toISOString(),
    };
  }
}
