import { HttpStatus, Inject, Injectable, forwardRef } from '@nestjs/common';
import type {
  PaginatedResult,
  PublicArticleDetail,
  PublicArticleImage,
  PublicArticleSummary,
  PublicCategoryItem,
  PublicEventDetail,
  PublicEventSummary,
  PublicSitemapItem,
  PublicTagItem,
  PublicTaxonomyRef,
} from '@multi-site-cms/types';
import { DataSource, In } from 'typeorm';

import { ApiException } from '../common/exceptions/api.exception';
import { DATA_SOURCE } from '../database/database.tokens';
import { Category } from '../database/entities/category.entity';
import { Event } from '../database/entities/event.entity';
import { MediaAsset } from '../database/entities/media-asset.entity';
import { NewsletterSubscriber } from '../database/entities/newsletter-subscriber.entity';
import { PostPublicationCategory } from '../database/entities/post-publication-category.entity';
import { PostPublicationTag } from '../database/entities/post-publication-tag.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { PostRevision } from '../database/entities/post-revision.entity';
import { Post } from '../database/entities/post.entity';
import { Site } from '../database/entities/site.entity';
import { Tag } from '../database/entities/tag.entity';
import { User } from '../database/entities/user.entity';
import { getInitializedRepository } from '../database/ensure-connected';
import { AuditService } from '../common/audit/audit.service';
import type { ListPublicPostsQueryDto } from './dto/list-public-posts-query.dto';
import type { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { PostsService } from './posts.service';
import { calculateReadingTimeMinutes, extractTextFromDoc } from './utils/body-validator';

@Injectable()
export class PublicContentService {
  private readonly baseUrl: string;

  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    @Inject(forwardRef(() => PostsService))
    private readonly postsService: PostsService,
    private readonly auditService: AuditService,
  ) {
    this.baseUrl = (process.env.API_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '');
  }

  private resolveMediaUrl(storageKey: string): string {
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
      return storageKey;
    }
    const sanitizedKey = encodeURIComponent(storageKey).replace(/%2F/g, '/');
    return `${this.baseUrl}/media/assets/${sanitizedKey}`;
  }

  private formatMediaImage(asset: MediaAsset | null): PublicArticleImage | null {
    if (!asset) return null;
    return {
      id: asset.id,
      url: this.resolveMediaUrl(asset.storageKey),
      altText: asset.altText,
      caption: asset.caption,
      width: asset.width,
      height: asset.height,
    };
  }

  private async resolveSite(siteKey: string): Promise<Site> {
    const siteRepo = await getInitializedRepository(this.dataSource, Site);
    const site = await siteRepo.findOne({
      where: {
        key: siteKey.toLowerCase().trim(),
        status: 'active',
      },
    });

    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    return site;
  }

  /**
   * List published posts for a specific public site.
   * Strictly enforces:
   * 1. site_id matches resolved site
   * 2. publication status is 'published'
   * 3. published_at is set and <= NOW()
   * 4. post is not soft-deleted and post status is not archived
   */
  async listPublishedPosts(
    siteKey: string,
    query: ListPublicPostsQueryDto,
  ): Promise<PaginatedResult<PublicArticleSummary>> {
    const site = await this.resolveSite(siteKey);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 12));
    const skip = (page - 1) * limit;

    const pubRepo = await getInitializedRepository(this.dataSource, PostPublication);
    const now = new Date();

    const qb = pubRepo
      .createQueryBuilder('pub')
      .innerJoin(
        Post,
        'post',
        'post.id = pub.post_id AND post.deleted_at IS NULL AND post.status != :archivedStatus',
        { archivedStatus: 'archived' },
      )
      .innerJoin(PostRevision, 'rev', 'rev.id = pub.revision_id')
      .leftJoin(User, 'author', 'author.id = post.author_id')
      .leftJoin(MediaAsset, 'media', 'media.id = pub.featured_image_id')
      .where('pub.site_id = :siteId', { siteId: site.id })
      .andWhere('pub.status = :publishedStatus', { publishedStatus: 'published' })
      .andWhere('pub.published_at IS NOT NULL')
      .andWhere('pub.published_at <= :now', { now });

    if (query.type) {
      qb.andWhere('post.type = :postType', { postType: query.type });
    }

    if (query.templateKey && query.templateKey.trim().length > 0) {
      qb.andWhere('pub.template_key = :templateKey', { templateKey: query.templateKey.trim() });
    }

    if (query.eventId && query.eventId.trim().length > 0) {
      qb.andWhere('pub.event_id = :eventId', { eventId: query.eventId.trim() });
    }

    if (query.search && query.search.trim().length > 0) {
      const terms = query.search.trim().split(/\s+/).filter(Boolean);
      if (terms.length === 1) {
        const term = `%${terms[0]}%`;
        qb.andWhere('(rev.title ILIKE :term OR rev.excerpt ILIKE :term)', { term });
      } else {
        terms.forEach((termStr, index) => {
          const paramName = `term_${index}`;
          qb.andWhere(`(rev.title ILIKE :${paramName} OR rev.excerpt ILIKE :${paramName})`, {
            [paramName]: `%${termStr}%`,
          });
        });
      }
    }

    if (query.categorySlug && query.categorySlug.trim().length > 0) {
      qb.innerJoin(
        PostPublicationCategory,
        'ppc',
        'ppc.publication_id = pub.id AND ppc.site_id = pub.site_id',
      ).innerJoin(Category, 'cat', 'cat.id = ppc.category_id AND cat.slug = :categorySlug', {
        categorySlug: query.categorySlug.toLowerCase().trim(),
      });
    }

    if (query.tagSlug && query.tagSlug.trim().length > 0) {
      qb.innerJoin(
        PostPublicationTag,
        'ppt',
        'ppt.publication_id = pub.id AND ppt.site_id = pub.site_id',
      ).innerJoin(Tag, 'tag', 'tag.id = ppt.tag_id AND tag.slug = :tagSlug', {
        tagSlug: query.tagSlug.toLowerCase().trim(),
      });
    }

    // Dynamic sorting
    switch (query.sort) {
      case 'oldest':
        qb.orderBy('pub.published_at', 'ASC');
        break;
      case 'popular':
        qb.orderBy('pub.featured_image_id', 'DESC').addOrderBy('pub.published_at', 'DESC');
        break;
      case 'title_asc':
        qb.addSelect('rev.title').orderBy('rev.title', 'ASC');
        break;
      case 'newest':
      default:
        qb.orderBy('pub.published_at', 'DESC');
        break;
    }

    qb.skip(skip).take(limit);

    const [publications, total] = await qb.getManyAndCount();

    if (publications.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      };
    }

    const pubIds = publications.map((p) => p.id);
    const postIds = publications.map((p) => p.postId);
    const revisionIds = publications.map((p) => p.revisionId);
    const mediaIds = publications
      .map((p) => p.featuredImageId)
      .filter((id): id is string => Boolean(id));

    // Batch fetch related entities
    const postRepo = await getInitializedRepository(this.dataSource, Post);
    const revisionRepo = await getInitializedRepository(this.dataSource, PostRevision);
    const mediaRepo = await getInitializedRepository(this.dataSource, MediaAsset);
    const userRepo = await getInitializedRepository(this.dataSource, User);

    const [posts, revisions, mediaAssets] = await Promise.all([
      postRepo.findBy({ id: In(postIds) }),
      revisionRepo.findBy({ id: In(revisionIds) }),
      mediaIds.length > 0 ? mediaRepo.findBy({ id: In(mediaIds) }) : Promise.resolve([]),
    ]);

    const postMap = new Map(posts.map((p) => [p.id, p]));
    const revMap = new Map(revisions.map((r) => [r.id, r]));
    const mediaMap = new Map(mediaAssets.map((m) => [m.id, m]));

    const authorIds = posts.map((p) => p.authorId).filter((id): id is string => Boolean(id));
    const authors = authorIds.length > 0 ? await userRepo.findBy({ id: In(authorIds) }) : [];
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    // Batch fetch taxonomies for these publications
    const pubCatRepo = await getInitializedRepository(this.dataSource, PostPublicationCategory);
    const pubTagRepo = await getInitializedRepository(this.dataSource, PostPublicationTag);

    const [pubCategories, pubTags] = await Promise.all([
      pubCatRepo
        .createQueryBuilder('ppc')
        .innerJoinAndSelect('ppc.category', 'cat')
        .where('ppc.publication_id IN (:...pubIds)', { pubIds })
        .andWhere('ppc.site_id = :siteId', { siteId: site.id })
        .getMany(),
      pubTagRepo
        .createQueryBuilder('ppt')
        .innerJoinAndSelect('ppt.tag', 'tag')
        .where('ppt.publication_id IN (:...pubIds)', { pubIds })
        .andWhere('ppt.site_id = :siteId', { siteId: site.id })
        .getMany(),
    ]);

    const categoriesByPub = new Map<string, PublicTaxonomyRef[]>();
    for (const pc of pubCategories) {
      const list = categoriesByPub.get(pc.publicationId) ?? [];
      if (pc.category) {
        list.push({ id: pc.category.id, name: pc.category.name, slug: pc.category.slug });
      }
      categoriesByPub.set(pc.publicationId, list);
    }

    const tagsByPub = new Map<string, PublicTaxonomyRef[]>();
    for (const pt of pubTags) {
      const list = tagsByPub.get(pt.publicationId) ?? [];
      if (pt.tag) {
        list.push({ id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug });
      }
      tagsByPub.set(pt.publicationId, list);
    }

    const items: PublicArticleSummary[] = publications.map((pub) => {
      const post = postMap.get(pub.postId);
      const rev = revMap.get(pub.revisionId);
      const media = pub.featuredImageId ? (mediaMap.get(pub.featuredImageId) ?? null) : null;
      const author = post?.authorId ? authorMap.get(post.authorId) : null;

      const readingTimeMinutes = rev
        ? calculateReadingTimeMinutes(extractTextFromDoc(rev.body))
        : 1;

      return {
        id: pub.id,
        publicationId: pub.id,
        postId: pub.postId,
        slug: pub.slug,
        title: rev?.title ?? 'Untitled',
        excerpt: rev?.excerpt ?? null,
        type: post?.type ?? 'article',
        templateKey: pub.templateKey ?? null,
        eventId: pub.eventId ?? null,
        sourceLocale: post?.sourceLocale ?? 'en',
        publishedAt: pub.publishedAt ? pub.publishedAt.toISOString() : pub.createdAt.toISOString(),
        updatedAt: pub.updatedAt.toISOString(),
        readingTimeMinutes,
        featuredImage: this.formatMediaImage(media),
        categories: categoriesByPub.get(pub.id) ?? [],
        tags: tagsByPub.get(pub.id) ?? [],
        author: author ? { id: author.id, displayName: author.displayName } : null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve a single published post by slug on a specific site.
   * Throws 404 if the publication does not exist, is in draft/review, or is unpublished.
   */
  async getPublishedPostBySlug(siteKey: string, slug: string): Promise<PublicArticleDetail> {
    const site = await this.resolveSite(siteKey);

    const pubRepo = await getInitializedRepository(this.dataSource, PostPublication);
    const normalizedSlug = slug.toLowerCase().trim();
    const now = new Date();

    const pub = await pubRepo
      .createQueryBuilder('pub')
      .where('pub.site_id = :siteId', { siteId: site.id })
      .andWhere('LOWER(pub.slug) = :slug', { slug: normalizedSlug })
      .andWhere('pub.status = :status', { status: 'published' })
      .andWhere('pub.published_at IS NOT NULL')
      .andWhere('pub.published_at <= :now', { now })
      .getOne();

    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const postRepo = await getInitializedRepository(this.dataSource, Post);
    const post = await postRepo.findOne({
      where: { id: pub.postId },
    });

    if (!post || post.deletedAt || post.status === 'archived') {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const revisionRepo = await getInitializedRepository(this.dataSource, PostRevision);
    const revision = await revisionRepo.findOne({
      where: { id: pub.revisionId },
    });

    if (!revision) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    // Author
    const userRepo = await getInitializedRepository(this.dataSource, User);
    const author = post.authorId ? await userRepo.findOne({ where: { id: post.authorId } }) : null;

    // Media
    let media: MediaAsset | null = null;
    if (pub.featuredImageId) {
      const mediaRepo = await getInitializedRepository(this.dataSource, MediaAsset);
      media = await mediaRepo.findOne({ where: { id: pub.featuredImageId } });
    }

    // Categories and Tags
    const pubCatRepo = await getInitializedRepository(this.dataSource, PostPublicationCategory);
    const pubTagRepo = await getInitializedRepository(this.dataSource, PostPublicationTag);

    const [pubCategories, pubTags] = await Promise.all([
      pubCatRepo
        .createQueryBuilder('ppc')
        .innerJoinAndSelect('ppc.category', 'cat')
        .where('ppc.publication_id = :pubId', { pubId: pub.id })
        .andWhere('ppc.site_id = :siteId', { siteId: site.id })
        .getMany(),
      pubTagRepo
        .createQueryBuilder('ppt')
        .innerJoinAndSelect('ppt.tag', 'tag')
        .where('ppt.publication_id = :pubId', { pubId: pub.id })
        .andWhere('ppt.site_id = :siteId', { siteId: site.id })
        .getMany(),
    ]);

    const categories: PublicTaxonomyRef[] = pubCategories
      .filter((pc) => Boolean(pc.category))
      .map((pc) => ({ id: pc.category.id, name: pc.category.name, slug: pc.category.slug }));

    const tags: PublicTaxonomyRef[] = pubTags
      .filter((pt) => Boolean(pt.tag))
      .map((pt) => ({ id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug }));

    const readingTimeMinutes = calculateReadingTimeMinutes(extractTextFromDoc(revision.body));

    // Related articles (up to 3 other published articles on the same site)
    const categoryIds = categories.map((c) => c.id);
    let relatedPubs: PostPublication[] = [];

    if (categoryIds.length > 0) {
      relatedPubs = await pubRepo
        .createQueryBuilder('pub')
        .innerJoin(
          PostPublicationCategory,
          'ppc',
          'ppc.publication_id = pub.id AND ppc.site_id = pub.site_id',
        )
        .where('pub.site_id = :siteId', { siteId: site.id })
        .andWhere('pub.id != :currentPubId', { currentPubId: pub.id })
        .andWhere('pub.status = :status', { status: 'published' })
        .andWhere('pub.published_at IS NOT NULL AND pub.published_at <= :now', { now })
        .andWhere('ppc.category_id IN (:...categoryIds)', { categoryIds })
        .orderBy('pub.published_at', 'DESC')
        .take(3)
        .getMany();
    }

    if (relatedPubs.length < 3) {
      const existingIds = [pub.id, ...relatedPubs.map((r) => r.id)];
      const fallbackPubs = await pubRepo
        .createQueryBuilder('pub')
        .where('pub.site_id = :siteId', { siteId: site.id })
        .andWhere('pub.id NOT IN (:...existingIds)', { existingIds })
        .andWhere('pub.status = :status', { status: 'published' })
        .andWhere('pub.published_at IS NOT NULL AND pub.published_at <= :now', { now })
        .orderBy('pub.published_at', 'DESC')
        .take(3 - relatedPubs.length)
        .getMany();

      relatedPubs.push(...fallbackPubs);
    }

    // Format related articles
    let relatedArticles: PublicArticleSummary[] = [];
    if (relatedPubs.length > 0) {
      const relRevIds = relatedPubs.map((r) => r.revisionId);
      const relRevs = await revisionRepo.findBy({ id: In(relRevIds) });
      const relRevMap = new Map(relRevs.map((r) => [r.id, r]));

      relatedArticles = relatedPubs.map((rp) => {
        const rRev = relRevMap.get(rp.revisionId);
        return {
          id: rp.id,
          publicationId: rp.id,
          postId: rp.postId,
          slug: rp.slug,
          title: rRev?.title ?? 'Untitled',
          excerpt: rRev?.excerpt ?? null,
          type: post.type,
          templateKey: rp.templateKey ?? null,
          eventId: rp.eventId ?? null,
          sourceLocale: post.sourceLocale,
          publishedAt: rp.publishedAt ? rp.publishedAt.toISOString() : rp.createdAt.toISOString(),
          updatedAt: rp.updatedAt.toISOString(),
          readingTimeMinutes: rRev ? calculateReadingTimeMinutes(extractTextFromDoc(rRev.body)) : 1,
          featuredImage: null,
          categories: [],
          tags: [],
          author: null,
        };
      });
    }

    // Adjacent articles (previous: older, next: newer)
    const [prevPub, nextPub] = await Promise.all([
      pub.publishedAt
        ? pubRepo
            .createQueryBuilder('pub')
            .where('pub.site_id = :siteId', { siteId: site.id })
            .andWhere('pub.status = :status', { status: 'published' })
            .andWhere('pub.published_at < :currentPublishedAt', {
              currentPublishedAt: pub.publishedAt,
            })
            .orderBy('pub.published_at', 'DESC')
            .take(1)
            .getOne()
        : null,
      pub.publishedAt
        ? pubRepo
            .createQueryBuilder('pub')
            .where('pub.site_id = :siteId', { siteId: site.id })
            .andWhere('pub.status = :status', { status: 'published' })
            .andWhere('pub.published_at > :currentPublishedAt AND pub.published_at <= :now', {
              currentPublishedAt: pub.publishedAt,
              now,
            })
            .orderBy('pub.published_at', 'ASC')
            .take(1)
            .getOne()
        : null,
    ]);

    let prevArticle: { slug: string; title: string } | null = null;
    if (prevPub) {
      const pRev = await revisionRepo.findOne({ where: { id: prevPub.revisionId } });
      prevArticle = { slug: prevPub.slug, title: pRev?.title ?? prevPub.slug };
    }

    let nextArticle: { slug: string; title: string } | null = null;
    if (nextPub) {
      const nRev = await revisionRepo.findOne({ where: { id: nextPub.revisionId } });
      nextArticle = { slug: nextPub.slug, title: nRev?.title ?? nextPub.slug };
    }

    let eventRef: { id: string; slug: string; name: string; status: string } | null = null;
    if (pub.eventId) {
      const eventRepo = await getInitializedRepository(this.dataSource, Event);
      const ev = await eventRepo.findOne({ where: { id: pub.eventId, siteId: site.id } });
      if (ev) {
        eventRef = { id: ev.id, slug: ev.slug, name: ev.name, status: ev.status };
      }
    }

    return {
      id: pub.id,
      publicationId: pub.id,
      postId: pub.postId,
      slug: pub.slug,
      title: revision.title,
      excerpt: revision.excerpt,
      type: post.type,
      templateKey: pub.templateKey ?? null,
      eventId: pub.eventId ?? null,
      sourceLocale: post.sourceLocale,
      publishedAt: pub.publishedAt ? pub.publishedAt.toISOString() : pub.createdAt.toISOString(),
      updatedAt: pub.updatedAt.toISOString(),
      readingTimeMinutes,
      featuredImage: this.formatMediaImage(media),
      categories,
      tags,
      author: author ? { id: author.id, displayName: author.displayName } : null,
      body: revision.body,
      seoTitle: pub.seoTitle,
      seoDescription: pub.seoDescription,
      canonicalUrl: pub.canonicalUrl,
      event: eventRef,
      relatedArticles,
      adjacentArticles: {
        prev: prevArticle,
        next: nextArticle,
      },
    };
  }

  /**
   * Retrieve active categories for a site along with their published post counts.
   */
  async listPublishedCategories(siteKey: string): Promise<PublicCategoryItem[]> {
    const site = await this.resolveSite(siteKey);
    const catRepo = await getInitializedRepository(this.dataSource, Category);
    const now = new Date();

    const raw = await catRepo
      .createQueryBuilder('cat')
      .leftJoin(
        PostPublicationCategory,
        'ppc',
        'ppc.category_id = cat.id AND ppc.site_id = cat.site_id',
      )
      .leftJoin(
        PostPublication,
        'pub',
        'pub.id = ppc.publication_id AND pub.status = :published AND pub.published_at IS NOT NULL AND pub.published_at <= :now',
        { published: 'published', now },
      )
      .where('cat.site_id = :siteId', { siteId: site.id })
      .select([
        'cat.id AS id',
        'cat.name AS name',
        'cat.slug AS slug',
        'cat.description AS description',
        'cat.parent_id AS "parentId"',
        'COUNT(pub.id) AS "postCount"',
      ])
      .groupBy('cat.id')
      .orderBy('cat.name', 'ASC')
      .getRawMany<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        parentId: string | null;
        postCount: string;
      }>();

    return raw.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      parentId: r.parentId,
      postCount: Number.parseInt(r.postCount, 10) || 0,
    }));
  }

  /**
   * Retrieve active tags for a site along with their published post counts.
   */
  async listPublishedTags(siteKey: string): Promise<PublicTagItem[]> {
    const site = await this.resolveSite(siteKey);
    const tagRepo = await getInitializedRepository(this.dataSource, Tag);
    const now = new Date();

    const raw = await tagRepo
      .createQueryBuilder('tag')
      .leftJoin(PostPublicationTag, 'ppt', 'ppt.tag_id = tag.id AND ppt.site_id = tag.site_id')
      .leftJoin(
        PostPublication,
        'pub',
        'pub.id = ppt.publication_id AND pub.status = :published AND pub.published_at IS NOT NULL AND pub.published_at <= :now',
        { published: 'published', now },
      )
      .where('tag.site_id = :siteId', { siteId: site.id })
      .select([
        'tag.id AS id',
        'tag.name AS name',
        'tag.slug AS slug',
        'tag.description AS description',
        'COUNT(pub.id) AS "postCount"',
      ])
      .groupBy('tag.id')
      .orderBy('tag.name', 'ASC')
      .getRawMany<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        postCount: string;
      }>();

    return raw.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      postCount: Number.parseInt(r.postCount, 10) || 0,
    }));
  }

  /**
   * Retrieve sitemap entries for public indexing.
   */
  async getSitemapEntries(siteKey: string): Promise<PublicSitemapItem[]> {
    const site = await this.resolveSite(siteKey);
    const pubRepo = await getInitializedRepository(this.dataSource, PostPublication);
    const now = new Date();

    const entries = await pubRepo
      .createQueryBuilder('pub')
      .innerJoin(
        Post,
        'post',
        'post.id = pub.post_id AND post.deleted_at IS NULL AND post.status != :archivedStatus',
        { archivedStatus: 'archived' },
      )
      .where('pub.site_id = :siteId', { siteId: site.id })
      .andWhere('pub.status = :publishedStatus', { publishedStatus: 'published' })
      .andWhere('pub.published_at IS NOT NULL')
      .andWhere('pub.published_at <= :now', { now })
      .select([
        'pub.slug AS slug',
        'pub.published_at AS "publishedAt"',
        'pub.updated_at AS "updatedAt"',
      ])
      .orderBy('pub.published_at', 'DESC')
      .getRawMany<{ slug: string; publishedAt: Date; updatedAt: Date }>();

    return entries.map((e) => ({
      slug: e.slug,
      publishedAt: new Date(e.publishedAt).toISOString(),
      updatedAt: new Date(e.updatedAt).toISOString(),
    }));
  }

  /**
   * Verified draft preview loader. Validates preview token before returning draft content.
   */
  async getDraftPreview(
    postId: string,
    token: string,
    siteKey?: string,
  ): Promise<PublicArticleDetail> {
    let siteId: string | undefined;
    if (siteKey) {
      const site = await this.resolveSite(siteKey);
      siteId = site.id;
    }

    const previewData = await this.postsService.getPostPreview(postId, token, siteId);

    const readingTimeMinutes = calculateReadingTimeMinutes(
      extractTextFromDoc(previewData.revision.body),
    );

    return {
      id: previewData.publication?.id ?? postId,
      publicationId: previewData.publication?.id ?? postId,
      postId: previewData.post.id,
      slug: previewData.publication?.slug ?? `preview-${postId.slice(0, 8)}`,
      title: previewData.revision.title,
      excerpt: previewData.revision.excerpt,
      type: previewData.post.type,
      templateKey: previewData.publication?.templateKey ?? null,
      eventId: previewData.publication?.eventId ?? null,
      sourceLocale: previewData.post.sourceLocale,
      publishedAt: new Date().toISOString(),
      updatedAt: previewData.revision.createdAt,
      readingTimeMinutes,
      featuredImage: null,
      categories: [],
      tags: [],
      author: null,
      body: previewData.revision.body,
      seoTitle: previewData.publication?.seoTitle ?? previewData.revision.title,
      seoDescription: previewData.publication?.seoDescription ?? previewData.revision.excerpt,
      canonicalUrl: previewData.publication?.canonicalUrl ?? null,
      event: null,
      relatedArticles: [],
      adjacentArticles: { prev: null, next: null },
    };
  }

  /**
   * Retrieve active events for a site with published update counts.
   */
  async listPublishedEvents(siteKey: string): Promise<PublicEventSummary[]> {
    const site = await this.resolveSite(siteKey);
    const eventRepo = await getInitializedRepository(this.dataSource, Event);
    const pubRepo = await getInitializedRepository(this.dataSource, PostPublication);
    const now = new Date();

    const events = await eventRepo
      .createQueryBuilder('ev')
      .where('ev.site_id = :siteId', { siteId: site.id })
      .orderBy('ev.starts_at', 'DESC')
      .getMany();

    if (events.length === 0) {
      return [];
    }

    const eventIds = events.map((e) => e.id);
    const countsRaw = await pubRepo
      .createQueryBuilder('pub')
      .select('pub.event_id', 'eventId')
      .addSelect('COUNT(*)', 'cnt')
      .where('pub.site_id = :siteId', { siteId: site.id })
      .andWhere('pub.event_id IN (:...eventIds)', { eventIds })
      .andWhere('pub.status = :status', { status: 'published' })
      .andWhere('pub.published_at IS NOT NULL AND pub.published_at <= :now', { now })
      .groupBy('pub.event_id')
      .getRawMany<{ eventId: string; cnt: string }>();

    const countsMap = new Map<string, number>();
    for (const r of countsRaw) {
      countsMap.set(r.eventId, Number.parseInt(r.cnt, 10));
    }

    return events.map((ev) => ({
      id: ev.id,
      slug: ev.slug,
      name: ev.name,
      status: ev.status,
      startsAt: ev.startsAt.toISOString(),
      endsAt: ev.endsAt ? ev.endsAt.toISOString() : null,
      description: ev.description,
      updateCount: countsMap.get(ev.id) ?? 0,
    }));
  }

  /**
   * Retrieve an event by slug along with its published updates (timeline).
   */
  async getPublishedEventBySlug(siteKey: string, slug: string): Promise<PublicEventDetail> {
    const site = await this.resolveSite(siteKey);
    const eventRepo = await getInitializedRepository(this.dataSource, Event);
    const now = new Date();

    const event = await eventRepo.findOne({
      where: {
        siteId: site.id,
        slug: slug.toLowerCase().trim(),
      },
    });

    if (!event) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const pubRepo = await getInitializedRepository(this.dataSource, PostPublication);
    const publications = await pubRepo
      .createQueryBuilder('pub')
      .innerJoin(
        Post,
        'post',
        'post.id = pub.post_id AND post.deleted_at IS NULL AND post.status != :archived',
        { archived: 'archived' },
      )
      .innerJoin(PostRevision, 'rev', 'rev.id = pub.revision_id')
      .where('pub.site_id = :siteId', { siteId: site.id })
      .andWhere('pub.event_id = :eventId', { eventId: event.id })
      .andWhere('pub.status = :status', { status: 'published' })
      .andWhere('pub.published_at IS NOT NULL AND pub.published_at <= :now', { now })
      .orderBy('pub.published_at', 'DESC')
      .getMany();

    let updates: PublicArticleSummary[] = [];
    if (publications.length > 0) {
      const pubIds = publications.map((p) => p.id);
      const postIds = publications.map((p) => p.postId);
      const revisionIds = publications.map((p) => p.revisionId);
      const mediaIds = publications
        .map((p) => p.featuredImageId)
        .filter((id): id is string => Boolean(id));

      const postRepo = await getInitializedRepository(this.dataSource, Post);
      const revisionRepo = await getInitializedRepository(this.dataSource, PostRevision);
      const userRepo = await getInitializedRepository(this.dataSource, User);
      const mediaRepo = await getInitializedRepository(this.dataSource, MediaAsset);
      const pubCatRepo = await getInitializedRepository(this.dataSource, PostPublicationCategory);
      const pubTagRepo = await getInitializedRepository(this.dataSource, PostPublicationTag);

      const [posts, revisions, mediaList, pubCategories, pubTags] = await Promise.all([
        postRepo.find({ where: { id: In(postIds) } }),
        revisionRepo.find({ where: { id: In(revisionIds) } }),
        mediaIds.length > 0 ? mediaRepo.find({ where: { id: In(mediaIds) } }) : [],
        pubCatRepo
          .createQueryBuilder('ppc')
          .innerJoinAndSelect('ppc.category', 'cat')
          .where('ppc.publication_id IN (:...pubIds)', { pubIds })
          .andWhere('ppc.site_id = :siteId', { siteId: site.id })
          .getMany(),
        pubTagRepo
          .createQueryBuilder('ppt')
          .innerJoinAndSelect('ppt.tag', 'tag')
          .where('ppt.publication_id IN (:...pubIds)', { pubIds })
          .andWhere('ppt.site_id = :siteId', { siteId: site.id })
          .getMany(),
      ]);

      const postMap = new Map(posts.map((p) => [p.id, p]));
      const revMap = new Map(revisions.map((r) => [r.id, r]));
      const mediaMap = new Map(mediaList.map((m) => [m.id, m]));

      const authorIds = posts.map((p) => p.authorId).filter(Boolean);
      const authors =
        authorIds.length > 0 ? await userRepo.find({ where: { id: In(authorIds) } }) : [];
      const authorMap = new Map(authors.map((u) => [u.id, u]));

      const categoriesByPub = new Map<string, PublicTaxonomyRef[]>();
      for (const pc of pubCategories) {
        const list = categoriesByPub.get(pc.publicationId) ?? [];
        if (pc.category) {
          list.push({ id: pc.category.id, name: pc.category.name, slug: pc.category.slug });
        }
        categoriesByPub.set(pc.publicationId, list);
      }

      const tagsByPub = new Map<string, PublicTaxonomyRef[]>();
      for (const pt of pubTags) {
        const list = tagsByPub.get(pt.publicationId) ?? [];
        if (pt.tag) {
          list.push({ id: pt.tag.id, name: pt.tag.name, slug: pt.tag.slug });
        }
        tagsByPub.set(pt.publicationId, list);
      }

      updates = publications.map((pub) => {
        const post = postMap.get(pub.postId);
        const rev = revMap.get(pub.revisionId);
        const media = pub.featuredImageId ? (mediaMap.get(pub.featuredImageId) ?? null) : null;
        const author = post?.authorId ? authorMap.get(post.authorId) : null;
        const readingTimeMinutes = rev
          ? calculateReadingTimeMinutes(extractTextFromDoc(rev.body))
          : 1;

        return {
          id: pub.id,
          publicationId: pub.id,
          postId: pub.postId,
          slug: pub.slug,
          title: rev?.title ?? 'Untitled',
          excerpt: rev?.excerpt ?? null,
          type: post?.type ?? 'article',
          templateKey: pub.templateKey ?? null,
          eventId: pub.eventId ?? null,
          sourceLocale: post?.sourceLocale ?? 'en',
          publishedAt: pub.publishedAt
            ? pub.publishedAt.toISOString()
            : pub.createdAt.toISOString(),
          updatedAt: pub.updatedAt.toISOString(),
          readingTimeMinutes,
          featuredImage: this.formatMediaImage(media),
          categories: categoriesByPub.get(pub.id) ?? [],
          tags: tagsByPub.get(pub.id) ?? [],
          author: author ? { id: author.id, displayName: author.displayName } : null,
        };
      });
    }

    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      status: event.status,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt ? event.endsAt.toISOString() : null,
      description: event.description,
      updateCount: updates.length,
      updates,
    };
  }

  /**
   * Subscribes an email to a public site newsletter with audit logging.
   */
  async subscribeNewsletter(
    siteKey: string,
    dto: SubscribeNewsletterDto,
    requestInfo?: { ipAddress?: string | null; requestId?: string | null },
  ): Promise<{ subscribed: boolean; message: string }> {
    const site = await this.resolveSite(siteKey);
    const subscriberRepo = await getInitializedRepository(this.dataSource, NewsletterSubscriber);

    let subscriber = await subscriberRepo.findOne({
      where: { siteId: site.id, email: dto.email },
    });

    if (subscriber) {
      if (subscriber.status !== 'subscribed') {
        subscriber.status = 'subscribed';
        subscriber.updatedAt = new Date();
        await subscriberRepo.save(subscriber);
      }
    } else {
      subscriber = subscriberRepo.create({
        siteId: site.id,
        email: dto.email,
        status: 'subscribed',
        metadata: {
          source: 'public_web',
        },
      });
      await subscriberRepo.save(subscriber);
    }

    await this.auditService.record({
      actorType: 'system',
      siteId: site.id,
      action: 'newsletter.subscribed',
      entityType: 'newsletter_subscriber',
      entityId: subscriber.id,
      requestId: requestInfo?.requestId ?? null,
      ipAddress: requestInfo?.ipAddress ?? null,
      metadata: {
        email: dto.email,
        siteKey,
      },
    });

    return {
      subscribed: true,
      message: 'Thank you for subscribing to our travel newsletter!',
    };
  }
}
