import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { SiteSettings } from '@multi-site-cms/types';
import type { DataSource } from 'typeorm';

import { Site } from '../../src/database/entities/site.entity';
import { seedAboutContent } from '../../src/database/seeds/about-content';
import { createTestDataSource, resetTestSchema } from './test-database';

describe('seedAboutContent', () => {
  let dataSource: DataSource;

  async function settingsOf(key: string): Promise<SiteSettings> {
    const site = await dataSource.getRepository(Site).findOneByOrFail({ key });
    return site.settings as SiteSettings;
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    const sites = dataSource.getRepository(Site);
    await sites.save({
      key: 'travel-blog',
      name: 'Travel',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: { branding: { displayName: 'Keep me' } },
    });
    await sites.save({
      key: 'air-sports',
      name: 'Air',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('fills sites that have no About page and keeps their other settings', async () => {
    const report = await dataSource.transaction((manager) => seedAboutContent(manager));
    expect(report.seeded.sort()).toEqual(['air-sports', 'travel-blog']);

    const travel = await settingsOf('travel-blog');
    expect(travel.branding?.displayName).toBe('Keep me');
    expect(travel.about?.headline).toBeTruthy();
    expect(travel.about?.pillars?.length).toBeGreaterThan(0);
  });

  it('never overwrites what the owner wrote, unless forced', async () => {
    const sites = dataSource.getRepository(Site);
    const air = await sites.findOneByOrFail({ key: 'air-sports' });
    air.settings = { ...(air.settings as SiteSettings), about: { headline: 'Owner wrote this' } };
    await sites.save(air);

    const kept = await dataSource.transaction((manager) => seedAboutContent(manager));
    expect(kept.seeded).toEqual([]);
    expect((await settingsOf('air-sports')).about?.headline).toBe('Owner wrote this');

    const forced = await dataSource.transaction((manager) =>
      seedAboutContent(manager, { force: true }),
    );
    expect(forced.seeded).toContain('air-sports');
    expect((await settingsOf('air-sports')).about?.headline).not.toBe('Owner wrote this');
  });

  it('reports a missing site instead of failing', async () => {
    await dataSource.getRepository(Site).delete({ key: 'air-sports' });
    const report = await dataSource.transaction((manager) => seedAboutContent(manager));
    expect(report.missing).toEqual(['air-sports']);
  });
});
