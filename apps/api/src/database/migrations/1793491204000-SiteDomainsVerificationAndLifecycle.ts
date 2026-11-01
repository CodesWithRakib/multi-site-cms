import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Migration 1793491204000: Domain verification tokens and extended site lifecycle.
 *
 * Adds challenge verification tokens to `site_domains` and permits the
 * 'suspended' lifecycle status in `sites`.
 */
export class SiteDomainsVerificationAndLifecycle1793491204000 implements MigrationInterface {
  name = 'SiteDomainsVerificationAndLifecycle1793491204000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "site_domains"
        ADD COLUMN "verification_token" text,
        ADD COLUMN "verification_token_expires_at" timestamptz
    `);

    await queryRunner.query(`
      ALTER TABLE "sites"
        DROP CONSTRAINT "CHK_sites_status",
        ADD CONSTRAINT "CHK_sites_status" CHECK ("status" IN ('active', 'paused', 'archived', 'suspended'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sites"
        DROP CONSTRAINT "CHK_sites_status",
        ADD CONSTRAINT "CHK_sites_status" CHECK ("status" IN ('active', 'paused', 'archived'))
    `);

    await queryRunner.query(`
      ALTER TABLE "site_domains"
        DROP COLUMN "verification_token_expires_at",
        DROP COLUMN "verification_token"
    `);
  }
}
