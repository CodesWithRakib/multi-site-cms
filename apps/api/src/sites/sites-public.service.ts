import { Inject, Injectable } from '@nestjs/common';
import type {
  PublicNavigationItem,
  PublicSiteConfig,
  RobotsPolicy,
  SiteBranding,
  SiteSeo,
  SiteSettings,
} from '@multi-site-cms/types';
import { type DataSource, type Repository } from 'typeorm';

import { DATA_SOURCE } from '../database/database.tokens';
import { SiteDomain } from '../database/entities/site-domain.entity';
import { Site } from '../database/entities/site.entity';
import { getInitializedRepository } from '../database/ensure-connected';
import { DomainResolutionService } from './domain-resolution.service';

@Injectable()
export class SitesPublicService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly domainResolutionService: DomainResolutionService,
  ) {}

  private async getSiteRepo(): Promise<Repository<Site>> {
    return getInitializedRepository(this.dataSource, Site);
  }

  private async getDomainRepo(): Promise<Repository<SiteDomain>> {
    return getInitializedRepository(this.dataSource, SiteDomain);
  }

  /**
   * Resolves a public site configuration by incoming hostname.
   * Only active sites with verified domains are returned.
   */
  async getPublicConfigByHostname(rawHostname: string): Promise<PublicSiteConfig | null> {
    const resolved = await this.domainResolutionService.resolveSiteByHostname(rawHostname);
    if (!resolved) {
      return null;
    }

    return this.toPublicConfig(resolved.site, resolved.domain.hostname);
  }

  /**
   * Resolves a public site configuration by site key.
   * Only active sites are returned.
   */
  async getPublicConfigByKey(siteKey: string): Promise<PublicSiteConfig | null> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({
      where: {
        key: siteKey.toLowerCase().trim(),
        status: 'active',
      },
    });

    if (!site) {
      return null;
    }

    // Attempt to find primary domain for canonical host fallback
    const domainRepo = await this.getDomainRepo();
    const primaryDomain = await domainRepo.findOne({
      where: {
        siteId: site.id,
        isPrimary: true,
        status: 'active',
      },
    });

    return this.toPublicConfig(site, primaryDomain?.hostname);
  }

  /**
   * Converts a Site database entity to a public-safe PublicSiteConfig DTO.
   * Strictly omits sensitive metadata, verification tokens, internal flags, and private settings.
   */
  private toPublicConfig(site: Site, primaryHostname?: string): PublicSiteConfig {
    const settings = (site.settings ?? {}) as SiteSettings;
    const branding: Partial<SiteBranding> = settings.branding ?? {};
    const seo: Partial<SiteSeo> = settings.seo ?? {};
    const rawNavItems = Array.isArray(settings.navigation) ? settings.navigation : [];
    const locales = settings.locales ?? {
      defaultLocale: site.defaultLocale,
      supportedLocales: [site.defaultLocale],
      fallbackLocale: site.defaultLocale,
    };

    // Filter navigation to only public items; strictly remove hidden or authenticated-only
    const publicNav: PublicNavigationItem[] = rawNavItems
      .filter((item) => !item.visibility || item.visibility === 'public')
      .map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url,
        parentId: item.parentId ?? null,
        order: item.order ?? 0,
      }));

    return {
      key: site.key,
      name: site.name,
      defaultLocale: site.defaultLocale,
      supportedLocales: locales.supportedLocales?.length
        ? locales.supportedLocales
        : [site.defaultLocale],
      timezone: site.timezone,
      primaryDomain: primaryHostname ?? null,
      branding: {
        displayName: branding.displayName || site.name,
        description: branding.description || '',
        primaryColor: branding.primaryColor || '#0f172a',
        secondaryColor: branding.secondaryColor || '#334155',
        accentColor: branding.accentColor || '#0284c7',
        themePreference: branding.themePreference || 'system',
        logoMediaId: branding.logoMediaId ?? null,
        faviconMediaId: branding.faviconMediaId ?? null,
      },
      seo: {
        titleTemplate: seo.titleTemplate || `%s | ${site.name}`,
        defaultDescription: seo.defaultDescription || '',
        robotsPolicy: (seo.robotsPolicy as RobotsPolicy) || 'all',
        sitemapEnabled: seo.sitemapEnabled ?? true,
        canonicalHost: seo.canonicalHost || primaryHostname || undefined,
      },
      navigation: publicNav,
    };
  }
}
