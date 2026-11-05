import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Analytics and Traffic Events
 *
 * Implements:
 * 1. `analytics_page_views` table with site isolation, post referencing,
 *    demographic/device tracking, and duration metrics.
 * 2. High-performance composite indexes for real-time and historical range queries.
 * 3. (Removed) Generated sample traffic; see the note in `up()`.
 */
export class AnalyticsAndTrafficEvents1793491207000 implements MigrationInterface {
  name = 'AnalyticsAndTrafficEvents1793491207000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create analytics_page_views table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "analytics_page_views" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "site_id" uuid NOT NULL,
        "post_id" uuid,
        "path" text NOT NULL,
        "referrer" text,
        "referrer_source" text NOT NULL DEFAULT 'direct',
        "visitor_id" text NOT NULL,
        "device_type" text NOT NULL DEFAULT 'desktop',
        "browser" text NOT NULL DEFAULT 'chrome',
        "os" text NOT NULL DEFAULT 'windows',
        "country_code" text NOT NULL DEFAULT 'US',
        "country_name" text NOT NULL DEFAULT 'United States',
        "duration_seconds" integer NOT NULL DEFAULT 45,
        "is_unique" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_analytics_page_views_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_analytics_page_views_post" FOREIGN KEY ("post_id")
          REFERENCES "posts" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_analytics_page_views_device"
          CHECK ("device_type" IN ('desktop', 'mobile', 'tablet')),
        CONSTRAINT "CHK_analytics_page_views_source"
          CHECK ("referrer_source" IN ('direct', 'search', 'social', 'newsletter', 'referral'))
      )
    `);

    // 2. High-performance indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_site_created"
        ON "analytics_page_views" ("site_id", "created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_post_created"
        ON "analytics_page_views" ("post_id", "created_at" DESC)
        WHERE "post_id" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_created"
        ON "analytics_page_views" ("created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_site_path"
        ON "analytics_page_views" ("site_id", "path");
    `);

    // 3. (Removed) This migration used to insert ~90 days of randomly generated
    //    page views for every existing site. Fabricated analytics must never
    //    reach a real database, so new installs start empty. Databases that
    //    already ran it can identify and remove those rows with
    //    `pnpm --filter @multi-site-cms/api db:cleanup:generated-analytics`
    //    (dry run by default). The schema created above is unchanged.
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "analytics_page_views" CASCADE`);
  }
}
