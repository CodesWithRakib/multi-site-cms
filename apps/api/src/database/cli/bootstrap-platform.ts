import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';
import { ensurePlatformVocabulary, PERMISSIONS, ROLES } from '../platform-vocabulary';

/**
 * Production-safe platform bootstrap: upserts the permission vocabulary and
 * the built-in roles. Creates no users, sites, or content, so it may run on
 * every deploy (Render start command, after migrations). The first Super Admin
 * is created separately with `bootstrap:super-admin`.
 */
async function main(): Promise<void> {
  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();
  try {
    await ensurePlatformVocabulary(dataSource);
    console.log(
      `[BOOTSTRAP] Platform vocabulary ensured: ${PERMISSIONS.length} permissions, ${ROLES.length} roles.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(`[BOOTSTRAP ERROR] ${err instanceof Error ? err.message : 'Unknown error'}`);
  process.exit(1);
});
