import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 1793491208000:
 * Creates the platform_settings table and seeds default operational configuration.
 */
export class PlatformSettingsRegistry1793491208000 implements MigrationInterface {
  name = 'PlatformSettingsRegistry1793491208000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "platform_settings" (
        "id" varchar(64) PRIMARY KEY DEFAULT 'default',
        "general" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "security" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "media" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "publishing" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "maintenance" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "updated_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_platform_settings_user" FOREIGN KEY ("updated_by")
          REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);

    // Seed initial default singleton platform settings
    const defaultGeneral = JSON.stringify({
      platformName: 'Multi-Site CMS Enterprise',
      tagline: 'Centralized multi-tenant publication and content delivery platform',
      contactEmail: 'admin@platform.internal',
      defaultLocale: 'en',
      defaultTimezone: 'UTC',
    });

    const defaultSecurity = JSON.stringify({
      sessionTtlHours: 168,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      passwordMinLength: 8,
      requireStrongPasswords: true,
      enforceMfaForSuperAdmin: false,
      allowPublicRegistration: false,
    });

    const defaultMedia = JSON.stringify({
      storageProvider: 'cloudinary',
      maxUploadSizeBytes: 10485760,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'application/pdf',
      ],
      autoWebpConversion: true,
    });

    const defaultPublishing = JSON.stringify({
      defaultPostStatus: 'draft',
      autoSaveIntervalSeconds: 30,
      maxRevisionHistory: 25,
      previewTokenTtlMinutes: 60,
    });

    const defaultMaintenance = JSON.stringify({
      maintenanceMode: false,
      maintenanceNoticeEn:
        'The platform is currently undergoing scheduled maintenance. Please check back shortly.',
      maintenanceNoticeBn:
        'প্ল্যাটফর্মটি বর্তমানে নির্ধারিত রক্ষণাবেক্ষণের আওতায় রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
      auditRetentionDays: 365,
    });

    await queryRunner.query(
      `
      INSERT INTO "platform_settings" (
        "id", "general", "security", "media", "publishing", "maintenance"
      ) VALUES ('default', $1, $2, $3, $4, $5)
      ON CONFLICT ("id") DO NOTHING;
    `,
      [defaultGeneral, defaultSecurity, defaultMedia, defaultPublishing, defaultMaintenance],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings"`);
  }
}
