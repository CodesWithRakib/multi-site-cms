import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 08 Publishing lifecycle and transactional outbox:
 * - Expands `CHK_post_publications_status` to include 'in_review'
 * - Creates `outbox_events` table for reliable, asynchronous event delivery (cache invalidation, real-time broadcasts)
 * - Adds partial index on due outbox events for high-performance worker polling with FOR UPDATE SKIP LOCKED
 */
export class PublishingLifecycleAndOutbox1793491206000 implements MigrationInterface {
  name = 'PublishingLifecycleAndOutbox1793491206000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Update post_publications status check constraint to support 'in_review'
    await queryRunner.query(`
      ALTER TABLE "post_publications"
        DROP CONSTRAINT IF EXISTS "CHK_post_publications_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "post_publications"
        ADD CONSTRAINT "CHK_post_publications_status"
        CHECK ("status" IN ('draft', 'in_review', 'scheduled', 'published', 'archived'))
    `);

    // 2. Create outbox_events table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "outbox_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_type" text NOT NULL,
        "event_version" integer NOT NULL DEFAULT 1,
        "site_id" uuid,
        "publication_id" uuid,
        "post_id" uuid,
        "payload" jsonb NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "retry_count" integer NOT NULL DEFAULT 0,
        "max_retries" integer NOT NULL DEFAULT 5,
        "next_retry_at" timestamptz NOT NULL DEFAULT now(),
        "last_error" text,
        "processed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_outbox_events_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_outbox_events_status"
          CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'dead_letter'))
      )
    `);

    // 3. Create indexes for efficient due-work scanning and entity lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_outbox_events_due"
        ON "outbox_events" ("status", "next_retry_at")
        WHERE "status" IN ('pending', 'processing')
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_outbox_events_site"
        ON "outbox_events" ("site_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_outbox_events_pub"
        ON "outbox_events" ("publication_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop outbox_events table and indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_outbox_events_pub"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_outbox_events_site"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_outbox_events_due"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "outbox_events"`);

    // 2. Revert post_publications status constraint
    await queryRunner.query(`
      ALTER TABLE "post_publications"
        DROP CONSTRAINT IF EXISTS "CHK_post_publications_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "post_publications"
        ADD CONSTRAINT "CHK_post_publications_status"
        CHECK ("status" IN ('draft', 'scheduled', 'published', 'archived'))
    `);
  }
}
