import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Optional contact phone on user profiles, in E.164 format ("+" and 8–15
 * digits). Additive and nullable: no existing row changes.
 */
export class UserPhone1793491212000 implements MigrationInterface {
  name = 'UserPhone1793491212000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "phone" varchar(16)`);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "CHK_users_phone_e164" CHECK ("phone" IS NULL OR "phone" ~ '^[+][1-9][0-9]{7,14}$')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "CHK_users_phone_e164"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
  }
}
