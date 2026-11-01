import type { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

/**
 * Ensures the lazy `DataSource` is initialized before retrieving a repository.
 *
 * Implements ADR-0015: Connection pool is opened lazily on first query rather than
 * at application bootstrap, preserving non-blocking liveness and offline CI checks.
 */
export async function getInitializedRepository<T extends ObjectLiteral>(
  dataSource: DataSource,
  target: EntityTarget<T>,
): Promise<Repository<T>> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource.getRepository(target);
}
