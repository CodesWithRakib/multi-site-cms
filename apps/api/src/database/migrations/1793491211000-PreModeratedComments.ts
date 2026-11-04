import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 1. Public comments are pre-moderated: new rows default to `pending`.
 *    Existing rows keep their status; no data is rewritten.
 * 2. Composite FK (publication_id, site_id) → post_publications (id, site_id)
 *    so a comment can never point at a publication of another site (ADR-0009).
 *    The pre-check aborts the migration instead of deleting inconsistent rows.
 */
export class PreModeratedComments1793491211000 implements MigrationInterface {
  name = 'PreModeratedComments1793491211000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const mismatched = (await queryRunner.query(`
      SELECT COUNT(*)::int AS "count"
      FROM "post_comments" c
      JOIN "post_publications" p ON p."id" = c."publication_id"
      WHERE p."site_id" <> c."site_id"
    `)) as Array<{ count: number }>;

    const count = mismatched[0]?.count ?? 0;
    if (count > 0) {
      throw new Error(
        `post_comments has ${count} row(s) whose site_id differs from their publication's site_id. ` +
          'Resolve them manually before running this migration.',
      );
    }

    await queryRunner.query(`
      ALTER TABLE "post_comments" ALTER COLUMN "status" SET DEFAULT 'pending'
    `);

    await queryRunner.query(`
      ALTER TABLE "post_comments"
        ADD CONSTRAINT "FK_post_comments_publication_site"
        FOREIGN KEY ("publication_id", "site_id")
        REFERENCES "post_publications" ("id", "site_id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "post_comments" DROP CONSTRAINT IF EXISTS "FK_post_comments_publication_site"
    `);
    await queryRunner.query(`
      ALTER TABLE "post_comments" ALTER COLUMN "status" SET DEFAULT 'approved'
    `);
  }
}
