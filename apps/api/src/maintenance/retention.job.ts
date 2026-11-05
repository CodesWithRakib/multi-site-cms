import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import type { DataSource, QueryRunner } from 'typeorm';

import { AuditService } from '../common/audit/audit.service';
import { env } from '../config/env';
import { DATA_SOURCE } from '../database/database.tokens';
import { SAFE_DEFAULT_POLICY } from '../settings/platform-policy';
import { SettingsService } from '../settings/settings.service';

/** Retention windows in days; defaults come from the environment. */
export interface RetentionWindows {
  readonly analyticsDays: number;
  readonly auditDays: number;
  readonly sessionDays: number;
  readonly outboxDays: number;
}

export type RetentionTarget = 'analytics' | 'audit' | 'sessions' | 'outbox';

export type RetentionResult =
  | { readonly status: 'skipped'; readonly reason: 'locked' | 'database_unavailable' }
  | { readonly status: 'completed'; readonly deleted: Readonly<Record<RetentionTarget, number>> };

interface PurgePolicy {
  readonly target: RetentionTarget;
  readonly days: (windows: RetentionWindows) => number;
  /** Deletes at most `$2` rows older than `$1` and returns the deleted ids. */
  readonly sql: string;
}

/**
 * Bounded batches keep each statement short, so row locks and WAL bursts stay
 * small even when a large backlog is purged for the first time.
 */
const POLICIES: readonly PurgePolicy[] = [
  {
    target: 'analytics',
    days: (w) => w.analyticsDays,
    sql: `DELETE FROM "analytics_page_views" WHERE "id" IN (
            SELECT "id" FROM "analytics_page_views" WHERE "created_at" < $1 LIMIT $2
          ) RETURNING "id"`,
  },
  {
    // Ids grow with time, so ordering by the primary key reads the oldest first.
    target: 'audit',
    days: (w) => w.auditDays,
    sql: `DELETE FROM "audit_events" WHERE "id" IN (
            SELECT "id" FROM "audit_events" WHERE "created_at" < $1 ORDER BY "id" LIMIT $2
          ) RETURNING "id"`,
  },
  {
    // Only sessions that can no longer authenticate: expired or revoked.
    target: 'sessions',
    days: (w) => w.sessionDays,
    sql: `DELETE FROM "sessions" WHERE "id" IN (
            SELECT "id" FROM "sessions" WHERE "expires_at" < $1 OR "revoked_at" < $1 LIMIT $2
          ) RETURNING "id"`,
  },
  {
    // Finished deliveries only; pending, processing and failed events stay.
    target: 'outbox',
    days: (w) => w.outboxDays,
    sql: `DELETE FROM "outbox_events" WHERE "id" IN (
            SELECT "id" FROM "outbox_events"
            WHERE "status" IN ('completed', 'dead_letter')
              AND COALESCE("processed_at", "created_at") < $1
            LIMIT $2
          ) RETURNING "id"`,
  },
];

/** Arbitrary constant identifying this job's PostgreSQL advisory lock. */
const RETENTION_LOCK_KEY = 7_316_001;
const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_RETENTION_WINDOWS: RetentionWindows = {
  analyticsDays: env.ANALYTICS_RETENTION_DAYS,
  // Audit retention is a platform setting (Maintenance); this is the fallback.
  auditDays: SAFE_DEFAULT_POLICY.retention.auditDays,
  sessionDays: env.SESSION_RETENTION_DAYS,
  outboxDays: env.OUTBOX_RETENTION_DAYS,
};

/**
 * Purges data past its retention window (DB-4). Safe on several API instances:
 * a session-level advisory lock lets exactly one instance purge at a time, and
 * the others skip that run.
 */
@Injectable()
export class RetentionJob implements OnModuleDestroy {
  private readonly logger = new Logger(RetentionJob.name);
  private timer: NodeJS.Timeout | null = null;
  private startupTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
  ) {}

  /** Runs once shortly after boot, then on every interval (default daily). */
  start(intervalMs = DAY_MS, initialDelayMs = 60_000): void {
    if (this.timer || this.startupTimer) return;
    const tick = () => void this.runSafely();
    this.startupTimer = setTimeout(tick, initialDelayMs);
    this.timer = setInterval(tick, intervalMs);
    this.logger.log(`Retention job scheduled (interval: ${intervalMs}ms)`);
  }

  stop(): void {
    if (this.startupTimer) clearTimeout(this.startupTimer);
    if (this.timer) clearInterval(this.timer);
    this.startupTimer = null;
    this.timer = null;
  }

  onModuleDestroy(): void {
    this.stop();
  }

  async purge(
    windows: RetentionWindows = DEFAULT_RETENTION_WINDOWS,
    now: Date = new Date(),
    batchSize = 5000,
  ): Promise<RetentionResult> {
    if (!this.dataSource?.isInitialized) {
      return { status: 'skipped', reason: 'database_unavailable' };
    }

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      const [lock] = (await runner.query('SELECT pg_try_advisory_lock($1) AS "locked"', [
        RETENTION_LOCK_KEY,
      ])) as Array<{ locked: boolean }>;
      if (!lock?.locked) {
        return { status: 'skipped', reason: 'locked' };
      }

      try {
        const deleted = { analytics: 0, audit: 0, sessions: 0, outbox: 0 };
        for (const policy of POLICIES) {
          const cutoff = new Date(now.getTime() - policy.days(windows) * DAY_MS);
          deleted[policy.target] = await this.deleteInBatches(
            runner,
            policy.sql,
            cutoff,
            batchSize,
          );
        }
        await this.recordRun(deleted, windows);
        return { status: 'completed', deleted };
      } finally {
        await runner.query('SELECT pg_advisory_unlock($1)', [RETENTION_LOCK_KEY]);
      }
    } finally {
      await runner.release();
    }
  }

  private async deleteInBatches(
    runner: QueryRunner,
    sql: string,
    cutoff: Date,
    batchSize: number,
  ): Promise<number> {
    let total = 0;
    for (;;) {
      // TypeORM returns [rows, affectedCount] for DELETE ... RETURNING on PostgreSQL.
      const result: unknown = await runner.query(sql, [cutoff, batchSize]);
      const count = deletedCount(result);
      total += count;
      if (count < batchSize) return total;
    }
  }

  private async recordRun(
    deleted: Record<RetentionTarget, number>,
    windows: RetentionWindows,
  ): Promise<void> {
    const total = Object.values(deleted).reduce((sum, count) => sum + count, 0);
    this.logger.log(`Retention purge completed: ${JSON.stringify(deleted)}`);
    if (total === 0) return;
    await this.auditService.record({
      actorType: 'system',
      action: 'retention.purge',
      entityType: 'retention_policy',
      metadata: { deleted, windows: { ...windows } },
    });
  }

  private async runSafely(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      const { retention } = await this.settingsService.getPolicy();
      const result = await this.purge({
        ...DEFAULT_RETENTION_WINDOWS,
        auditDays: retention.auditDays,
      });
      if (result.status === 'skipped') {
        this.logger.log(`Retention purge skipped: ${result.reason}`);
      }
    } catch (err: unknown) {
      this.logger.error('Retention purge failed', err instanceof Error ? err.stack : String(err));
    } finally {
      this.isProcessing = false;
    }
  }
}

function deletedCount(result: unknown): number {
  if (Array.isArray(result)) {
    const [rows, affected] = result as [unknown, unknown];
    if (typeof affected === 'number') return affected;
    if (Array.isArray(rows)) return rows.length;
    return result.length;
  }
  return 0;
}
