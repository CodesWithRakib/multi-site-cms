import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity, authorization, and the site registry.
 *
 * Ordering matters: `users` precedes `sites` (site creation is attributed) and
 * `sites` precedes `user_role_assignments` (site-scoped grants).
 */
export class IdentityAndSiteRegistry1793491201000 implements MigrationInterface {
  name = 'IdentityAndSiteRegistry1793491201000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" citext NOT NULL,
        "password_hash" text,
        "display_name" text NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "last_login_at" timestamptz,
        "failed_login_count" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_email_not_blank" CHECK ("email"::text <> ''),
        CONSTRAINT "CHK_users_status" CHECK ("status" IN ('active', 'invited', 'suspended', 'disabled')),
        CONSTRAINT "CHK_users_failed_login_count" CHECK ("failed_login_count" >= 0),
        CONSTRAINT "CHK_users_display_name_not_blank" CHECK (length(btrim("display_name")) > 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_status" ON "users" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" citext NOT NULL,
        "name" text NOT NULL,
        "scope_type" text NOT NULL,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_key" UNIQUE ("key"),
        CONSTRAINT "UQ_roles_id_scope_type" UNIQUE ("id", "scope_type"),
        CONSTRAINT "CHK_roles_scope_type" CHECK ("scope_type" IN ('platform', 'site')),
        CONSTRAINT "CHK_roles_key_format" CHECK ("key"::text ~ '^[a-z][a-z0-9_]*$')
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" citext NOT NULL,
        "description" text NOT NULL,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_key" UNIQUE ("key"),
        CONSTRAINT "CHK_permissions_key_not_blank" CHECK ("key"::text <> ''),
        CONSTRAINT "CHK_permissions_key_format" CHECK ("key"::text ~ '^[a-z][a-z0-9_]*(:[a-z][a-z0-9_]*)+$')
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id")
          REFERENCES "permissions" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_role_permissions_permission" ON "role_permissions" ("permission_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "sites" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" citext NOT NULL,
        "name" text NOT NULL,
        "default_locale" text NOT NULL DEFAULT 'en',
        "timezone" text NOT NULL DEFAULT 'UTC',
        "status" text NOT NULL DEFAULT 'active',
        "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sites_key" UNIQUE ("key"),
        CONSTRAINT "FK_sites_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_sites_key_format" CHECK ("key"::text ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
        CONSTRAINT "CHK_sites_status" CHECK ("status" IN ('active', 'paused', 'archived')),
        CONSTRAINT "CHK_sites_settings_object" CHECK (jsonb_typeof("settings") = 'object'),
        CONSTRAINT "CHK_sites_locale_format" CHECK ("default_locale" ~ '^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{2,8})*$'),
        CONSTRAINT "CHK_sites_name_not_blank" CHECK (length(btrim("name")) > 0)
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sites_status" ON "sites" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "site_domains" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "site_id" uuid NOT NULL,
        "hostname" citext NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "is_primary" boolean NOT NULL DEFAULT false,
        "verified_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_site_domains" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_site_domains_hostname" UNIQUE ("hostname"),
        CONSTRAINT "FK_site_domains_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "CHK_site_domains_hostname_format" CHECK (
          "hostname"::text = lower("hostname"::text)
          AND "hostname"::text ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$'
        ),
        CONSTRAINT "CHK_site_domains_status" CHECK ("status" IN ('active', 'disabled')),
        CONSTRAINT "CHK_site_domains_verified" CHECK ("verified_at" IS NULL OR "verified_at" >= "created_at")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_site_domains_primary_per_site" ON "site_domains" ("site_id") WHERE "is_primary"`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_site_domains_site" ON "site_domains" ("site_id")`);

    await queryRunner.query(`
      CREATE TABLE "user_role_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "scope_type" text NOT NULL,
        "site_id" uuid,
        "created_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_role_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_role_assignments_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_role_assignments_role_scope" FOREIGN KEY ("role_id", "scope_type")
          REFERENCES "roles" ("id", "scope_type") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_role_assignments_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "FK_user_role_assignments_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_user_role_assignments_scope" CHECK (
          ("scope_type" = 'platform' AND "site_id" IS NULL)
          OR ("scope_type" = 'site' AND "site_id" IS NOT NULL)
        )
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_role_assignments_platform" ON "user_role_assignments" ("user_id", "role_id") WHERE "site_id" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_role_assignments_site" ON "user_role_assignments" ("user_id", "role_id", "site_id") WHERE "site_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_role_assignments_user_site" ON "user_role_assignments" ("user_id", "site_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_role_assignments_site" ON "user_role_assignments" ("site_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_role_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "site_domains"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
