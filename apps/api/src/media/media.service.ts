import crypto from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type DataSource, type Repository } from 'typeorm';

import type { MediaAssetItem, MediaUploadResponse, PaginatedResult } from '@multi-site-cms/types';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { DATA_SOURCE } from '../database/database.tokens';
import { getInitializedRepository } from '../database/ensure-connected';
import { MediaAsset } from '../database/entities/media-asset.entity';
import { PostPublicationMedia } from '../database/entities/post-publication-media.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { CreateMediaDto, ListMediaQueryDto, UpdateMediaDto, UploadMediaDto } from './dto';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
  type UploadedFilePayload,
} from './storage/storage-provider.interface';
import { SettingsService } from '../settings/settings.service';
import { env } from '../config/env';
import { detachMediaEverywhere } from './media-usage-cleanup';
import { publicMediaUrl } from './public-media-url';
import { validateAndInspectFile } from './utils/file-validator';

@Injectable()
export class MediaService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getMediaRepo(): Promise<Repository<MediaAsset>> {
    return getInitializedRepository(this.dataSource, MediaAsset);
  }

  private async getPublicationRepo(): Promise<Repository<PostPublication>> {
    return getInitializedRepository(this.dataSource, PostPublication);
  }

  private async getPublicationMediaRepo(): Promise<Repository<PostPublicationMedia>> {
    return getInitializedRepository(this.dataSource, PostPublicationMedia);
  }

  private checkSiteAccess(actor: EffectiveAuthContext, siteId: string | null | undefined): void {
    if (!siteId) {
      if (!actor.isSuperAdmin) {
        throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'http.forbidden');
      }
      return;
    }

    if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(siteId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }
  }

  async createMedia(actor: EffectiveAuthContext, dto: CreateMediaDto): Promise<MediaAssetItem> {
    this.checkSiteAccess(actor, dto.siteId);

    const mime = dto.mimeType.toLowerCase().trim();
    // Platform settings (Media → allowed types), already narrowed to the code allowlist.
    const { media: policy } = await this.settingsService.getPolicy();
    if (!policy.allowedMimeTypes.includes(mime)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'media.typeNotAllowed');
    }

    const storageKey =
      dto.storageKey?.trim() || `${dto.siteId ?? 'platform'}/${crypto.randomUUID()}-${Date.now()}`;

    const checksum =
      dto.checksum?.trim() || crypto.createHash('sha256').update(storageKey).digest('hex');

    const byteSize = String(dto.byteSize);
    const mediaRepo = await this.getMediaRepo();

    const asset = mediaRepo.create({
      siteId: dto.siteId || null,
      uploadedBy: actor.user.id,
      storageProvider: dto.storageProvider?.trim() || 'local',
      storageKey,
      originalFilename: dto.originalFilename?.trim() || null,
      mimeType: mime,
      byteSize,
      checksum,
      width: dto.width ?? null,
      height: dto.height ?? null,
      altText: dto.altText?.trim() || null,
      caption: dto.caption?.trim() || null,
      status: 'active',
      deletedAt: null,
    });

    const saved = await mediaRepo.save(asset);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId: saved.siteId ?? null,
      action: 'media.create',
      entityType: 'media_asset',
      entityId: saved.id,
      metadata: {
        mimeType: saved.mimeType,
        originalFilename: saved.originalFilename,
        storageKey: saved.storageKey,
      },
    });

    return this.mapToItem(saved);
  }

  async listMedia(
    actor: EffectiveAuthContext,
    query: ListMediaQueryDto,
  ): Promise<PaginatedResult<MediaAssetItem>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const mediaRepo = await this.getMediaRepo();
    const qb = mediaRepo
      .createQueryBuilder('m')
      .where('m.deleted_at IS NULL')
      .orderBy('m.created_at', 'DESC');

    if (query.siteId) {
      this.checkSiteAccess(actor, query.siteId);
      qb.andWhere('m.site_id = :siteId', { siteId: query.siteId });
    } else if (!actor.isSuperAdmin) {
      if (actor.authorizedSiteIds.length === 0) {
        return { items: [], total: 0, page, limit, totalPages: 1 };
      }
      qb.andWhere('m.site_id IN (:...siteIds)', { siteIds: actor.authorizedSiteIds });
    }

    if (query.mimeType) {
      qb.andWhere('m.mime_type ILIKE :mime', { mime: `${query.mimeType.trim()}%` });
    }

    if (query.search) {
      qb.andWhere(
        '(m.original_filename ILIKE :search OR m.alt_text ILIKE :search OR m.caption ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items: items.map((m) => this.mapToItem(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getMedia(actor: EffectiveAuthContext, mediaId: string): Promise<MediaAssetItem> {
    const mediaRepo = await this.getMediaRepo();
    const asset = await mediaRepo.findOne({
      where: { id: mediaId },
    });

    if (!asset || asset.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'media.notFound');
    }

    this.checkSiteAccess(actor, asset.siteId);

    return this.mapToItem(asset);
  }

  async updateMedia(
    actor: EffectiveAuthContext,
    mediaId: string,
    dto: UpdateMediaDto,
  ): Promise<MediaAssetItem> {
    const mediaRepo = await this.getMediaRepo();
    const asset = await mediaRepo.findOne({
      where: { id: mediaId },
    });

    if (!asset || asset.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'media.notFound');
    }

    this.checkSiteAccess(actor, asset.siteId);

    if (dto.altText !== undefined) {
      asset.altText = dto.altText?.trim() || null;
    }
    if (dto.caption !== undefined) {
      asset.caption = dto.caption?.trim() || null;
    }
    if (dto.originalFilename !== undefined) {
      asset.originalFilename = dto.originalFilename?.trim() || null;
    }

    const saved = await mediaRepo.save(asset);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId: saved.siteId ?? null,
      action: 'media.update',
      entityType: 'media_asset',
      entityId: saved.id,
      metadata: { originalFilename: saved.originalFilename },
    });

    return this.mapToItem(saved);
  }

  /**
   * Deletes a media asset for good: every place it is used is cleaned up
   * first (featured images, inline images, avatars via FK), then the row is
   * removed and the file is deleted from storage. External URLs registered
   * as media (e.g. Unsplash) have no file of ours to delete.
   */
  async deleteMedia(actor: EffectiveAuthContext, mediaId: string): Promise<void> {
    const mediaRepo = await this.getMediaRepo();
    const asset = await mediaRepo.findOne({ where: { id: mediaId } });

    if (!asset || asset.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'media.notFound');
    }

    this.checkSiteAccess(actor, asset.siteId);

    // Every URL form an editor may have embedded for this asset.
    const urls = new Set([
      asset.storageKey,
      this.storageProvider.getUrl(asset.storageKey),
      publicMediaUrl(asset.storageKey, env.API_BASE_URL),
    ]);

    const report = await this.dataSource.transaction(async (manager) => {
      const cleanup = await detachMediaEverywhere(manager, asset.id, urls, actor.user.id);
      // users.avatar_media_id is ON DELETE SET NULL.
      await manager.getRepository(MediaAsset).delete({ id: asset.id });
      return cleanup;
    });

    if (this.ownsStoredFile(asset.storageKey)) {
      // After commit: a failure here leaves an orphan file, never broken content.
      await this.storageProvider.delete(asset.storageKey);
    }

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId: asset.siteId ?? null,
      action: 'media.delete',
      entityType: 'media_asset',
      entityId: asset.id,
      metadata: { storageKey: asset.storageKey, ...report },
    });
  }

  /** True for files in our own storage (local keys or our Cloudinary account). */
  private ownsStoredFile(storageKey: string): boolean {
    if (!storageKey.startsWith('http://') && !storageKey.startsWith('https://')) return true;
    return storageKey.includes('res.cloudinary.com/');
  }

  async uploadMedia(
    actor: EffectiveAuthContext,
    file: UploadedFilePayload,
    dto: UploadMediaDto,
  ): Promise<MediaUploadResponse> {
    if (!file || !file.buffer) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'media.fileRequired');
    }

    this.checkSiteAccess(actor, dto.siteId);

    // Platform settings (Media → maximum upload size and allowed types).
    const { media: policy } = await this.settingsService.getPolicy();
    if (file.size > policy.maxUploadBytes) {
      throw new ApiException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        'PAYLOAD_TOO_LARGE',
        'media.fileTooLarge',
      );
    }

    const inspection = validateAndInspectFile(file.buffer, file.mimetype);
    if (!inspection.isValid || !inspection.detectedMimeType) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'media.invalidFileSignature',
      );
    }

    const finalBuffer = inspection.sanitizedBuffer ?? file.buffer;
    const finalMime = inspection.detectedMimeType;

    // Checked on the type detected from the file signature, not the client's claim.
    if (!policy.allowedMimeTypes.includes(finalMime)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'media.typeNotAllowed');
    }

    const extMatch = (file.originalname || '').match(/\.([a-zA-Z0-9]+)$/);
    let ext = extMatch && extMatch[1] ? extMatch[1].toLowerCase() : '';
    if (!ext) {
      if (finalMime === 'image/jpeg') ext = 'jpg';
      else if (finalMime === 'image/png') ext = 'png';
      else if (finalMime === 'image/webp') ext = 'webp';
      else if (finalMime === 'image/gif') ext = 'gif';
      else if (finalMime === 'image/svg+xml') ext = 'svg';
      else if (finalMime === 'application/pdf') ext = 'pdf';
      else if (finalMime === 'video/mp4') ext = 'mp4';
      else ext = 'bin';
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const storageKey = `${dto.siteId ?? 'platform'}/${year}/${month}/${crypto.randomUUID()}.${ext}`;

    const uploadResult = await this.storageProvider.upload(storageKey, finalBuffer, finalMime);

    const mediaRepo = await this.getMediaRepo();
    const asset = mediaRepo.create({
      siteId: dto.siteId || null,
      uploadedBy: actor.user.id,
      storageProvider: this.storageProvider.name,
      storageKey: uploadResult.key,
      originalFilename: file.originalname || null,
      mimeType: finalMime,
      byteSize: String(uploadResult.byteSize),
      checksum: uploadResult.checksum,
      width: inspection.width ?? null,
      height: inspection.height ?? null,
      altText: dto.altText?.trim() || null,
      caption: dto.caption?.trim() || null,
      status: 'active',
      deletedAt: null,
    });

    const saved = await mediaRepo.save(asset);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId: saved.siteId ?? null,
      action: 'media.upload',
      entityType: 'media_asset',
      entityId: saved.id,
      metadata: {
        originalFilename: saved.originalFilename,
        mimeType: saved.mimeType,
        byteSize: saved.byteSize,
        storageKey: saved.storageKey,
      },
    });

    const item = this.mapToItem(saved);
    return {
      media: item,
      url: this.storageProvider.getUrl(saved.storageKey),
    };
  }

  async getMediaStream(storageKey: string): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string;
    byteSize: string;
    filename: string | null;
  }> {
    const mediaRepo = await this.getMediaRepo();
    const asset = await mediaRepo.findOne({
      where: { storageKey },
    });

    if (!asset || asset.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'media.notFound');
    }

    const stream = await this.storageProvider.getStream(storageKey);
    return {
      stream,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      filename: asset.originalFilename,
    };
  }

  private mapToItem(asset: MediaAsset): MediaAssetItem {
    return {
      id: asset.id,
      siteId: asset.siteId,
      uploadedBy: asset.uploadedBy,
      storageProvider: asset.storageProvider,
      storageKey: asset.storageKey,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      checksum: asset.checksum,
      width: asset.width,
      height: asset.height,
      altText: asset.altText,
      caption: asset.caption,
      status: asset.status,
      url: this.storageProvider.getUrl(asset.storageKey),
      deletedAt: asset.deletedAt ? asset.deletedAt.toISOString() : null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };
  }
}
