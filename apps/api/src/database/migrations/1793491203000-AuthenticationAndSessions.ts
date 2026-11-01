import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Authentication and session persistence.
 *
 * Adds session storage with cryptographic token hashes and account lockout
 * metadata to support throttled authentication, session revocation, and
 * brute-force protection.
 */
export class AuthenticationAndSessions1793491203000 implements MigrationInterface {
  name = 'AuthenticationAndSessions1793491203000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "locked_until" timestamptz;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_locked_until"
        ON "users" ("locked_until")
        WHERE "locked_until" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "ip_address" inet,
        "user_agent" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "last_active_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sessions_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "CHK_sessions_token_hash_not_blank" CHECK (length(btrim("token_hash")) > 0),
        CONSTRAINT "CHK_sessions_expiry_after_created" CHECK ("expires_at" > "created_at")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_user_active"
        ON "sessions" ("user_id")
        WHERE "revoked_at" IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_expires_at"
        ON "sessions" ("expires_at");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_locked_until";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "locked_until";`);
  }
}
