import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { DataSource } from 'typeorm';

import { removeGeneratedAnalytics } from '../../src/database/cli/remove-generated-analytics';
import { createTestDataSource, resetTestSchema } from './test-database';

/**
 * The cleanup must remove exactly the page views written in the same
 * transaction as a migration record, and never real traffic.
 */

const FIXTURE_MIGRATION = 'GeneratedAnalyticsFixture1700000000000';

let dataSource: DataSource;
let siteId: string;

async function countViews(): Promise<number> {
  const rows = (await dataSource.query(
    `SELECT COUNT(*)::int AS "count" FROM "analytics_page_views"`,
  )) as Array<{ count: number }>;
  return Number(rows[0]?.count ?? 0);
}

beforeAll(async () => {
  dataSource = await createTestDataSource();
  await resetTestSchema(dataSource);

  const sites = (await dataSource.query(
    `INSERT INTO "sites" ("key", "name") VALUES ('travel-blog', 'Travel') RETURNING "id"`,
  )) as Array<{ id: string }>;
  siteId = sites[0]?.id ?? '';

  // Real traffic recorded before the "migration" ran.
  await dataSource.query(
    `INSERT INTO "analytics_page_views" ("site_id", "path", "visitor_id") VALUES ($1, '/real-before', 'a')`,
    [siteId],
  );

  // What a migration does: its record and its generated rows in one transaction.
  await dataSource.transaction(async (manager) => {
    await manager.query(
      `INSERT INTO "typeorm_migrations" ("timestamp", "name") VALUES (1700000000000, $1)`,
      [FIXTURE_MIGRATION],
    );
    await manager.query(
      `INSERT INTO "analytics_page_views" ("site_id", "path", "visitor_id")
       SELECT $1, '/generated', md5(g::text) FROM generate_series(1, 12) AS g`,
      [siteId],
    );
  });

  // Real traffic recorded afterwards.
  await dataSource.query(
    `INSERT INTO "analytics_page_views" ("site_id", "path", "visitor_id") VALUES ($1, '/real-after', 'b')`,
    [siteId],
  );
}, 60_000);

afterAll(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy();
});

describe('removeGeneratedAnalytics', () => {
  it('reports nothing for a migration that was never applied', async () => {
    await expect(
      removeGeneratedAnalytics(dataSource, { apply: true, migrationName: 'NeverApplied1' }),
    ).resolves.toEqual({ migrationApplied: false, generatedRows: 0, deletedRows: 0 });
    expect(await countViews()).toBe(14);
  });

  it('counts without deleting in a dry run', async () => {
    await expect(
      removeGeneratedAnalytics(dataSource, { apply: false, migrationName: FIXTURE_MIGRATION }),
    ).resolves.toEqual({ migrationApplied: true, generatedRows: 12, deletedRows: 0 });
    expect(await countViews()).toBe(14);
  });

  it('deletes only the rows written with the migration record', async () => {
    await expect(
      removeGeneratedAnalytics(dataSource, { apply: true, migrationName: FIXTURE_MIGRATION }),
    ).resolves.toEqual({ migrationApplied: true, generatedRows: 12, deletedRows: 12 });

    const paths = (await dataSource.query(
      `SELECT "path" FROM "analytics_page_views" ORDER BY "path"`,
    )) as Array<{ path: string }>;
    expect(paths.map((row) => row.path)).toEqual(['/real-after', '/real-before']);
  });

  it('is a no-op when run again', async () => {
    await expect(
      removeGeneratedAnalytics(dataSource, { apply: true, migrationName: FIXTURE_MIGRATION }),
    ).resolves.toEqual({ migrationApplied: true, generatedRows: 0, deletedRows: 0 });
  });
});
