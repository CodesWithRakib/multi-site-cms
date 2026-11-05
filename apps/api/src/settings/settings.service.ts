import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  PlatformGeneralSettings,
  PlatformMaintenanceSettings,
  PlatformMediaSettings,
  PlatformPublishingSettings,
  PlatformSecuritySettings,
  PlatformSettings,
  PlatformSystemDiagnostics,
  PublicPlatformSettings,
} from '@multi-site-cms/types';
import { type DataSource, type Repository } from 'typeorm';

import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { env } from '../config/env';
import { DATA_SOURCE } from '../database/database.tokens';
import { getInitializedRepository } from '../database/ensure-connected';
import { PlatformSettingsEntity } from '../database/entities/platform-settings.entity';
import type { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { policyFromSettings, SAFE_DEFAULT_POLICY, type PlatformPolicy } from './platform-policy';

/** Settings change rarely; enforcement points read them on every login/upload. */
const POLICY_CACHE_MS = 15_000;

/**
 * Fields that were actually sent. Validated DTO instances can carry unset
 * optional fields as `undefined` own properties; spreading those would
 * erase stored values in a partial update.
 */
function definedOnly<T extends object>(section: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(section).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

interface CountResult {
  count?: string | number;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  private policyCache: { value: PlatformPolicy; expiresAt: number } | null = null;

  /**
   * The enforced policy derived from the stored settings (see platform-policy.ts).
   * Cached briefly; an update on this instance invalidates it at once (one API
   * instance, ADR-0028). If settings cannot be read, the safe defaults apply.
   */
  async getPolicy(): Promise<PlatformPolicy> {
    const now = Date.now();
    if (this.policyCache && this.policyCache.expiresAt > now) {
      return this.policyCache.value;
    }
    try {
      const value = policyFromSettings(await this.getPlatformSettings());
      this.policyCache = { value, expiresAt: now + POLICY_CACHE_MS };
      return value;
    } catch (err: unknown) {
      this.logger.error(
        `Platform settings unavailable; enforcing safe defaults: ${err instanceof Error ? err.message : String(err)}`,
      );
      return SAFE_DEFAULT_POLICY;
    }
  }

  private async getSettingsRepo(): Promise<Repository<PlatformSettingsEntity>> {
    return getInitializedRepository(this.dataSource, PlatformSettingsEntity);
  }

  /**
   * Retrieves full platform configuration.
   */
  async getPlatformSettings(): Promise<PlatformSettings> {
    const repo = await this.getSettingsRepo();
    let entity = await repo.findOne({ where: { id: 'default' } });

    if (!entity) {
      entity = repo.create({
        id: 'default',
        general: {
          platformName: 'Multi-Site CMS Enterprise',
          tagline: 'Centralized multi-tenant publication and content delivery platform',
          contactEmail: 'admin@platform.internal',
          defaultLocale: 'en',
          defaultTimezone: 'UTC',
        },
        security: {
          sessionTtlHours: 168,
          maxLoginAttempts: 5,
          lockoutDurationMinutes: 15,
          passwordMinLength: 8,
          requireStrongPasswords: true,
        },
        media: {
          maxUploadSizeBytes: 10485760,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/svg+xml',
            'application/pdf',
          ],
        },
        publishing: {
          defaultPostStatus: 'draft',
          autoSaveIntervalSeconds: 30,
          maxRevisionHistory: 25,
          previewTokenTtlMinutes: 60,
        },
        maintenance: {
          maintenanceMode: false,
          maintenanceNoticeEn:
            'The platform is currently undergoing scheduled maintenance. Please check back shortly.',
          maintenanceNoticeBn:
            'প্ল্যাটফর্মটি বর্তমানে নির্ধারিত রক্ষণাবেক্ষণের আওতায় রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          auditRetentionDays: 365,
        },
        updatedBy: null,
      });
      await repo.save(entity);
    }

    return this.mapEntityToSettings(entity);
  }

  /**
   * Updates platform configuration sections with audit logging.
   */
  async updatePlatformSettings(
    actor: EffectiveAuthContext,
    dto: UpdatePlatformSettingsDto,
    requestInfo?: { ipAddress?: string | null; requestId?: string | null },
  ): Promise<PlatformSettings> {
    const repo = await this.getSettingsRepo();
    const entity = await repo.findOne({ where: { id: 'default' } });

    if (!entity) {
      throw new NotFoundException('Platform settings record not found');
    }

    const updatedSections: string[] = [];

    if (dto.general) {
      entity.general = { ...entity.general, ...definedOnly(dto.general) };
      updatedSections.push('general');
    }
    if (dto.security) {
      entity.security = { ...entity.security, ...definedOnly(dto.security) };
      updatedSections.push('security');
    }
    if (dto.media) {
      entity.media = { ...entity.media, ...definedOnly(dto.media) };
      updatedSections.push('media');
    }
    if (dto.publishing) {
      entity.publishing = { ...entity.publishing, ...definedOnly(dto.publishing) };
      updatedSections.push('publishing');
    }
    if (dto.maintenance) {
      entity.maintenance = { ...entity.maintenance, ...definedOnly(dto.maintenance) };
      updatedSections.push('maintenance');
    }

    entity.updatedBy = actor.user.id;
    entity.updatedAt = new Date();

    const saved = await repo.save(entity);
    this.policyCache = null;

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId: null,
      action: 'platform.settings_updated',
      entityType: 'platform_settings',
      entityId: null,
      requestId: requestInfo?.requestId ?? null,
      ipAddress: requestInfo?.ipAddress ?? null,
      metadata: {
        settingId: 'default',
        updatedSections,
        actorEmail: actor.user.email,
      },
    });

    return this.mapEntityToSettings(saved);
  }

  /**
   * Public safe platform settings for consumer clients.
   */
  async getPublicSettings(): Promise<PublicPlatformSettings> {
    const settings = await this.getPlatformSettings();
    return {
      platformName: settings.general.platformName,
      tagline: settings.general.tagline,
      maintenanceMode: settings.maintenance.maintenanceMode,
      maintenanceNoticeEn: settings.maintenance.maintenanceNoticeEn,
      maintenanceNoticeBn: settings.maintenance.maintenanceNoticeBn,
      defaultLocale: settings.general.defaultLocale,
      defaultTimezone: settings.general.defaultTimezone,
    };
  }

  /**
   * Live operational diagnostics and infrastructure health telemetry.
   */
  async getDiagnostics(): Promise<PlatformSystemDiagnostics> {
    const startDb = Date.now();
    await this.dataSource.query('SELECT 1');
    const databaseLatencyMs = Date.now() - startDb;

    const [sitesCount, usersCount, postsCount, mediaCount]: [
      CountResult[],
      CountResult[],
      CountResult[],
      CountResult[],
    ] = await Promise.all([
      this.dataSource.query('SELECT count(*)::int as count FROM sites'),
      this.dataSource.query('SELECT count(*)::int as count FROM users'),
      this.dataSource.query('SELECT count(*)::int as count FROM posts WHERE deleted_at IS NULL'),
      this.dataSource.query('SELECT count(*)::int as count FROM media_assets'),
    ]);

    const memUsage = process.memoryUsage();
    const memoryUsageMb = Math.round(memUsage.heapUsed / 1024 / 1024);

    return {
      service: 'Multi-Site CMS Central Engine',
      nodeVersion: process.version,
      platform: process.platform,
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      databaseStatus: 'up',
      databaseLatencyMs,
      totalSites: Number(sitesCount[0]?.count ?? 0),
      totalUsers: Number(usersCount[0]?.count ?? 0),
      totalPosts: Number(postsCount[0]?.count ?? 0),
      totalMediaAssets: Number(mediaCount[0]?.count ?? 0),
      storageProvider: env.STORAGE_PROVIDER || 'cloudinary',
      memoryUsageMb,
    };
  }

  /**
   * Only the documented fields leave the service. Rows written by older
   * versions can still hold keys for features that were never built (MFA,
   * public registration, S3, WebP conversion); they are not exposed.
   */
  private mapEntityToSettings(entity: PlatformSettingsEntity): PlatformSettings {
    const general = entity.general as PlatformGeneralSettings;
    const security = entity.security as PlatformSecuritySettings;
    const media = entity.media as PlatformMediaSettings;
    const publishing = entity.publishing as PlatformPublishingSettings;
    const maintenance = entity.maintenance as PlatformMaintenanceSettings;
    return {
      id: entity.id,
      general: {
        platformName: general.platformName,
        tagline: general.tagline,
        contactEmail: general.contactEmail,
        defaultLocale: general.defaultLocale,
        defaultTimezone: general.defaultTimezone,
      },
      security: {
        sessionTtlHours: security.sessionTtlHours,
        maxLoginAttempts: security.maxLoginAttempts,
        lockoutDurationMinutes: security.lockoutDurationMinutes,
        passwordMinLength: security.passwordMinLength,
        requireStrongPasswords: security.requireStrongPasswords,
      },
      media: {
        maxUploadSizeBytes: media.maxUploadSizeBytes,
        allowedMimeTypes: media.allowedMimeTypes,
      },
      publishing: {
        defaultPostStatus: publishing.defaultPostStatus,
        autoSaveIntervalSeconds: publishing.autoSaveIntervalSeconds,
        maxRevisionHistory: publishing.maxRevisionHistory,
        previewTokenTtlMinutes: publishing.previewTokenTtlMinutes,
      },
      maintenance: {
        maintenanceMode: maintenance.maintenanceMode,
        maintenanceNoticeEn: maintenance.maintenanceNoticeEn,
        maintenanceNoticeBn: maintenance.maintenanceNoticeBn,
        auditRetentionDays: maintenance.auditRetentionDays,
      },
      updatedAt: entity.updatedAt.toISOString(),
      updatedBy: entity.updatedBy,
    };
  }
}
