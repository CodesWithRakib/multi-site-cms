import { DataSource } from 'typeorm';

import { buildDataSourceOptions } from '../../src/database/database-options';

const DEFAULT_TEST_URL =
  'postgresql://multi_site_cms:multi_site_cms_dev@localhost:5432/multi_site_cms_test';

export function testDatabaseUrl(): string {
  return process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? DEFAULT_TEST_URL;
}

/**
 * Destructive helpers are only allowed against a database whose name ends in
 * `_test`. This is the guard that prevents a misconfigured `DATABASE_URL` from
 * wiping a development or production schema.
 */
export function assertTestDatabase(url: string): void {
  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, '');
  if (!database.endsWith('_test')) {
    throw new Error(
      `Refusing to run destructive integration tests against "${database}": the database name must end with "_test".`,
    );
  }
}

export async function createTestDataSource(): Promise<DataSource> {
  const url = testDatabaseUrl();
  assertTestDatabase(url);

  const dataSource = new DataSource(buildDataSourceOptions(url));
  await dataSource.initialize();
  return dataSource;
}

/**
 * Drops and recreates the `public` schema, then applies every migration.
 *
 * This validates the migration chain from an empty database on each run and keeps
 * extensions honest: dropping the schema also drops the extension objects, so the
 * extension migration is exercised rather than assumed.
 */
export async function resetTestSchema(dataSource: DataSource): Promise<void> {
  // The data source was created from this same URL, so re-validating it keeps the
  // destructive guard attached to one source of truth.
  assertTestDatabase(testDatabaseUrl());

  await dataSource.query('DROP SCHEMA IF EXISTS "public" CASCADE');
  await dataSource.query('CREATE SCHEMA "public"');
  await dataSource.runMigrations();
}
