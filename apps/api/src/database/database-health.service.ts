import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ReadinessCheck } from '@multi-site-cms/types';
import type { DataSource } from 'typeorm';

import { DATA_SOURCE } from './database.tokens';
import { ensureInitialized } from './ensure-connected';

/** Readiness must answer quickly; a slow probe is a failed probe. */
const CHECK_TIMEOUT_MS = 2_000;

/**
 * Lightweight database probe for readiness.
 *
 * It opens the pool lazily and runs `SELECT 1` — no table access, no business
 * query, no statistics gathering.
 *
 * Failures are logged without the exception object: a driver error can include the
 * host, port, and database name, which must not reach logs or clients.
 */
@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async check(): Promise<ReadinessCheck> {
    const startedAt = Date.now();

    try {
      await this.withTimeout(ensureInitialized(this.dataSource));

      await this.withTimeout(this.dataSource.query('SELECT 1'));

      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch {
      this.logger.warn('Database readiness check failed');
      this.disposeBrokenPool();

      return { status: 'down', latencyMs: Date.now() - startedAt };
    }
  }

  private async withTimeout<T>(operation: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('database.check.timeout')), CHECK_TIMEOUT_MS);
      timer.unref?.();
    });

    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  /**
   * A failed initialization can leave an initializer attached to a dead pool. Drop
   * it so the next probe starts clean instead of queueing behind a broken attempt.
   */
  private disposeBrokenPool(): void {
    if (!this.dataSource.isInitialized) {
      void this.dataSource.destroy().catch(() => undefined);
    }
  }
}
