import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';

import { AuditService } from '../../src/common/audit/audit.service';
import { RetentionJob, type RetentionWindows } from '../../src/maintenance/retention.job';
import { SettingsService } from '../../src/settings/settings.service';
import { createTestDataSource, resetTestSchema } from './test-database';

/**
 * Retention purge (DB-4) against real PostgreSQL: only rows past their window
 * are deleted, in batches, and only one instance purges at a time.
 */

const WINDOWS: RetentionWindows = {
  analyticsDays: 730,
  auditDays: 730,
  sessionDays: 30,
  outboxDays: 30,
};
const NOW = new Date('2026-11-05T00:00:00Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

let dataSource: DataSource;
let siteId: string;
let userId: string;

async function firstRow<T>(sql: string, params: unknown[] = []): Promise<T> {
  const rows = (await dataSource.query(sql, params)) as T[];
  const row = rows[0];
  if (row === undefined) throw new Error(`Query returned no rows: ${sql}`);
  return row;
}

const count = async (table: string) =>
  Number((await firstRow<{ count: string }>(`SELECT COUNT(*) AS "count" FROM "${table}"`)).count);

const job = () => {
  const audit = new AuditService(dataSource);
  return new RetentionJob(dataSource, audit, new SettingsService(dataSource, audit));
};

async function insertPageViews(createdAt: string, rows = 1): Promise<void> {
  await dataSource.query(
    `INSERT INTO "analytics_page_views" ("site_id", "path", "visitor_id", "created_at")
     SELECT $1, '/', md5(g::text), $2 FROM generate_series(1, $3) AS g`,
    [siteId, createdAt, rows],
  );
}

async function insertAudit(createdAt: string): Promise<void> {
  await dataSource.query(
    `INSERT INTO "audit_events" ("actor_type", "action", "entity_type", "created_at")
     VALUES ('system', 'test.event', 'test', $1)`,
    [createdAt],
  );
}

async function insertSession(createdAt: string, expiresAt: string, revokedAt: string | null) {
  await dataSource.query(
    `INSERT INTO "sessions" ("user_id", "token_hash", "created_at", "last_active_at", "expires_at", "revoked_at")
     VALUES ($1, md5(random()::text), $2, $2, $3, $4)`,
    [userId, createdAt, expiresAt, revokedAt],
  );
}

async function insertOutbox(status: string, processedAt: string | null, createdAt: string) {
  await dataSource.query(
    `INSERT INTO "outbox_events" ("event_type", "payload", "status", "processed_at", "created_at")
     VALUES ('test.event', '{}'::jsonb, $1, $2, $3)`,
    [status, processedAt, createdAt],
  );
}

beforeAll(async () => {
  Logger.overrideLogger(false);
  dataSource = await createTestDataSource();
  await resetTestSchema(dataSource);
}, 60_000);

afterAll(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy();
});

beforeEach(async () => {
  await dataSource.query(
    `TRUNCATE "analytics_page_views", "audit_events", "sessions", "outbox_events", "sites", "users" CASCADE`,
  );
  siteId = (
    await firstRow<{ id: string }>(
      `INSERT INTO "sites" ("key", "name") VALUES ('travel-blog', 'Travel') RETURNING "id"`,
    )
  ).id;
  userId = (
    await firstRow<{ id: string }>(
      `INSERT INTO "users" ("email", "display_name") VALUES ('retention@example.test', 'R') RETURNING "id"`,
    )
  ).id;
});

describe('retention purge', () => {
  it('deletes only rows past each window', async () => {
    await insertPageViews(daysAgo(731));
    await insertPageViews(daysAgo(729));
    await insertAudit(daysAgo(800));
    await insertAudit(daysAgo(10));
    await insertSession(daysAgo(90), daysAgo(60), null); // expired long ago
    await insertSession(daysAgo(90), daysAgo(-30), daysAgo(45)); // revoked long ago
    await insertSession(daysAgo(20), daysAgo(5), null); // expired recently: kept
    await insertSession(daysAgo(1), daysAgo(-29), null); // active: kept
    await insertOutbox('completed', daysAgo(40), daysAgo(41));
    await insertOutbox('dead_letter', null, daysAgo(60));
    await insertOutbox('completed', daysAgo(5), daysAgo(5)); // recent: kept
    await insertOutbox('failed', null, daysAgo(90)); // still retrying: kept
    await insertOutbox('pending', null, daysAgo(90)); // undelivered: kept

    const result = await job().purge(WINDOWS, NOW);

    expect(result).toEqual({
      status: 'completed',
      deleted: { analytics: 1, audit: 1, sessions: 2, outbox: 2 },
    });
    expect(await count('analytics_page_views')).toBe(1);
    expect(await count('sessions')).toBe(2);
    expect(await count('outbox_events')).toBe(3);
    // One recent audit row kept, plus the purge's own audit record.
    const actions = (await dataSource.query(
      `SELECT "action" FROM "audit_events" ORDER BY "id"`,
    )) as Array<{ action: string }>;
    expect(actions.map((row) => row.action)).toEqual(['test.event', 'retention.purge']);
  });

  it('drains a backlog larger than one batch', async () => {
    await insertPageViews(daysAgo(800), 23);
    await insertPageViews(daysAgo(1), 2);

    const result = await job().purge(WINDOWS, NOW, 5);

    expect(result.status === 'completed' && result.deleted.analytics).toBe(23);
    expect(await count('analytics_page_views')).toBe(2);
  });

  it('skips the run while another instance holds the lock', async () => {
    await insertPageViews(daysAgo(800));
    const holder = dataSource.createQueryRunner();
    await holder.connect();
    try {
      await holder.query('SELECT pg_advisory_lock(7316001)');
      await expect(job().purge(WINDOWS, NOW)).resolves.toEqual({
        status: 'skipped',
        reason: 'locked',
      });
      expect(await count('analytics_page_views')).toBe(1);
    } finally {
      await holder.query('SELECT pg_advisory_unlock(7316001)');
      await holder.release();
    }

    const result = await job().purge(WINDOWS, NOW);
    expect(result.status).toBe('completed');
    expect(await count('analytics_page_views')).toBe(0);
  });

  it('records nothing in the audit log when there is nothing to purge', async () => {
    await expect(job().purge(WINDOWS, NOW)).resolves.toEqual({
      status: 'completed',
      deleted: { analytics: 0, audit: 0, sessions: 0, outbox: 0 },
    });
    expect(await count('audit_events')).toBe(0);
  });
});
