import crypto from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  In,
  type DataSource,
  type EntityManager,
  type Repository,
  type SelectQueryBuilder,
} from 'typeorm';

import type {
  PaginatedResult,
  PostItem,
  PostPreviewData,
  PostRevisionItem,
  PostStatusCounts,
  PreviewTokenResponse,
} from '@multi-site-cms/types';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { env } from '../config/env';
import { DATA_SOURCE } from '../database/database.tokens';
import { getInitializedRepository } from '../database/ensure-connected';
import { Event } from '../database/entities/event.entity';
import { PostPublicationCategory } from '../database/entities/post-publication-category.entity';
import { PostPublicationTag } from '../database/entities/post-publication-tag.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { PostRevision } from '../database/entities/post-revision.entity';
import { Post } from '../database/entities/post.entity';
import { Site } from '../database/entities/site.entity';
import { SettingsService } from '../settings/settings.service';
import { CreatePostDto, ListPostsQueryDto, RestoreRevisionDto, UpdatePostDto } from './dto';
import { validateStructuredBody } from './utils/body-validator';
import {
  effectiveStatusSql,
  isPostStatsStatus,
  POST_STATS_STATUSES,
  type PostStatsStatus,
} from './utils/effective-status';
import { canAccessPost, canManageAllPublications } from './utils/post-access';

/**
 * Production requires PREVIEW_TOKEN_SECRET (enforced by `parseEnv`). Elsewhere a
 * random per-process key keeps tokens unforgeable; they simply stop validating
 * after a restart, which is acceptable for 15-minute development previews.
 */
const PREVIEW_TOKEN_SECRET = env.PREVIEW_TOKEN_SECRET ?? crypto.randomBytes(32).toString('hex');

function isSignatureValid(actualHex: string, expectedHex: string): boolean {
  const actual = Buffer.from(actualHex, 'utf8');
  const expected = Buffer.from(expectedHex, 'utf8');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

@Injectable()
export class PostsService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Platform settings (Publishing → revision history): keeps the newest N
   * revisions of a post. A revision that any publication points to is never
   * removed (and the foreign key would refuse it anyway), so live content and
   * scheduled content always keep their snapshot.
   */
  private async pruneRevisionHistory(manager: EntityManager, postId: string): Promise<void> {
    const { publishing } = await this.settingsService.getPolicy();
    await manager.query(
      `DELETE FROM "post_revisions" r
        WHERE r."post_id" = $1
          AND r."revision_number" <= (
            SELECT MAX("revision_number") FROM "post_revisions" WHERE "post_id" = $1
          ) - $2
          AND NOT EXISTS (
            SELECT 1 FROM "post_publications" pp WHERE pp."revision_id" = r."id"
          )`,
      [postId, publishing.maxRevisionHistory],
    );
  }

  private async getPostRepo(): Promise<Repository<Post>> {
    return getInitializedRepository(this.dataSource, Post);
  }

  private async getRevisionRepo(): Promise<Repository<PostRevision>> {
    return getInitializedRepository(this.dataSource, PostRevision);
  }

  private async getPublicationRepo(): Promise<Repository<PostPublication>> {
    return getInitializedRepository(this.dataSource, PostPublication);
  }

  async createPost(actor: EffectiveAuthContext, dto: CreatePostDto): Promise<PostItem> {
    const bodyValidation = validateStructuredBody(dto.body);
    if (!bodyValidation.isValid) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'post.invalidBody');
    }

    if (dto.publications && dto.publications.length > 0) {
      for (const pub of dto.publications) {
        if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(pub.siteId)) {
          throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
        }
        if (pub.eventId) {
          const eventRepo = await getInitializedRepository(this.dataSource, Event);
          if (!(await eventRepo.exists({ where: { id: pub.eventId, siteId: pub.siteId } }))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, 'NOT_FOUND', 'event.notFound');
          }
        }
      }
    }

    const defaultPostStatus = (await this.settingsService.getPolicy()).publishing.defaultPostStatus;

    return this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const revRepo = manager.getRepository(PostRevision);
      const pubRepo = manager.getRepository(PostPublication);
      const pubCatRepo = manager.getRepository(PostPublicationCategory);
      const pubTagRepo = manager.getRepository(PostPublicationTag);

      const post = postRepo.create({
        authorId: actor.user.id,
        type: dto.type ?? 'article',
        // Platform settings (Publishing → default status) when none is given.
        status: dto.status ?? defaultPostStatus,
        sourceLocale: dto.sourceLocale?.trim() || 'en',
        deletedAt: null,
      });
      const savedPost = await postRepo.save(post);

      const revision = revRepo.create({
        postId: savedPost.id,
        revisionNumber: 1,
        title: dto.title.trim(),
        excerpt: dto.excerpt?.trim() || null,
        body: dto.body,
        changeSummary: dto.changeSummary?.trim() || 'Initial revision',
        createdBy: actor.user.id,
      });
      const savedRev = await revRepo.save(revision);

      const publications: PostPublication[] = [];
      if (dto.publications && dto.publications.length > 0) {
        for (const pubDto of dto.publications) {
          const pub = pubRepo.create({
            siteId: pubDto.siteId,
            postId: savedPost.id,
            revisionId: savedRev.id,
            slug: pubDto.slug.trim().toLowerCase(),
            status: pubDto.status ?? 'draft',
            seoTitle: pubDto.seoTitle?.trim() || null,
            seoDescription: pubDto.seoDescription?.trim() || null,
            canonicalUrl: pubDto.canonicalUrl?.trim() || null,
            featuredImageId: pubDto.featuredImageId || null,
            eventId: pubDto.eventId || null,
            templateKey: pubDto.templateKey?.trim() || null,
            scheduledFor: pubDto.scheduledFor ? new Date(pubDto.scheduledFor) : null,
            publishedAt:
              pubDto.status === 'published'
                ? pubDto.publishedAt
                  ? new Date(pubDto.publishedAt)
                  : new Date()
                : null,
          });
          const savedPub = await pubRepo.save(pub);

          if (pubDto.categoryIds && pubDto.categoryIds.length > 0) {
            for (const catId of pubDto.categoryIds) {
              await pubCatRepo.save(
                pubCatRepo.create({
                  publicationId: savedPub.id,
                  categoryId: catId,
                  siteId: pubDto.siteId,
                }),
              );
            }
          }

          if (pubDto.tagIds && pubDto.tagIds.length > 0) {
            for (const tagId of pubDto.tagIds) {
              await pubTagRepo.save(
                pubTagRepo.create({
                  publicationId: savedPub.id,
                  tagId,
                  siteId: pubDto.siteId,
                }),
              );
            }
          }

          publications.push(savedPub);
        }
      }

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        action: 'post.create',
        entityType: 'post',
        entityId: savedPost.id,
        metadata: {
          title: savedRev.title,
          type: savedPost.type,
          revisionNumber: 1,
        },
      });

      return {
        id: savedPost.id,
        authorId: savedPost.authorId,
        type: savedPost.type,
        status: savedPost.status,
        sourceLocale: savedPost.sourceLocale,
        deletedAt: null,
        createdAt: savedPost.createdAt.toISOString(),
        updatedAt: savedPost.updatedAt.toISOString(),
        currentRevisionNumber: 1,
        currentRevision: this.mapRevisionToItem(savedRev),
        publications: publications.map((p) => ({
          id: p.id,
          siteId: p.siteId,
          postId: p.postId,
          revisionId: p.revisionId,
          slug: p.slug,
          status: p.status,
          scheduledFor: p.scheduledFor ? p.scheduledFor.toISOString() : null,
          publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          canonicalUrl: p.canonicalUrl,
          featuredImageId: p.featuredImageId,
          templateKey: p.templateKey,
          eventId: p.eventId,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      };
    });
  }

  /**
   * Posts the actor may see, with every list filter except status and paging
   * applied. Shared by the list and the status counts so both see one scope.
   */
  private async scopedPostsQuery(
    actor: EffectiveAuthContext,
    query: Pick<
      ListPostsQueryDto,
      'type' | 'authorId' | 'siteId' | 'search' | 'startDate' | 'endDate'
    >,
  ): Promise<SelectQueryBuilder<Post>> {
    const postRepo = await this.getPostRepo();
    const qb = postRepo.createQueryBuilder('p').where('p.deleted_at IS NULL');

    if (!actor.isSuperAdmin) {
      if (actor.authorizedSiteIds.length > 0) {
        qb.andWhere(
          '(p.author_id = :authorId OR EXISTS (SELECT 1 FROM post_publications pp WHERE pp.post_id = p.id AND pp.site_id IN (:...siteIds)))',
          { authorId: actor.user.id, siteIds: actor.authorizedSiteIds },
        );
      } else {
        qb.andWhere('p.author_id = :authorId', { authorId: actor.user.id });
      }
    }

    if (query.type) {
      qb.andWhere('p.type = :type', { type: query.type });
    }

    if (query.authorId) {
      qb.andWhere('p.author_id = :filterAuthor', { filterAuthor: query.authorId });
    }

    if (query.siteId) {
      if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(query.siteId)) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
      }
      qb.andWhere(
        'EXISTS (SELECT 1 FROM post_publications pp WHERE pp.post_id = p.id AND pp.site_id = :filterSite)',
        { filterSite: query.siteId },
      );
      qb.setParameter('effectiveStatusSiteId', query.siteId);
    }

    if (query.search) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM post_revisions pr WHERE pr.post_id = p.id AND (pr.title ILIKE :search OR pr.excerpt ILIKE :search))',
        { search: `%${query.search.trim()}%` },
      );
    }

    if (query.startDate) {
      qb.andWhere('p.created_at >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.endDate) {
      qb.andWhere('p.created_at <= :endDate', { endDate: new Date(query.endDate) });
    }

    return qb;
  }

  /**
   * Post counts per effective status (see `effectiveStatusSql`) for the
   * workspace cards and tabs. Counted in the database, so they stay correct
   * for any number of posts.
   */
  async getPostStats(
    actor: EffectiveAuthContext,
    query: Pick<ListPostsQueryDto, 'siteId' | 'type'>,
  ): Promise<PostStatusCounts> {
    const qb = await this.scopedPostsQuery(actor, query);
    const rows = await qb
      .select(effectiveStatusSql('p', Boolean(query.siteId)), 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('1')
      .getRawMany<{ status: string; count: number | string }>();

    const byStatus = Object.fromEntries(POST_STATS_STATUSES.map((status) => [status, 0])) as Record<
      PostStatsStatus,
      number
    >;
    let total = 0;
    for (const row of rows) {
      const count = Number(row.count);
      total += count;
      if (isPostStatsStatus(row.status)) {
        byStatus[row.status] = count;
      }
    }
    return { total, byStatus };
  }

  async listPosts(
    actor: EffectiveAuthContext,
    query: ListPostsQueryDto,
  ): Promise<PaginatedResult<PostItem>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const revisionRepo = await this.getRevisionRepo();

    // Author name only: never load password hashes or other user fields here.
    const qb = (await this.scopedPostsQuery(actor, query))
      .leftJoin('p.author', 'author')
      .addSelect(['author.id', 'author.displayName']);

    // Same definition as the status counts, so a tab's count matches its rows.
    if (query.status) {
      qb.andWhere(`${effectiveStatusSql('p', Boolean(query.siteId))} = :status`, {
        status: query.status,
      });
    }

    const sortField = query.sortBy === 'updatedAt' ? 'p.updated_at' : 'p.created_at';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(sortField, sortOrder);

    const [posts, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const publicationRepo = await this.getPublicationRepo();
    const postIds = posts.map((p) => p.id);
    const publications =
      postIds.length > 0 ? await publicationRepo.find({ where: { postId: In(postIds) } }) : [];

    // Latest revision of every post on the page in one query (was one query per post).
    const latestRevisions =
      postIds.length > 0
        ? await revisionRepo
            .createQueryBuilder('r')
            .distinctOn(['r.post_id'])
            .where('r.post_id IN (:...postIds)', { postIds })
            .orderBy('r.post_id')
            .addOrderBy('r.revision_number', 'DESC')
            .getMany()
        : [];
    const latestByPost = new Map(latestRevisions.map((rev) => [rev.postId, rev]));

    const items: PostItem[] = [];
    for (const post of posts) {
      const latestRev = latestByPost.get(post.id) ?? null;
      const postPubs = publications.filter((pub) => pub.postId === post.id);
      items.push({
        id: post.id,
        authorId: post.authorId,
        author: post.author ? { id: post.author.id, displayName: post.author.displayName } : null,
        type: post.type,
        status: post.status,
        sourceLocale: post.sourceLocale,
        deletedAt: post.deletedAt ? post.deletedAt.toISOString() : null,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        currentRevisionNumber: latestRev?.revisionNumber,
        currentRevision: latestRev ? this.mapRevisionToItem(latestRev) : null,
        publications: postPubs.map((pub) => ({
          id: pub.id,
          siteId: pub.siteId,
          postId: pub.postId,
          revisionId: pub.revisionId,
          slug: pub.slug,
          status: pub.status,
          scheduledFor: pub.scheduledFor ? pub.scheduledFor.toISOString() : null,
          publishedAt: pub.publishedAt ? pub.publishedAt.toISOString() : null,
          seoTitle: pub.seoTitle,
          seoDescription: pub.seoDescription,
          canonicalUrl: pub.canonicalUrl,
          featuredImageId: pub.featuredImageId,
          templateKey: pub.templateKey,
          eventId: pub.eventId,
          createdAt: pub.createdAt.toISOString(),
          updatedAt: pub.updatedAt.toISOString(),
        })),
      });
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getPost(actor: EffectiveAuthContext, postId: string): Promise<PostItem> {
    const postRepo = await this.getPostRepo();
    const publicationRepo = await this.getPublicationRepo();
    const revisionRepo = await this.getRevisionRepo();

    const post = await postRepo.findOne({
      where: { id: postId },
    });

    if (!post || post.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const publications = await publicationRepo.find({
      where: { postId },
    });

    if (!canAccessPost(actor, post, publications)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const latestRev = await revisionRepo.findOne({
      where: { postId },
      order: { revisionNumber: 'DESC' },
    });

    // The editor needs each publication's categories to show and edit them.
    const categoryLinks =
      publications.length > 0
        ? await (
            await getInitializedRepository(this.dataSource, PostPublicationCategory)
          ).find({ where: { publicationId: In(publications.map((p) => p.id)) } })
        : [];
    const categoryIdsByPub = new Map<string, string[]>();
    for (const link of categoryLinks) {
      const list = categoryIdsByPub.get(link.publicationId) ?? [];
      list.push(link.categoryId);
      categoryIdsByPub.set(link.publicationId, list);
    }

    return {
      id: post.id,
      authorId: post.authorId,
      type: post.type,
      status: post.status,
      sourceLocale: post.sourceLocale,
      deletedAt: null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      currentRevisionNumber: latestRev?.revisionNumber,
      currentRevision: latestRev ? this.mapRevisionToItem(latestRev) : null,
      publications: publications.map((p) => ({
        categoryIds: categoryIdsByPub.get(p.id) ?? [],
        id: p.id,
        siteId: p.siteId,
        postId: p.postId,
        revisionId: p.revisionId,
        slug: p.slug,
        status: p.status,
        scheduledFor: p.scheduledFor ? p.scheduledFor.toISOString() : null,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        canonicalUrl: p.canonicalUrl,
        featuredImageId: p.featuredImageId,
        templateKey: p.templateKey,
        eventId: p.eventId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  }

  async updatePost(
    actor: EffectiveAuthContext,
    postId: string,
    dto: UpdatePostDto,
  ): Promise<PostItem> {
    return this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const revRepo = manager.getRepository(PostRevision);
      const pubRepo = manager.getRepository(PostPublication);

      const post = await postRepo.findOne({ where: { id: postId } });
      if (!post || post.deletedAt) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
      }

      const publications = await pubRepo.find({ where: { postId } });
      if (!canAccessPost(actor, post, publications)) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
      }

      const latestRev = await revRepo.findOne({
        where: { postId },
        order: { revisionNumber: 'DESC' },
      });

      if (!latestRev) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'revision.notFound');
      }

      // Optimistic Concurrency Control check
      if (
        dto.expectedRevisionNumber !== undefined &&
        dto.expectedRevisionNumber !== latestRev.revisionNumber
      ) {
        throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'post.versionConflict');
      }

      // Validate body if provided
      if (dto.body) {
        const bodyValidation = validateStructuredBody(dto.body);
        if (!bodyValidation.isValid) {
          throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'post.invalidBody');
        }
      }

      const isContentChanged =
        (dto.title !== undefined && dto.title.trim() !== latestRev.title) ||
        (dto.excerpt !== undefined && (dto.excerpt?.trim() || null) !== latestRev.excerpt) ||
        (dto.body !== undefined && JSON.stringify(dto.body) !== JSON.stringify(latestRev.body));

      let activeRev = latestRev;
      if (isContentChanged) {
        const newRev = revRepo.create({
          postId,
          revisionNumber: latestRev.revisionNumber + 1,
          title: dto.title?.trim() ?? latestRev.title,
          excerpt: dto.excerpt !== undefined ? dto.excerpt?.trim() || null : latestRev.excerpt,
          body: dto.body ?? latestRev.body,
          changeSummary: dto.changeSummary?.trim() || 'Updated content',
          createdBy: actor.user.id,
        });
        activeRev = await revRepo.save(newRev);
        await this.pruneRevisionHistory(manager, postId);
      }

      if (dto.type) post.type = dto.type;
      if (dto.status) post.status = dto.status;
      if (dto.sourceLocale) post.sourceLocale = dto.sourceLocale.trim();
      post.updatedAt = new Date();

      const savedPost = await postRepo.save(post);

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        action: 'post.update',
        entityType: 'post',
        entityId: savedPost.id,
        metadata: {
          revisionNumber: activeRev.revisionNumber,
          isNewRevision: isContentChanged,
        },
      });

      return {
        id: savedPost.id,
        authorId: savedPost.authorId,
        type: savedPost.type,
        status: savedPost.status,
        sourceLocale: savedPost.sourceLocale,
        deletedAt: null,
        createdAt: savedPost.createdAt.toISOString(),
        updatedAt: savedPost.updatedAt.toISOString(),
        currentRevisionNumber: activeRev.revisionNumber,
        currentRevision: this.mapRevisionToItem(activeRev),
        publications: publications.map((p) => ({
          id: p.id,
          siteId: p.siteId,
          postId: p.postId,
          revisionId: p.revisionId,
          slug: p.slug,
          status: p.status,
          scheduledFor: p.scheduledFor ? p.scheduledFor.toISOString() : null,
          publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          canonicalUrl: p.canonicalUrl,
          featuredImageId: p.featuredImageId,
          templateKey: p.templateKey,
          eventId: p.eventId,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      };
    });
  }

  async archivePost(actor: EffectiveAuthContext, postId: string): Promise<void> {
    const postRepo = await this.getPostRepo();
    const publicationRepo = await this.getPublicationRepo();

    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const publications = await publicationRepo.find({ where: { postId } });
    if (!canAccessPost(actor, post, publications)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }
    // Archiving takes every publication offline; that needs every site's authority.
    if (!canManageAllPublications(actor, publications)) {
      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'http.forbidden');
    }

    await this.dataSource.transaction(async (manager) => {
      post.deletedAt = new Date();
      post.status = 'archived';
      await manager.getRepository(Post).save(post);

      await manager.getRepository(PostPublication).update({ postId }, { status: 'archived' });

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        action: 'post.delete',
        entityType: 'post',
        entityId: postId,
        metadata: { status: 'archived' },
      });
    });
  }

  async restorePost(actor: EffectiveAuthContext, postId: string): Promise<PostItem> {
    if (!actor.isSuperAdmin) {
      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'http.forbidden');
    }

    const postRepo = await this.getPostRepo();
    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    if (!post.deletedAt) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'post.notArchived');
    }

    post.deletedAt = null;
    post.status = 'draft';
    const saved = await postRepo.save(post);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      action: 'post.update',
      entityType: 'post',
      entityId: postId,
      metadata: { action: 'restored' },
    });

    return this.getPost(actor, saved.id);
  }

  async listRevisions(actor: EffectiveAuthContext, postId: string): Promise<PostRevisionItem[]> {
    const postRepo = await this.getPostRepo();
    const publicationRepo = await this.getPublicationRepo();
    const revisionRepo = await this.getRevisionRepo();

    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const publications = await publicationRepo.find({ where: { postId } });
    if (!canAccessPost(actor, post, publications)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const revisions = await revisionRepo.find({
      where: { postId },
      order: { revisionNumber: 'DESC' },
    });

    return revisions.map((r) => this.mapRevisionToItem(r));
  }

  async getRevision(
    actor: EffectiveAuthContext,
    postId: string,
    revisionNumber: number,
  ): Promise<PostRevisionItem> {
    const postRepo = await this.getPostRepo();
    const publicationRepo = await this.getPublicationRepo();
    const revisionRepo = await this.getRevisionRepo();

    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const publications = await publicationRepo.find({ where: { postId } });
    if (!canAccessPost(actor, post, publications)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const revision = await revisionRepo.findOne({
      where: { postId, revisionNumber },
    });

    if (!revision) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'revision.notFound');
    }

    return this.mapRevisionToItem(revision);
  }

  async restoreRevision(
    actor: EffectiveAuthContext,
    postId: string,
    revisionNumber: number,
    dto: RestoreRevisionDto,
  ): Promise<PostRevisionItem> {
    return this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const revRepo = manager.getRepository(PostRevision);
      const pubRepo = manager.getRepository(PostPublication);

      const post = await postRepo.findOne({ where: { id: postId } });
      if (!post || post.deletedAt) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
      }

      const publications = await pubRepo.find({ where: { postId } });
      if (!canAccessPost(actor, post, publications)) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
      }

      const targetRev = await revRepo.findOne({
        where: { postId, revisionNumber },
      });

      if (!targetRev) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'revision.notFound');
      }

      const latestRev = await revRepo.findOne({
        where: { postId },
        order: { revisionNumber: 'DESC' },
      });

      const nextRevNumber = (latestRev?.revisionNumber ?? revisionNumber) + 1;

      const restoredRev = revRepo.create({
        postId,
        revisionNumber: nextRevNumber,
        title: targetRev.title,
        excerpt: targetRev.excerpt,
        body: targetRev.body,
        changeSummary: dto.changeSummary?.trim() || `Restored from revision #${revisionNumber}`,
        createdBy: actor.user.id,
      });

      const savedRev = await revRepo.save(restoredRev);
      await this.pruneRevisionHistory(manager, postId);

      post.updatedAt = new Date();
      await postRepo.save(post);

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        action: 'post.update',
        entityType: 'post',
        entityId: postId,
        metadata: {
          restoredFromRevision: revisionNumber,
          newRevisionNumber: nextRevNumber,
        },
      });

      return this.mapRevisionToItem(savedRev);
    });
  }

  private mapRevisionToItem(rev: PostRevision): PostRevisionItem {
    return {
      id: rev.id,
      postId: rev.postId,
      revisionNumber: rev.revisionNumber,
      title: rev.title,
      excerpt: rev.excerpt,
      body: rev.body,
      changeSummary: rev.changeSummary,
      createdBy: rev.createdBy,
      createdAt: rev.createdAt.toISOString(),
    };
  }

  private getPreviewSecret(): string {
    return PREVIEW_TOKEN_SECRET;
  }

  async generatePreviewToken(
    actor: EffectiveAuthContext,
    postId: string,
    siteId?: string,
  ): Promise<PreviewTokenResponse> {
    if (siteId && !actor.isSuperAdmin && !actor.authorizedSiteIds.includes(siteId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'http.forbidden');
    }

    const postRepo = await this.getPostRepo();
    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    // Object-level check: `post:read` on any site is not authority over this post.
    const publicationRepo = await this.getPublicationRepo();
    const publications = await publicationRepo.find({ where: { postId } });
    if (!canAccessPost(actor, post, publications)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    // Platform settings (Publishing → preview link lifetime).
    const { publishing } = await this.settingsService.getPolicy();
    const expiresAt = new Date(Date.now() + publishing.previewTokenTtlMs);
    const exp = Math.floor(expiresAt.getTime() / 1000);
    const payload = `${postId}:${siteId || 'none'}:${actor.user.id}:${exp}`;
    const signature = crypto
      .createHmac('sha256', this.getPreviewSecret())
      .update(payload)
      .digest('hex');

    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
    const previewUrl = `${env.API_BASE_URL}/posts/${postId}/preview?token=${token}${siteId ? `&siteId=${siteId}` : ''}`;

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      previewUrl,
    };
  }

  async getPostPreview(postId: string, token: string, siteId?: string): Promise<PostPreviewData> {
    let decoded: string;
    try {
      decoded = Buffer.from(token, 'base64url').toString('utf-8');
    } catch {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'post.previewTokenInvalid',
      );
    }

    const parts = decoded.split(':');
    if (parts.length !== 5) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'post.previewTokenInvalid',
      );
    }

    const [tokenPostId, tokenSiteId, tokenUserId, tokenExpStr, tokenSig] = parts;
    if (!tokenPostId || !tokenSiteId || !tokenUserId || !tokenExpStr || !tokenSig) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'post.previewTokenInvalid',
      );
    }

    const exp = parseInt(tokenExpStr, 10);
    if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'post.previewTokenExpired',
      );
    }

    if (tokenPostId !== postId) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'post.previewTokenInvalid',
      );
    }

    const payload = `${tokenPostId}:${tokenSiteId}:${tokenUserId}:${tokenExpStr}`;
    const expectedSig = crypto
      .createHmac('sha256', this.getPreviewSecret())
      .update(payload)
      .digest('hex');

    if (!isSignatureValid(tokenSig, expectedSig)) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'post.previewTokenInvalid',
      );
    }

    // The site is part of the signed payload; an unsigned query value must not override it.
    const signedSiteId = tokenSiteId === 'none' ? undefined : tokenSiteId;
    if (siteId && siteId !== signedSiteId) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'UNAUTHENTICATED',
        'post.previewTokenInvalid',
      );
    }

    const postRepo = await this.getPostRepo();
    const revisionRepo = await this.getRevisionRepo();
    const publicationRepo = await this.getPublicationRepo();
    const siteRepo = await getInitializedRepository(this.dataSource, Site);

    const post = await postRepo.findOne({
      where: { id: postId },
    });

    if (!post || post.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const revision = await revisionRepo.findOne({
      where: { postId },
      order: { revisionNumber: 'DESC' },
    });

    if (!revision) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'revision.notFound');
    }

    const targetSiteId = signedSiteId;
    let publication: PostPublication | null = null;
    let site: Site | null = null;

    if (targetSiteId) {
      publication = await publicationRepo.findOne({
        where: { postId, siteId: targetSiteId },
      });
      site = await siteRepo.findOne({
        where: { id: targetSiteId },
        relations: { domains: true },
      });
    }

    const primaryDomain =
      site?.domains?.find((d) => d.isPrimary && d.status === 'active')?.hostname ?? null;

    return {
      post: {
        id: post.id,
        authorId: post.authorId,
        type: post.type,
        status: post.status,
        sourceLocale: post.sourceLocale,
        deletedAt: null,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        currentRevisionNumber: revision.revisionNumber,
      },
      revision: {
        id: revision.id,
        postId: revision.postId,
        revisionNumber: revision.revisionNumber,
        title: revision.title,
        excerpt: revision.excerpt,
        body: revision.body,
        changeSummary: revision.changeSummary,
        createdBy: revision.createdBy,
        createdAt: revision.createdAt.toISOString(),
      },
      publication: publication
        ? {
            id: publication.id,
            siteId: publication.siteId,
            postId: publication.postId,
            revisionId: publication.revisionId,
            slug: publication.slug,
            status: publication.status,
            scheduledFor: publication.scheduledFor ? publication.scheduledFor.toISOString() : null,
            publishedAt: publication.publishedAt ? publication.publishedAt.toISOString() : null,
            seoTitle: publication.seoTitle,
            seoDescription: publication.seoDescription,
            canonicalUrl: publication.canonicalUrl,
            featuredImageId: publication.featuredImageId,
            templateKey: publication.templateKey,
            eventId: publication.eventId,
            createdAt: publication.createdAt.toISOString(),
            updatedAt: publication.updatedAt.toISOString(),
          }
        : null,
      site: site
        ? {
            id: site.id,
            key: site.key,
            name: site.name,
            primaryDomain,
          }
        : null,
    };
  }
}
