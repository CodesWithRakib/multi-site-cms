import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Optional profile photo for users, shown in the admin and as the author
 * avatar on published articles. It references a media asset (never a stored
 * URL, ADR-0010), and is cleared automatically if that asset is deleted.
 * Additive and nullable: no existing row changes.
 */
export class UserAvatar1793491213000 implements MigrationInterface {
  name = 'UserAvatar1793491213000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "avatar_media_id" uuid`);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_avatar_media" FOREIGN KEY ("avatar_media_id")
        REFERENCES "media_assets" ("id") ON DELETE SET NULL
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_users_avatar_media_id" ON "users" ("avatar_media_id") WHERE "avatar_media_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_avatar_media_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_avatar_media"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_media_id"`);
  }
}
