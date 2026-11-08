import type { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

/**
 * In-flight initialization per DataSource. TypeORM's `initialize()` throws
 * `CannotConnectAlreadyConnectedError` when called while a previous call is still
 * connecting, and it flips `isInitialized` to true before entity metadata is built.
 * Concurrent first requests (a cold start) must therefore share one promise.
 */
const pendingInitializations = new WeakMap<DataSource, Promise<void>>();

/**
 * Ensures the lazy `DataSource` is fully initialized, safely under concurrency.
 *
 * Implements ADR-0015: Connection pool is opened lazily on first query rather than
 * at application bootstrap, preserving non-blocking liveness and offline CI checks.
 * A failed attempt is forgotten so the next call retries.
 */
export function ensureInitialized(dataSource: DataSource): Promise<void> {
  const pending = pendingInitializations.get(dataSource);
  if (pending) {
    return pending;
  }
  if (dataSource.isInitialized) {
    return Promise.resolve();
  }

  const initialization = dataSource
    .initialize()
    .then(() => undefined)
    .finally(() => {
      pendingInitializations.delete(dataSource);
    });
  pendingInitializations.set(dataSource, initialization);
  return initialization;
}

/** Ensures the lazy `DataSource` is initialized before retrieving a repository. */
export async function getInitializedRepository<T extends ObjectLiteral>(
  dataSource: DataSource,
  target: EntityTarget<T>,
): Promise<Repository<T>> {
  await ensureInitialized(dataSource);
  return dataSource.getRepository(target);
}
