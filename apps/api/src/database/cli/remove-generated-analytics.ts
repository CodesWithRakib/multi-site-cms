import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';

/**
 * Finds and (with `--apply`) deletes the page views that migration
 * `AnalyticsAndTrafficEvents1793491207000` used to fabricate.
 *
 * How the rows are identified: TypeORM applies pending migrations in one
 * transaction and records each in `typeorm_migrations` inside it. Every row
 * that migration inserted therefore carries the same `xmin` (inserting
 * transaction id) as its migration record. Page views are never updated, so
 * real traffic, which is always written later by the collector, can never
 * match. PostgreSQL keeps the original `xmin` visible after freezing.
 *
 * Dry run by default: prints counts only, never row contents.
 */

export const GENERATED_ANALYTICS_MIGRATION = 'AnalyticsAndTrafficEvents1793491207000';

export interface GeneratedAnalyticsReport {
  /** False when the migration was never applied to this database. */
  readonly migrationApplied: boolean;
  readonly generatedRows: number;
  readonly deletedRows: number;
}

const MATCH = `"xmin" = (SELECT "xmin" FROM "typeorm_migrations" WHERE "name" = $1)`;

export async function removeGeneratedAnalytics(
  dataSource: DataSource,
  options: { apply: boolean; migrationName?: string },
): Promise<GeneratedAnalyticsReport> {
  const migrationName = options.migrationName ?? GENERATED_ANALYTICS_MIGRATION;

  return dataSource.transaction(async (manager) => {
    const applied = (await manager.query(`SELECT 1 FROM "typeorm_migrations" WHERE "name" = $1`, [
      migrationName,
    ])) as unknown[];
    if (applied.length === 0) {
      return { migrationApplied: false, generatedRows: 0, deletedRows: 0 };
    }

    const [row] = (await manager.query(
      `SELECT COUNT(*)::int AS "count" FROM "analytics_page_views" WHERE ${MATCH}`,
      [migrationName],
    )) as Array<{ count: number }>;
    const generatedRows = Number(row?.count ?? 0);

    if (!options.apply || generatedRows === 0) {
      return { migrationApplied: true, generatedRows, deletedRows: 0 };
    }

    const result = (await manager.query(`DELETE FROM "analytics_page_views" WHERE ${MATCH}`, [
      migrationName,
    ])) as [unknown, number];
    return { migrationApplied: true, generatedRows, deletedRows: Number(result[1] ?? 0) };
  });
}

async function runCli(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();
  try {
    const report = await removeGeneratedAnalytics(dataSource, { apply });
    if (!report.migrationApplied) {
      console.log('Migration was never applied here; no generated analytics exist.');
    } else if (apply) {
      console.log(`Deleted ${report.deletedRows} generated page views.`);
    } else {
      console.log(
        `Dry run: ${report.generatedRows} generated page views found. Re-run with --apply to delete them (take a backup first).`,
      );
    }
  } finally {
    await dataSource.destroy();
  }
}

if (
  process.argv[1]?.endsWith('remove-generated-analytics.ts') ||
  process.argv[1]?.endsWith('remove-generated-analytics.js')
) {
  runCli().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  });
}
