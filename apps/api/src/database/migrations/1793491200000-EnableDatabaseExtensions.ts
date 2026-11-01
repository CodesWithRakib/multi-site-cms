import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ensures the extensions the schema depends on exist.
 *
 * `citext` provides case-insensitive email, hostname, slug and key comparison
 * without functional indexes, and `pg_trgm` is reserved for editorial search.
 * Local Docker enables both in `infrastructure/docker/init/01-extensions.sql`;
 * managed providers usually require this to be done once by an administrator.
 *
 * The down migration is intentionally a no-op: the extensions are environment
 * bootstrap, not schema state, and dropping them would break every table that is
 * reverted after this migration.
 */
export class EnableDatabaseExtensions1793491200000 implements MigrationInterface {
  name = 'EnableDatabaseExtensions1793491200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
  }

  async down(): Promise<void> {
    // Extensions are provisioned by the environment, not by the schema.
  }
}
