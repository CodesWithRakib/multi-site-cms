import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NewsletterSubscribers1793491209000 implements MigrationInterface {
  name = 'NewsletterSubscribers1793491209000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "site_id" UUID NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
        "email" VARCHAR(255) NOT NULL,
        "status" VARCHAR(32) NOT NULL DEFAULT 'subscribed',
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_newsletter_site_email" UNIQUE ("site_id", "email")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_newsletter_site_created" ON "newsletter_subscribers" ("site_id", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_subscribers";`);
  }
}

