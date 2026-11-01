import crypto from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type DataSource, type Repository } from 'typeorm';

import type { MediaAssetItem, PaginatedResult } from '@multi-site-cms/types';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { DATA_SOURCE } from '../database/database.tokens';
import { getInitializedRepository } from '../database/ensure-connected';
import { MediaAsset } from '../database/entities/media-asset.entity';
import { PostPublicationMedia } from '../database/entities/post-publication-media.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { CreateMediaDto, ListMediaQueryDto, UpdateMediaDto } from './dto';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
]);

@Injectable()
export class MediaService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
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
    if (!ALLOWED_MIME_TYPES.has(mime) && !mime.startsWith('image/')) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'media.invalidMimeType');
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

  async deleteMedia(actor: EffectiveAuthContext, mediaId: string): Promise<void> {
    const mediaRepo = await this.getMediaRepo();
    const publicationRepo = await this.getPublicationRepo();
    const pubMediaRepo = await this.getPublicationMediaRepo();

    const asset = await mediaRepo.findOne({
      where: { id: mediaId },
    });

    if (!asset || asset.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'media.notFound');
    }

    this.checkSiteAccess(actor, asset.siteId);

    // Check if in use as featured image
    const featuredUsage = await publicationRepo.count({
      where: { featuredImageId: mediaId },
    });
    if (featuredUsage > 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'media.cannotDeleteInUse');
    }

    // Check if in use in publication media gallery/inline
    const galleryUsage = await pubMediaRepo.count({
      where: { mediaId },
    });
    if (galleryUsage > 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'media.cannotDeleteInUse');
    }

    asset.deletedAt = new Date();
    asset.status = 'archived';
    await mediaRepo.save(asset);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId: asset.siteId ?? null,
      action: 'media.delete',
      entityType: 'media_asset',
      entityId: asset.id,
      metadata: { storageKey: asset.storageKey },
    });
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
      deletedAt: asset.deletedAt ? asset.deletedAt.toISOString() : null,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };
  }
}
