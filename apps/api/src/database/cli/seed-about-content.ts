import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';
import { seedAboutContent } from '../seeds/about-content';

/**
 * Operator command: give each site a starting About page so the public page is
 * not empty. Idempotent: a site whose owner already wrote an About page is left
 * alone. Requires --confirm; --force overwrites existing About content.
 *
 *   node --env-file=.env dist/database/cli/seed-about-content.js --confirm
 */
async function main(): Promise<void> {
  if (!process.argv.includes('--confirm')) {
    console.error(
      'Refusing to run without --confirm (this writes site settings to the configured database).',
    );
    process.exit(1);
  }

  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();
  try {
    const report = await dataSource.transaction((manager) =>
      seedAboutContent(manager, { force: process.argv.includes('--force') }),
    );
    console.log(`[ABOUT] Seeded: ${report.seeded.join(', ') || 'none'}`);
    console.log(`[ABOUT] Kept owner content: ${report.skipped.join(', ') || 'none'}`);
    if (report.missing.length > 0) {
      console.log(`[ABOUT] Site not found (skipped): ${report.missing.join(', ')}`);
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
