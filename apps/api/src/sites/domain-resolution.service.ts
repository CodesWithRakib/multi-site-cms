import { Inject, Injectable } from '@nestjs/common';
import { normalizeHostname } from '@multi-site-cms/validation';
import { DataSource, IsNull, Not, Repository } from 'typeorm';

import { DATA_SOURCE } from '../database/database.tokens';
import { SiteDomain } from '../database/entities/site-domain.entity';
import { Site } from '../database/entities/site.entity';
import { getInitializedRepository } from '../database/ensure-connected';

export interface ResolvedDomain {
  site: Site;
  domain: SiteDomain;
}

@Injectable()
export class DomainResolutionService {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  private async getDomainRepo(): Promise<Repository<SiteDomain>> {
    return getInitializedRepository(this.dataSource, SiteDomain);
  }

  /**
   * Resolves an incoming hostname to an active Site and verified SiteDomain.
   * Hostname is normalized before database query.
   * Returns null if hostname is malformed, not registered, not verified,
   * disabled, or if the associated site is not active.
   */
  async resolveSiteByHostname(rawHostname: string): Promise<ResolvedDomain | null> {
    const result = normalizeHostname(rawHostname);
    if (!result.isValid) {
      return null;
    }

    const domainRepo = await this.getDomainRepo();
    const domainRecord = await domainRepo.findOne({
      where: {
        hostname: result.normalized,
        status: 'active',
        verifiedAt: Not(IsNull()),
      },
      relations: {
        site: true,
      },
    });

    if (!domainRecord || !domainRecord.site) {
      return null;
    }

    // Inactive sites (paused, archived, suspended) do not serve public content
    if (domainRecord.site.status !== 'active') {
      return null;
    }

    return {
      site: domainRecord.site,
      domain: domainRecord,
    };
  }
}
