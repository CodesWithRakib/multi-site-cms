import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Site-owned taxonomy and events, canonical content and publications, media
 * metadata, and the audit log.
 *
 * The composite foreign keys are the core of the isolation model:
 * - `post_publications (post_id, revision_id) → post_revisions (post_id, id)`
 *   proves a publication pins a revision of its own post.
 * - Every site-scoped join carries `site_id`, so a publication cannot reference
 *   another tenant's category, tag, event, or media asset.
 */
export class ContentMediaAndAudit1793491202000 implements MigrationInterface {
  name = 'ContentMediaAndAudit1793491202000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "site_id" uuid NOT NULL,
        "slug" citext NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_site_slug" UNIQUE ("site_id", "slug"),
        CONSTRAINT "UQ_categories_id_site" UNIQUE ("id", "site_id"),
        CONSTRAINT "FK_categories_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "CHK_categories_slug_format" CHECK ("slug"::text ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
        CONSTRAINT "CHK_categories_slug_length" CHECK (char_length("slug"::text) BETWEEN 1 AND 96),
        CONSTRAINT "CHK_categories_name_not_blank" CHECK (length(btrim("name")) > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "site_id" uuid NOT NULL,
        "slug" citext NOT NULL,
        "name" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tags" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tags_site_slug" UNIQUE ("site_id", "slug"),
        CONSTRAINT "UQ_tags_id_site" UNIQUE ("id", "site_id"),
        CONSTRAINT "FK_tags_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "CHK_tags_slug_format" CHECK ("slug"::text ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
        CONSTRAINT "CHK_tags_slug_length" CHECK (char_length("slug"::text) BETWEEN 1 AND 96),
        CONSTRAINT "CHK_tags_name_not_blank" CHECK (length(btrim("name")) > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "site_id" uuid NOT NULL,
        "slug" citext NOT NULL,
        "name" text NOT NULL,
        "status" text NOT NULL DEFAULT 'scheduled',
        "starts_at" timestamptz NOT NULL,
        "ends_at" timestamptz,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_events_site_slug" UNIQUE ("site_id", "slug"),
        CONSTRAINT "UQ_events_id_site" UNIQUE ("id", "site_id"),
        CONSTRAINT "FK_events_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "CHK_events_slug_format" CHECK ("slug"::text ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
        CONSTRAINT "CHK_events_status" CHECK ("status" IN ('scheduled', 'live', 'completed', 'cancelled')),
        CONSTRAINT "CHK_events_time_range" CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at"),
        CONSTRAINT "CHK_events_title_not_blank" CHECK (length(btrim("name")) > 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_events_site_start" ON "events" ("site_id", "starts_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "media_assets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "site_id" uuid,
        "uploaded_by" uuid,
        "storage_provider" text NOT NULL DEFAULT 'local',
        "storage_key" text NOT NULL,
        "mime_type" text NOT NULL,
        "byte_size" bigint NOT NULL,
        "checksum" text NOT NULL,
        "width" integer,
        "height" integer,
        "alt_text" text,
        "caption" text,
        "status" text NOT NULL DEFAULT 'active',
        "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_media_assets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_media_assets_storage_key" UNIQUE ("storage_key"),
        CONSTRAINT "UQ_media_assets_id_site" UNIQUE ("id", "site_id"),
        CONSTRAINT "FK_media_assets_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_media_assets_uploaded_by" FOREIGN KEY ("uploaded_by")
          REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_media_assets_provider_format" CHECK ("storage_provider" ~ '^[a-z][a-z0-9-]{0,31}$'),
        CONSTRAINT "CHK_media_assets_storage_key_not_blank" CHECK (length(btrim("storage_key")) > 0),
        CONSTRAINT "CHK_media_assets_mime_type" CHECK ("mime_type" ~ '^[a-z0-9.+-]+/[a-z0-9.+-]+$'),
        CONSTRAINT "CHK_media_assets_byte_size" CHECK ("byte_size" > 0),
        CONSTRAINT "CHK_media_assets_checksum" CHECK (char_length("checksum") BETWEEN 32 AND 128),
        CONSTRAINT "CHK_media_assets_dimensions" CHECK (
          ("width" IS NULL AND "height" IS NULL)
          OR ("width" IS NOT NULL AND "height" IS NOT NULL AND "width" > 0 AND "height" > 0)
        ),
        CONSTRAINT "CHK_media_assets_status" CHECK ("status" IN ('active', 'archived'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_media_assets_site_created" ON "media_assets" ("site_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_media_assets_checksum" ON "media_assets" ("checksum")`,
    );

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "author_id" uuid NOT NULL,
        "type" text NOT NULL DEFAULT 'article',
        "status" text NOT NULL DEFAULT 'draft',
        "deleted_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_posts_author" FOREIGN KEY ("author_id")
          REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "CHK_posts_type" CHECK ("type" IN ('article', 'guide', 'news', 'live_update')),
        CONSTRAINT "CHK_posts_status" CHECK ("status" IN ('draft', 'in_review', 'approved', 'archived'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_author_created" ON "posts" ("author_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_posts_status_updated" ON "posts" ("status", "updated_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "post_revisions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "post_id" uuid NOT NULL,
        "revision_number" integer NOT NULL,
        "title" text NOT NULL,
        "excerpt" text,
        "body" jsonb NOT NULL,
        "change_summary" text,
        "created_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_revisions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_revisions_post_number" UNIQUE ("post_id", "revision_number"),
        CONSTRAINT "UQ_post_revisions_post_id" UNIQUE ("post_id", "id"),
        CONSTRAINT "FK_post_revisions_post" FOREIGN KEY ("post_id")
          REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_revisions_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "CHK_post_revisions_number" CHECK ("revision_number" >= 1),
        CONSTRAINT "CHK_post_revisions_title" CHECK (length(btrim("title")) > 0),
        CONSTRAINT "CHK_post_revisions_body_object" CHECK (jsonb_typeof("body") = 'object')
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "post_publications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "site_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "revision_id" uuid NOT NULL,
        "event_id" uuid,
        "slug" citext NOT NULL,
        "status" text NOT NULL DEFAULT 'draft',
        "scheduled_for" timestamptz,
        "published_at" timestamptz,
        "seo_title" text,
        "seo_description" text,
        "canonical_url" text,
        "featured_image_id" uuid,
        "template_key" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_publications" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_publications_site_post" UNIQUE ("site_id", "post_id"),
        CONSTRAINT "UQ_post_publications_site_slug" UNIQUE ("site_id", "slug"),
        CONSTRAINT "UQ_post_publications_id_site" UNIQUE ("id", "site_id"),
        CONSTRAINT "FK_post_publications_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_publications_post" FOREIGN KEY ("post_id")
          REFERENCES "posts" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_publications_revision" FOREIGN KEY ("post_id", "revision_id")
          REFERENCES "post_revisions" ("post_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_publications_event" FOREIGN KEY ("event_id", "site_id")
          REFERENCES "events" ("id", "site_id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_publications_featured_image" FOREIGN KEY ("featured_image_id", "site_id")
          REFERENCES "media_assets" ("id", "site_id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "CHK_post_publications_status" CHECK ("status" IN ('draft', 'scheduled', 'published', 'archived')),
        CONSTRAINT "CHK_post_publications_slug_format" CHECK ("slug"::text ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
        CONSTRAINT "CHK_post_publications_slug_length" CHECK (char_length("slug"::text) BETWEEN 1 AND 96),
        CONSTRAINT "CHK_post_publications_schedule" CHECK ("status" <> 'scheduled' OR "scheduled_for" IS NOT NULL),
        CONSTRAINT "CHK_post_publications_published" CHECK ("status" <> 'published' OR "published_at" IS NOT NULL),
        CONSTRAINT "CHK_post_publications_canonical_url" CHECK ("canonical_url" IS NULL OR "canonical_url" ~ '^https?://[^[:space:]]+$'),
        CONSTRAINT "CHK_post_publications_template_key" CHECK ("template_key" IS NULL OR "template_key" ~ '^[a-z][a-z0-9-]{0,63}$'),
        CONSTRAINT "CHK_post_publications_seo_title_length" CHECK ("seo_title" IS NULL OR char_length("seo_title") <= 200),
        CONSTRAINT "CHK_post_publications_seo_description_length" CHECK ("seo_description" IS NULL OR char_length("seo_description") <= 320)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_post_publications_site_status_published" ON "post_publications" ("site_id", "status", "published_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_publications_due" ON "post_publications" ("scheduled_for") WHERE "status" = 'scheduled'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_publications_event" ON "post_publications" ("event_id", "published_at") WHERE "event_id" IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "post_publication_categories" (
        "publication_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        CONSTRAINT "PK_post_publication_categories" PRIMARY KEY ("publication_id", "category_id", "site_id"),
        CONSTRAINT "FK_post_publication_categories_publication" FOREIGN KEY ("publication_id", "site_id")
          REFERENCES "post_publications" ("id", "site_id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_publication_categories_category" FOREIGN KEY ("category_id", "site_id")
          REFERENCES "categories" ("id", "site_id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_post_publication_categories_category" ON "post_publication_categories" ("category_id", "site_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "post_publication_tags" (
        "publication_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        CONSTRAINT "PK_post_publication_tags" PRIMARY KEY ("publication_id", "tag_id", "site_id"),
        CONSTRAINT "FK_post_publication_tags_publication" FOREIGN KEY ("publication_id", "site_id")
          REFERENCES "post_publications" ("id", "site_id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_publication_tags_tag" FOREIGN KEY ("tag_id", "site_id")
          REFERENCES "tags" ("id", "site_id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_post_publication_tags_tag" ON "post_publication_tags" ("tag_id", "site_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "post_publication_media" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "publication_id" uuid NOT NULL,
        "media_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        "role" text NOT NULL DEFAULT 'gallery',
        "position" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_post_publication_media" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_post_publication_media_usage" UNIQUE ("publication_id", "media_id", "role"),
        CONSTRAINT "FK_post_publication_media_publication" FOREIGN KEY ("publication_id", "site_id")
          REFERENCES "post_publications" ("id", "site_id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_post_publication_media_media" FOREIGN KEY ("media_id", "site_id")
          REFERENCES "media_assets" ("id", "site_id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "CHK_post_publication_media_role" CHECK ("role" IN ('featured', 'gallery', 'inline', 'attachment')),
        CONSTRAINT "CHK_post_publication_media_position" CHECK ("position" >= 0)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_post_publication_media_asset" ON "post_publication_media" ("media_id", "site_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_post_publication_media_publication" ON "post_publication_media" ("publication_id", "position")`,
    );

    await queryRunner.query(`
      CREATE TABLE "audit_events" (
        "id" bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
        "actor_id" uuid,
        "actor_type" text NOT NULL DEFAULT 'user',
        "site_id" uuid,
        "action" text NOT NULL,
        "entity_type" text NOT NULL,
        "entity_id" uuid,
        "request_id" text,
        "ip_address" inet,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_events_actor" FOREIGN KEY ("actor_id")
          REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_audit_events_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_audit_events_actor_type" CHECK ("actor_type" IN ('user', 'system', 'bootstrap')),
        CONSTRAINT "CHK_audit_events_action_format" CHECK ("action" ~ '^[a-z][a-z0-9_]*[.][a-z][a-z0-9_]*$'),
        CONSTRAINT "CHK_audit_events_actor" CHECK (
          ("actor_type" = 'user' AND "actor_id" IS NOT NULL)
          OR ("actor_type" <> 'user')
        ),
        CONSTRAINT "CHK_audit_events_metadata_object" CHECK (jsonb_typeof("metadata") = 'object')
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_events_site_created" ON "audit_events" ("site_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_events_actor_created" ON "audit_events" ("actor_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_events_action_created" ON "audit_events" ("action", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_events_entity" ON "audit_events" ("entity_type", "entity_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_publication_media"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_publication_tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_publication_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_publications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "post_revisions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "media_assets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
