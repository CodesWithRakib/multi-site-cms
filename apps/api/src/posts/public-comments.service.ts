import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { PublicCommentItem, PublicCommentsResult } from '@multi-site-cms/types';
import { DataSource } from 'typeorm';

import { ApiException } from '../common/exceptions/api.exception';
import { AuditService } from '../common/audit/audit.service';
import { DATA_SOURCE } from '../database/database.tokens';
import { PostComment, type PostCommentStatus } from '../database/entities/post-comment.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { Site } from '../database/entities/site.entity';
import { getInitializedRepository } from '../database/ensure-connected';
import type { CreatePublicCommentDto } from './dto/create-public-comment.dto';

@Injectable()
export class PublicCommentsService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  private async resolveSiteAndPublication(
    siteKey: string,
    slug: string,
  ): Promise<{ site: Site; publication: PostPublication }> {
    const siteRepo = await getInitializedRepository(this.dataSource, Site);
    const site = await siteRepo.findOne({
      where: { key: siteKey.toLowerCase().trim(), status: 'active' },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    const pubRepo = await getInitializedRepository(this.dataSource, PostPublication);
    const pub = await pubRepo.findOne({
      where: { siteId: site.id, slug, status: 'published' },
    });

    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    return { site, publication: pub };
  }

  async listComments(siteKey: string, slug: string): Promise<PublicCommentsResult> {
    const { site, publication } = await this.resolveSiteAndPublication(siteKey, slug);
    const commentRepo = await getInitializedRepository(this.dataSource, PostComment);

    const comments = await commentRepo.find({
      where: {
        siteId: site.id,
        publicationId: publication.id,
        status: 'approved',
      },
      order: { createdAt: 'ASC' },
    });

    // Compute average rating
    const rated = comments.filter((c) => typeof c.rating === 'number' && c.rating > 0);
    const averageRating = rated.length > 0
      ? Math.round((rated.reduce((acc, curr) => acc + (curr.rating ?? 0), 0) / rated.length) * 10) / 10
      : null;

    // Nest threaded replies
    const rootComments: PublicCommentItem[] = [];
    const commentMap = new Map<string, PublicCommentItem>();

    for (const c of comments) {
      const item: PublicCommentItem = {
        id: c.id,
        authorName: c.authorName,
        content: c.content,
        rating: c.rating,
        createdAt: c.createdAt.toISOString(),
        parentId: c.parentId,
        replies: [],
      };
      commentMap.set(c.id, item);
    }

    for (const c of comments) {
      const item = commentMap.get(c.id);
      if (!item) continue;

      if (c.parentId && commentMap.has(c.parentId)) {
        const parent = commentMap.get(c.parentId);
        parent?.replies?.push(item);
      } else {
        rootComments.push(item);
      }
    }

    // Newest first for top-level comments
    rootComments.reverse();

    return {
      items: rootComments,
      total: comments.length,
      averageRating,
    };
  }

  async createComment(
    siteKey: string,
    slug: string,
    dto: CreatePublicCommentDto,
    requestInfo?: { ipAddress?: string | null; requestId?: string | null },
  ): Promise<PublicCommentItem> {
    const { site, publication } = await this.resolveSiteAndPublication(siteKey, slug);
    const commentRepo = await getInitializedRepository(this.dataSource, PostComment);

    // Spam honeypot trap
    const isSpam = Boolean(dto.website_url && dto.website_url.trim().length > 0);
    const status: PostCommentStatus = isSpam ? 'spam' : 'approved';

    let parentId: string | null = null;
    if (dto.parentId) {
      const parent = await commentRepo.findOne({
        where: { id: dto.parentId, publicationId: publication.id, status: 'approved' },
      });
      if (parent) {
        parentId = parent.id;
      }
    }

    const comment = commentRepo.create({
      siteId: site.id,
      publicationId: publication.id,
      authorName: dto.authorName.trim(),
      authorEmail: dto.authorEmail.trim(),
      content: dto.content.trim(),
      rating: dto.rating ?? null,
      status,
      parentId,
    });

    const saved = await commentRepo.save(comment);

    await this.auditService.record({
      actorType: 'system',
      siteId: site.id,
      action: 'comment.created',
      entityType: 'post_comment',
      entityId: saved.id,
      requestId: requestInfo?.requestId ?? null,
      ipAddress: requestInfo?.ipAddress ?? null,
      metadata: {
        publicationId: publication.id,
        slug,
        status,
        hasRating: Boolean(dto.rating),
      },
    });

    return {
      id: saved.id,
      authorName: saved.authorName,
      content: saved.content,
      rating: saved.rating,
      createdAt: saved.createdAt.toISOString(),
      parentId: saved.parentId,
      replies: [],
    };
  }
}
