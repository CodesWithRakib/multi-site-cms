import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../../config/env';
import { CloudinaryStorageProvider } from '../../media/storage/cloudinary-storage.provider';
import { LocalStorageProvider } from '../../media/storage/local-storage.provider';
import { buildDataSourceOptions } from '../database-options';
import { PRODUCTION_SITES } from '../seeds/production/bangladesh-content';
import { seedProductionContent } from '../seeds/production/seed-production-content';

/**
 * Operator command: launch sites, verified primary domains (from
 * SITE_REVALIDATE_URLS), taxonomy, and editorial articles with illustrated
 * covers uploaded to the configured storage. Idempotent; requires --confirm
 * and an existing active Super Admin as the author (SEED_AUTHOR_EMAIL, else
 * the first active Super Admin).
 *
 *   node --env-file=.env.prod dist/database/cli/seed-production-content.js --confirm
 */
async function main(): Promise<void> {
  if (!process.argv.includes('--confirm')) {
    console.error(
      'Refusing to run without --confirm (this writes content to the configured database).',
    );
    process.exit(1);
  }
  if (env.NODE_ENV === 'production' && env.STORAGE_PROVIDER !== 'cloudinary') {
    throw new Error(
      'Production content must be stored in Cloudinary (STORAGE_PROVIDER=cloudinary).',
    );
  }

  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();
  try {
    const email = process.env.SEED_AUTHOR_EMAIL?.trim().toLowerCase() || null;
    const authors = (await dataSource.query(
      `SELECT u."id" FROM "users" u
         JOIN "user_role_assignments" ura ON ura."user_id" = u."id"
         JOIN "roles" r ON r."id" = ura."role_id"
        WHERE r."key" = 'super_admin' AND u."status" = 'active'
          AND ($1::text IS NULL OR u."email" = $1)
        ORDER BY u."created_at" ASC LIMIT 1`,
      [email],
    )) as Array<{ id: string }>;
    const author = authors[0];
    if (!author) {
      throw new Error('No active Super Admin found. Run bootstrap:super-admin first.');
    }

    const storage =
      env.STORAGE_PROVIDER === 'cloudinary'
        ? new CloudinaryStorageProvider()
        : new LocalStorageProvider();
    const report = await seedProductionContent(dataSource, {
      sites: PRODUCTION_SITES,
      siteUrls: env.SITE_REVALIDATE_URLS,
      authorId: author.id,
      storage,
    });

    console.log(`[SEED] Sites created: ${report.sitesCreated.join(', ') || 'none'}`);
    console.log(`[SEED] Domains added: ${report.domainsAdded.join(', ') || 'none'}`);
    console.log(`[SEED] Articles created: ${report.articlesCreated.length}`);
    console.log(`[SEED] Articles already present: ${report.articlesSkipped.length}`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(`[SEED ERROR] ${err instanceof Error ? err.message : 'Unknown error'}`);
  process.exit(1);
});
