import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';
import { ensurePlatformVocabulary } from '../platform-vocabulary';

/**
 * Development-only seed.
 *
 * It provisions the minimum data the platform needs to exist: permission
 * vocabulary, the two built-in roles, the two initial sites with their taxonomy,
 * and one air-sports event.
 *
 * It deliberately creates **no user account**. A Super Admin must never be seeded
 * with a default password, and no seed may promote an arbitrary account: that
 * bootstrap is a controlled, audited procedure documented in
 * `docs/database/README.md`. Seeds are idempotent and safe to re-run, and they
 * must never run against production data.
 */

interface SiteSeed {
  readonly key: string;
  readonly name: string;
  readonly locale: string;
  readonly timezone: string;
  readonly hostnames: readonly { hostname: string; isPrimary: boolean }[];
  readonly categories: readonly { slug: string; name: string }[];
  readonly tags: readonly string[];
}

const SITES: readonly SiteSeed[] = [
  {
    key: 'travel-blog',
    name: 'Travel Blog',
    locale: 'en',
    timezone: 'UTC',
    hostnames: [
      { hostname: 'travel.localhost', isPrimary: true },
      { hostname: 'www.travel.localhost', isPrimary: false },
    ],
    categories: [
      { slug: 'destinations', name: 'Destinations' },
      { slug: 'guides', name: 'Guides' },
      { slug: 'stories', name: 'Stories' },
    ],
    tags: ['city-break', 'hiking', 'food'],
  },
  {
    key: 'air-sports',
    name: 'Air Sports Live',
    locale: 'en',
    timezone: 'UTC',
    hostnames: [
      { hostname: 'airsports.localhost', isPrimary: true },
      { hostname: 'live.airsports.localhost', isPrimary: false },
    ],
    categories: [
      { slug: 'breaking', name: 'Breaking' },
      { slug: 'live-updates', name: 'Live updates' },
      { slug: 'results', name: 'Results' },
    ],
    tags: ['paragliding', 'skydiving', 'competition'],
  },
];

async function seedSites(dataSource: DataSource): Promise<void> {
  for (const site of SITES) {
    const siteRows: unknown[] = await dataSource.query(
      `INSERT INTO "sites" ("key", "name", "default_locale", "timezone", "status", "settings")
       VALUES ($1, $2, $3, $4, 'active', '{}'::jsonb)
       ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name"
       RETURNING "id"`,
      [site.key, site.name, site.locale, site.timezone],
    );
    const siteRow = siteRows[0] as { id: string } | undefined;
    if (!siteRow) {
      throw new Error(`Failed to upsert site ${site.key}.`);
    }

    for (const domain of site.hostnames) {
      await dataSource.query(
        `INSERT INTO "site_domains" ("site_id", "hostname", "is_primary", "status")
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT ("hostname") DO NOTHING`,
        [siteRow.id, domain.hostname, domain.isPrimary],
      );
    }

    for (const category of site.categories) {
      await dataSource.query(
        `INSERT INTO "categories" ("site_id", "slug", "name")
         VALUES ($1, $2, $3)
         ON CONFLICT ("site_id", "slug") DO NOTHING`,
        [siteRow.id, category.slug, category.name],
      );
    }

    for (const tag of site.tags) {
      await dataSource.query(
        `INSERT INTO "tags" ("site_id", "slug", "name")
         VALUES ($1, $2, $3)
         ON CONFLICT ("site_id", "slug") DO NOTHING`,
        [siteRow.id, tag, tag.replace(/-/g, ' ')],
      );
    }

    if (site.key === 'air-sports') {
      await dataSource.query(
        `INSERT INTO "events" ("site_id", "slug", "name", "status", "starts_at")
         VALUES ($1, $2, $3, 'scheduled', now() + interval '7 days')
         ON CONFLICT ("site_id", "slug") DO NOTHING`,
        [siteRow.id, 'season-opener', 'Season opener'],
      );
    }
  }
}

export async function seedDevelopmentData(dataSource: DataSource): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the development seed with NODE_ENV=production.');
  }

  await ensurePlatformVocabulary(dataSource);
  await seedSites(dataSource);
}

async function main(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database.');
  }

  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();

  try {
    await seedDevelopmentData(dataSource);
    console.log('Development seed complete: permissions, roles, sites, taxonomy, event.');
    console.log('No user account was created. See docs/database/README.md for bootstrap.');
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
