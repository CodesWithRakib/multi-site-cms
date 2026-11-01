import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type DataSource, type Repository } from 'typeorm';

import { ApiException } from '../common/exceptions/api.exception';
import { getInitializedRepository } from '../database/ensure-connected';
import { DATA_SOURCE } from '../database/database.tokens';
import { Site } from '../database/entities/site.entity';
import { type UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

export interface SiteSummaryDto {
  id: string;
  key: string;
  name: string;
  defaultLocale: string;
  timezone: string;
  status: string;
  settings: Record<string, unknown>;
}

@Injectable()
export class SitesAdminService {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  private async getSiteRepo(): Promise<Repository<Site>> {
    return getInitializedRepository(this.dataSource, Site);
  }

  async getSiteById(siteId: string): Promise<SiteSummaryDto> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({ where: { id: siteId } });
    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'http.notFound');
    }

    return {
      id: site.id,
      key: site.key,
      name: site.name,
      defaultLocale: site.defaultLocale,
      timezone: site.timezone,
      status: site.status,
      settings: site.settings,
    };
  }

  async updateSiteSettings(siteId: string, dto: UpdateSiteSettingsDto): Promise<SiteSummaryDto> {
    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({ where: { id: siteId } });
    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'http.notFound');
    }

    site.settings = { ...site.settings, ...dto.settings };
    await siteRepo.save(site);

    return {
      id: site.id,
      key: site.key,
      name: site.name,
      defaultLocale: site.defaultLocale,
      timezone: site.timezone,
      status: site.status,
      settings: site.settings,
    };
  }
}
