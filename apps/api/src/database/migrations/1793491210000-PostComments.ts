import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PostComments1793491210000 implements MigrationInterface {
  name = 'PostComments1793491210000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_comments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "site_id" UUID NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
        "publication_id" UUID NOT NULL REFERENCES "post_publications"("id") ON DELETE CASCADE,
        "author_name" VARCHAR(100) NOT NULL,
        "author_email" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "rating" SMALLINT,
        "status" VARCHAR(32) NOT NULL DEFAULT 'approved',
        "parent_id" UUID REFERENCES "post_comments"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_post_comments_rating" CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5)),
        CONSTRAINT "CHK_post_comments_status" CHECK ("status" IN ('approved', 'pending', 'rejected', 'spam'))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_post_comments_pub_status_created" 
      ON "post_comments" ("publication_id", "status", "created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_post_comments_site_status_created" 
      ON "post_comments" ("site_id", "status", "created_at" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "post_comments";`);
  }
}

