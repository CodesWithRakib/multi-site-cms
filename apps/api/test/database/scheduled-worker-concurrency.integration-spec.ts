import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';

import { AuditService } from '../../src/common/audit/audit.service';
import { ScheduledPublicationWorker } from '../../src/publishing/jobs/scheduled-publication.worker';
import { createTestDataSource, resetTestSchema } from './test-database';

/**
 * Proves the scheduled-publication worker is safe to run on several API
 * instances at once: `FOR UPDATE SKIP LOCKED` must hand each due publication to
 * exactly one worker, so nothing is published twice and no outbox event is
 * duplicated.
 *
 * Each worker gets its own data source (its own connection pool), which is how
 * two API processes would reach the database in production.
 */

let primary: DataSource;
let secondary: DataSource;
let authorId: string;
let siteId: string;

function workerFor(dataSource: DataSource): ScheduledPublicationWorker {
  return new ScheduledPublicationWorker(dataSource, new AuditService(dataSource));
}

/** First row of a query result; fails loudly instead of returning undefined. */
async function firstRow<T>(sql: string, params: unknown[] = []): Promise<T> {
  const rows = (await primary.query(sql, params)) as T[];
  const row = rows[0];
  if (row === undefined) throw new Error(`Query returned no rows: ${sql}`);
  return row;
}

async function insertId(sql: string, params: unknown[] = []): Promise<string> {
  return (await firstRow<{ id: string }>(sql, params)).id;
}

async function seedDuePublications(count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let index = 0; index < count; index++) {
    const postId = await insertId(`INSERT INTO "posts" ("author_id") VALUES ($1) RETURNING "id"`, [
      authorId,
    ]);
    const revisionId = await insertId(
      `INSERT INTO "post_revisions" ("post_id", "revision_number", "title", "body", "created_by")
       VALUES ($1, 1, $2, '{"type":"doc"}'::jsonb, $3) RETURNING "id"`,
      [postId, `Scheduled ${index}`, authorId],
    );
    ids.push(
      await insertId(
        `INSERT INTO "post_publications" ("site_id", "post_id", "revision_id", "slug", "status", "scheduled_for")
         VALUES ($1, $2, $3, $4, 'scheduled', NOW() - INTERVAL '1 minute') RETURNING "id"`,
        [siteId, postId, revisionId, `scheduled-${index}`],
      ),
    );
  }
  return ids;
}

/** Runs one worker in small batches until it finds nothing left to claim. */
async function drain(worker: ScheduledPublicationWorker, batchSize: number): Promise<number> {
  let total = 0;
  for (;;) {
    const processed = await worker.processDuePublications(batchSize);
    if (processed === 0) return total;
    total += processed;
  }
}

async function count(sql: string, params: unknown[] = []): Promise<number> {
  return Number((await firstRow<{ count: string }>(sql, params)).count);
}

beforeAll(async () => {
  Logger.overrideLogger(false);
  primary = await createTestDataSource();
  await resetTestSchema(primary);
  secondary = await createTestDataSource();
}, 60_000);

afterAll(async () => {
  await Promise.all(
    [primary, secondary].filter((ds) => ds?.isInitialized).map((ds) => ds.destroy()),
  );
});

beforeEach(async () => {
  await primary.query(
    `TRUNCATE "outbox_events", "audit_events", "post_publications", "post_revisions", "posts", "sites", "users" CASCADE`,
  );
  authorId = await insertId(
    `INSERT INTO "users" ("email", "display_name") VALUES ('worker@example.test', 'Worker Author') RETURNING "id"`,
  );
  siteId = await insertId(
    `INSERT INTO "sites" ("key", "name") VALUES ('travel-blog', 'Travel') RETURNING "id"`,
  );
});

describe('scheduled publication worker concurrency', () => {
  it('publishes every due item exactly once across two concurrent workers', async () => {
    const ids = await seedDuePublications(30);

    const [first, second] = await Promise.all([
      drain(workerFor(primary), 4),
      drain(workerFor(secondary), 4),
    ]);

    expect(first + second).toBe(ids.length);
    expect(
      await count(
        `SELECT COUNT(*) AS "count" FROM "post_publications" WHERE "status" = 'published' AND "published_at" IS NOT NULL`,
      ),
    ).toBe(ids.length);

    // One `publication.published` event per publication, never two.
    const perPublication = (await primary.query(
      `SELECT "publication_id", COUNT(*)::int AS "events" FROM "outbox_events" GROUP BY "publication_id"`,
    )) as Array<{ publication_id: string; events: number }>;
    expect(perPublication).toHaveLength(ids.length);
    expect(perPublication.every((row) => row.events === 1)).toBe(true);

    expect(
      await count(
        `SELECT COUNT(*) AS "count" FROM "audit_events" WHERE "action" = 'publication.scheduled_publish'`,
      ),
    ).toBe(ids.length);
  });

  it('skips a row another transaction holds and picks it up once released', async () => {
    const [lockedId, freeId] = await seedDuePublications(2);
    const runner = secondary.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      await runner.query(`SELECT "id" FROM "post_publications" WHERE "id" = $1 FOR UPDATE`, [
        lockedId,
      ]);

      // Must not block on the locked row, and must still publish the free one.
      await expect(workerFor(primary).processDuePublications(10)).resolves.toBe(1);

      const statuses = (await primary.query(
        `SELECT "id", "status" FROM "post_publications" WHERE "id" = ANY($1)`,
        [[lockedId, freeId]],
      )) as Array<{ id: string; status: string }>;
      const statusOf = (id: string | undefined) => statuses.find((row) => row.id === id)?.status;
      expect(statusOf(freeId)).toBe('published');
      expect(statusOf(lockedId)).toBe('scheduled');
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
    }

    await expect(workerFor(primary).processDuePublications(10)).resolves.toBe(1);
    expect(
      await count(
        `SELECT COUNT(*) AS "count" FROM "post_publications" WHERE "status" = 'published'`,
      ),
    ).toBe(2);
  });

  it('ignores items scheduled in the future', async () => {
    const [id] = await seedDuePublications(1);
    await primary.query(
      `UPDATE "post_publications" SET "scheduled_for" = NOW() + INTERVAL '1 hour' WHERE "id" = $1`,
      [id],
    );

    await expect(workerFor(primary).processDuePublications(10)).resolves.toBe(0);
    expect(await count(`SELECT COUNT(*) AS "count" FROM "outbox_events"`)).toBe(0);
  });
});
