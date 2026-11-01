import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 06 Content enhancements:
 * - Adds `source_locale` to `posts`
 * - Expands `CHK_posts_type` to support domain-specific types ('travel_guide', 'air_sports_update', 'event_update')
 * - Adds `parent_id`, `display_order`, and `is_active` to `categories` with same-site foreign key
 * - Adds `description` to `tags`
 * - Adds `original_filename` to `media_assets`
 */
export class ContentEnhancementsAndTaxonomyHierarchy1793491205000 implements MigrationInterface {
  name = 'ContentEnhancementsAndTaxonomyHierarchy1793491205000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Posts enhancements
    await queryRunner.query(`
      ALTER TABLE "posts"
        ADD COLUMN IF NOT EXISTS "source_locale" text NOT NULL DEFAULT 'en'
    `);

    await queryRunner.query(`
      ALTER TABLE "posts"
        DROP CONSTRAINT IF EXISTS "CHK_posts_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "posts"
        ADD CONSTRAINT "CHK_posts_type"
        CHECK ("type" IN ('article', 'guide', 'news', 'live_update', 'travel_guide', 'air_sports_update', 'event_update'))
    `);

    // 2. Categories hierarchy, ordering, and status
    await queryRunner.query(`
      ALTER TABLE "categories"
        ADD COLUMN IF NOT EXISTS "parent_id" uuid,
        ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "categories"
        ADD CONSTRAINT "FK_categories_parent"
        FOREIGN KEY ("parent_id", "site_id")
        REFERENCES "categories" ("id", "site_id")
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_categories_parent"
        ON "categories" ("parent_id", "site_id")
    `);

    // 3. Tags description
    await queryRunner.query(`
      ALTER TABLE "tags"
        ADD COLUMN IF NOT EXISTS "description" text
    `);

    // 4. Media assets original filename
    await queryRunner.query(`
      ALTER TABLE "media_assets"
        ADD COLUMN IF NOT EXISTS "original_filename" text
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Revert media_assets
    await queryRunner.query(`
      ALTER TABLE "media_assets"
        DROP COLUMN IF EXISTS "original_filename"
    `);

    // Revert tags
    await queryRunner.query(`
      ALTER TABLE "tags"
        DROP COLUMN IF EXISTS "description"
    `);

    // Revert categories
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_categories_parent"
    `);

    await queryRunner.query(`
      ALTER TABLE "categories"
        DROP CONSTRAINT IF EXISTS "FK_categories_parent",
        DROP COLUMN IF EXISTS "is_active",
        DROP COLUMN IF EXISTS "display_order",
        DROP COLUMN IF EXISTS "parent_id"
    `);

    // Revert posts
    await queryRunner.query(`
      ALTER TABLE "posts"
        DROP CONSTRAINT IF EXISTS "CHK_posts_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "posts"
        ADD CONSTRAINT "CHK_posts_type"
        CHECK ("type" IN ('article', 'guide', 'news', 'live_update'))
    `);

    await queryRunner.query(`
      ALTER TABLE "posts"
        DROP COLUMN IF EXISTS "source_locale"
    `);
  }
}
