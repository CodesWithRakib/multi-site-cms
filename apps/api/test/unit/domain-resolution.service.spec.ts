import { describe, expect, it, jest } from '@jest/globals';
import type { DataSource } from 'typeorm';

import { DomainResolutionService } from '../../src/sites/domain-resolution.service';
import type { SiteDomain } from '../../src/database/entities/site-domain.entity';
import type { Site } from '../../src/database/entities/site.entity';

describe('DomainResolutionService', () => {
  const mockDomainRepo = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    isInitialized: true,
    getRepository: jest.fn().mockReturnValue(mockDomainRepo),
  } as unknown as DataSource;

  const service = new DomainResolutionService(mockDataSource);

  it('returns null if raw hostname is malformed or invalid', async () => {
    const result = await service.resolveSiteByHostname('bad..hostname');
    expect(result).toBeNull();
  });

  it('normalizes hostname and returns site and domain when active and verified', async () => {
    const mockSite = { id: 'site-1', key: 'travel-blog', status: 'active' } as Site;
    const mockDomain = {
      id: 'dom-1',
      hostname: 'example.com',
      status: 'active',
      verifiedAt: new Date(),
      site: mockSite,
    } as SiteDomain;

    (mockDomainRepo.findOne as jest.Mock).mockResolvedValueOnce(mockDomain as never);

    const result = await service.resolveSiteByHostname('EXAMPLE.COM:8080');
    expect(result).not.toBeNull();
    expect(result?.site.id).toBe('site-1');
    expect(result?.domain.hostname).toBe('example.com');
  });

  it('returns null if domain is unverified or not found in repository', async () => {
    (mockDomainRepo.findOne as jest.Mock).mockResolvedValueOnce(null as never);

    const result = await service.resolveSiteByHostname('unregistered.com');
    expect(result).toBeNull();
  });

  it('returns null if site is inactive (e.g. paused, archived, suspended)', async () => {
    const mockSite = { id: 'site-2', key: 'archived-site', status: 'archived' } as Site;
    const mockDomain = {
      id: 'dom-2',
      hostname: 'archived.com',
      status: 'active',
      verifiedAt: new Date(),
      site: mockSite,
    } as SiteDomain;

    (mockDomainRepo.findOne as jest.Mock).mockResolvedValueOnce(mockDomain as never);

    const result = await service.resolveSiteByHostname('archived.com');
    expect(result).toBeNull();
  });
});
