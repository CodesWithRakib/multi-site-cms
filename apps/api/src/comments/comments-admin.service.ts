import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type {
  AdminCommentItem,
  AdminCommentsCounts,
  AdminCommentsListResult,
} from '@multi-site-cms/types';
import { DataSource, In } from 'typeorm';

import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { ApiException } from '../common/exceptions/api.exception';
import { AuditService } from '../common/audit/audit.service';
import { DATA_SOURCE } from '../database/database.tokens';
import { PostComment, type PostCommentStatus } from '../database/entities/post-comment.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { PostRevision } from '../database/entities/post-revision.entity';
import { Site } from '../database/entities/site.entity';
import { getInitializedRepository } from '../database/ensure-connected';
import type { BatchUpdateCommentsDto } from './dto/batch-update-comments.dto';
import type { ListAdminCommentsQueryDto } from './dto/list-admin-comments-query.dto';

interface CommentRawRow {
  id: string;
  siteId: string;
  siteName: string;
  siteKey: string;
  publicationId: string;
  publicationSlug: string;
  publicationTitle: string | null;
  authorName: string;
  authorEmail: string;
  content: string;
  rating: number | null;
  status: PostCommentStatus;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CommentsAdminService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Comments are site-owned (SEC-12). Super Admins see every site; everyone
   * else only the sites they are assigned to. Out-of-scope ids answer 404.
   */
  private assertCommentAccess(actor: EffectiveAuthContext, comment: PostComment): void {
    if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(comment.siteId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }
  }

  async listComments(
    actor: EffectiveAuthContext,
    query: ListAdminCommentsQueryDto,
  ): Promise<AdminCommentsListResult> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const offset = (page - 1) * limit;

    const commentRepo = await getInitializedRepository(this.dataSource, PostComment);

    const baseQb = commentRepo
      .createQueryBuilder('c')
      .leftJoin(Site, 's', 's.id = c.site_id')
      .leftJoin(PostPublication, 'pub', 'pub.id = c.publication_id')
      .leftJoin(PostRevision, 'rev', 'rev.id = pub.revision_id');

    if (!actor.isSuperAdmin) {
      // An empty IN () is invalid SQL; an admin without sites matches nothing.
      baseQb.andWhere(
        actor.authorizedSiteIds.length > 0 ? 'c.site_id IN (:...scopeSiteIds)' : '1 = 0',
        { scopeSiteIds: actor.authorizedSiteIds },
      );
    }

    if (query.siteId) {
      baseQb.andWhere('c.site_id = :siteId', { siteId: query.siteId });
    }

    if (query.publicationId) {
      baseQb.andWhere('c.publication_id = :pubId', { pubId: query.publicationId });
    }

    if (query.search && query.search.trim()) {
      baseQb.andWhere(
        '(c.author_name ILIKE :search OR c.author_email ILIKE :search OR c.content ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    }

    // Clone query for status counts
    const countQb = baseQb.clone();
    const countRows = await countQb
      .select(['c.status AS status', 'COUNT(c.id) AS count'])
      .groupBy('c.status')
      .getRawMany<{ status: PostCommentStatus; count: string }>();

    const counts: AdminCommentsCounts = {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      spam: 0,
    };

    for (const r of countRows) {
      const num = Number.parseInt(r.count, 10) || 0;
      counts.all += num;
      if (r.status in counts) {
        counts[r.status] = num;
      }
    }

    // Apply status filter if specific status requested
    if (query.status && query.status !== 'all') {
      baseQb.andWhere('c.status = :status', { status: query.status });
    }

    const totalFiltered =
      query.status && query.status !== 'all' ? counts[query.status] : counts.all;

    const rawItems = await baseQb
      .select([
        'c.id AS id',
        'c.site_id AS "siteId"',
        's.name AS "siteName"',
        's.key AS "siteKey"',
        'c.publication_id AS "publicationId"',
        'pub.slug AS "publicationSlug"',
        'COALESCE(rev.title, pub.slug) AS "publicationTitle"',
        'c.author_name AS "authorName"',
        'c.author_email AS "authorEmail"',
        'c.content AS content',
        'c.rating AS rating',
        'c.status AS status',
        'c.parent_id AS "parentId"',
        'c.created_at AS "createdAt"',
        'c.updated_at AS "updatedAt"',
      ])
      .orderBy('c.created_at', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<CommentRawRow>();

    const items: AdminCommentItem[] = rawItems.map((r) => ({
      id: r.id,
      siteId: r.siteId,
      siteName: r.siteName || 'Unknown Site',
      siteKey: r.siteKey || '',
      publicationId: r.publicationId,
      publicationSlug: r.publicationSlug || '',
      publicationTitle: r.publicationTitle || 'Untitled Publication',
      authorName: r.authorName,
      authorEmail: r.authorEmail,
      content: r.content,
      rating: r.rating,
      status: r.status,
      parentId: r.parentId,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    }));

    return {
      items,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalFiltered / limit)),
      },
      counts,
    };
  }

  async updateCommentStatus(
    actor: EffectiveAuthContext,
    id: string,
    status: PostCommentStatus,
  ): Promise<AdminCommentItem> {
    const actorId = actor.user.id;
    const commentRepo = await getInitializedRepository(this.dataSource, PostComment);
    const comment = await commentRepo.findOne({ where: { id } });

    if (!comment) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }
    this.assertCommentAccess(actor, comment);

    comment.status = status;
    comment.updatedAt = new Date();
    await commentRepo.save(comment);

    await this.auditService.record({
      actorType: actorId ? 'user' : 'system',
      actorId: actorId ?? null,
      siteId: comment.siteId,
      action: 'comment.status_updated',
      entityType: 'post_comment',
      entityId: comment.id,
      metadata: { status },
    });

    const res = await this.listComments(actor, {
      siteId: comment.siteId,
      search: comment.id,
      limit: 1,
    });
    const found = res.items.find((i) => i.id === comment.id);
    if (!found) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }
    return found;
  }

  async batchUpdateStatus(
    actor: EffectiveAuthContext,
    dto: BatchUpdateCommentsDto,
  ): Promise<{ updatedCount: number }> {
    const actorId = actor.user.id;
    const commentRepo = await getInitializedRepository(this.dataSource, PostComment);

    // All-or-nothing: one out-of-scope (or unknown) id rejects the whole batch,
    // so a caller cannot probe which ids exist on other sites.
    const targets = await commentRepo.find({
      where: { id: In(dto.ids) },
      select: { id: true, siteId: true },
    });
    if (targets.length !== new Set(dto.ids).size) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }
    for (const target of targets) {
      this.assertCommentAccess(actor, target);
    }

    const result = await commentRepo
      .createQueryBuilder()
      .update(PostComment)
      .set({ status: dto.status, updatedAt: new Date() })
      .where({ id: In(dto.ids) })
      .execute();

    const count = result.affected ?? 0;

    await this.auditService.record({
      actorType: actorId ? 'user' : 'system',
      actorId: actorId ?? null,
      action: 'comment.batch_status_updated',
      entityType: 'post_comment',
      metadata: { ids: dto.ids, status: dto.status, count },
    });

    return { updatedCount: count };
  }

  async deleteComment(actor: EffectiveAuthContext, id: string): Promise<void> {
    const actorId = actor.user.id;
    const commentRepo = await getInitializedRepository(this.dataSource, PostComment);
    const comment = await commentRepo.findOne({ where: { id } });

    if (!comment) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }
    this.assertCommentAccess(actor, comment);

    await commentRepo.delete(id);

    await this.auditService.record({
      actorType: actorId ? 'user' : 'system',
      actorId: actorId ?? null,
      siteId: comment.siteId,
      action: 'comment.deleted',
      entityType: 'post_comment',
      entityId: id,
    });
  }
}
