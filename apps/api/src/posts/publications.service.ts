import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type DataSource, type Repository } from 'typeorm';

import type { PaginatedResult, PostPublicationItem } from '@multi-site-cms/types';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { DATA_SOURCE } from '../database/database.tokens';
import { getInitializedRepository } from '../database/ensure-connected';
import { Category } from '../database/entities/category.entity';
import { MediaAsset } from '../database/entities/media-asset.entity';
import { PostPublicationCategory } from '../database/entities/post-publication-category.entity';
import { PostPublicationTag } from '../database/entities/post-publication-tag.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { PostRevision } from '../database/entities/post-revision.entity';
import { Post } from '../database/entities/post.entity';
import { Tag } from '../database/entities/tag.entity';
import { CreatePublicationDto, ListPublicationsQueryDto, UpdatePublicationDto } from './dto';

@Injectable()
export class PublicationsService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  private async getPublicationRepo(): Promise<Repository<PostPublication>> {
    return getInitializedRepository(this.dataSource, PostPublication);
  }

  private async getPubCategoryRepo(): Promise<Repository<PostPublicationCategory>> {
    return getInitializedRepository(this.dataSource, PostPublicationCategory);
  }

  private async getPubTagRepo(): Promise<Repository<PostPublicationTag>> {
    return getInitializedRepository(this.dataSource, PostPublicationTag);
  }

  private async getPostRepo(): Promise<Repository<Post>> {
    return getInitializedRepository(this.dataSource, Post);
  }

  private async getRevisionRepo(): Promise<Repository<PostRevision>> {
    return getInitializedRepository(this.dataSource, PostRevision);
  }

  private async getMediaRepo(): Promise<Repository<MediaAsset>> {
    return getInitializedRepository(this.dataSource, MediaAsset);
  }

  private async getCategoryRepo(): Promise<Repository<Category>> {
    return getInitializedRepository(this.dataSource, Category);
  }

  private async getTagRepo(): Promise<Repository<Tag>> {
    return getInitializedRepository(this.dataSource, Tag);
  }

  private checkSiteAccess(actor: EffectiveAuthContext, siteId: string): void {
    if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(siteId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }
  }

  async createPublication(
    actor: EffectiveAuthContext,
    postId: string,
    dto: CreatePublicationDto,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, dto.siteId);

    const postRepo = await this.getPostRepo();
    const publicationRepo = await this.getPublicationRepo();
    const revisionRepo = await this.getRevisionRepo();
    const mediaRepo = await this.getMediaRepo();
    const categoryRepo = await this.getCategoryRepo();
    const tagRepo = await this.getTagRepo();

    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    // 1. Uniqueness check for (site_id, post_id)
    const existingSitePost = await publicationRepo.findOne({
      where: { siteId: dto.siteId, postId },
    });
    if (existingSitePost) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'publication.sitePostConflict');
    }

    // 2. Uniqueness check for (site_id, slug)
    const existingSlug = await publicationRepo.findOne({
      where: { siteId: dto.siteId, slug: dto.slug.toLowerCase() },
    });
    if (existingSlug) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'publication.slugConflict');
    }

    // 3. Resolve pinned revision
    let revisionId = dto.revisionId;
    if (revisionId) {
      const revision = await revisionRepo.findOne({
        where: { id: revisionId, postId },
      });
      if (!revision) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'revision.notFound');
      }
    } else {
      const latestRev = await revisionRepo.findOne({
        where: { postId },
        order: { revisionNumber: 'DESC' },
      });
      if (!latestRev) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'revision.notFound');
      }
      revisionId = latestRev.id;
    }

    // 4. Validate featured image if provided
    if (dto.featuredImageId) {
      const media = await mediaRepo.findOne({
        where: { id: dto.featuredImageId, siteId: dto.siteId },
      });
      if (!media) {
        throw new ApiException(HttpStatus.BAD_REQUEST, 'NOT_FOUND', 'media.notFound');
      }
    }

    // 5. Validate categories and tags belong to the same site
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      for (const catId of dto.categoryIds) {
        const cat = await categoryRepo.findOne({
          where: { id: catId, siteId: dto.siteId },
        });
        if (!cat) {
          throw new ApiException(HttpStatus.BAD_REQUEST, 'NOT_FOUND', 'category.notFound');
        }
      }
    }

    if (dto.tagIds && dto.tagIds.length > 0) {
      for (const tagId of dto.tagIds) {
        const tag = await tagRepo.findOne({
          where: { id: tagId, siteId: dto.siteId },
        });
        if (!tag) {
          throw new ApiException(HttpStatus.BAD_REQUEST, 'NOT_FOUND', 'tag.notFound');
        }
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const pubRepo = manager.getRepository(PostPublication);
      const pubCatRepo = manager.getRepository(PostPublicationCategory);
      const pubTagRepo = manager.getRepository(PostPublicationTag);

      const pub = pubRepo.create({
        siteId: dto.siteId,
        postId,
        revisionId,
        slug: dto.slug.toLowerCase().trim(),
        status: dto.status ?? 'draft',
        seoTitle: dto.seoTitle?.trim() || null,
        seoDescription: dto.seoDescription?.trim() || null,
        canonicalUrl: dto.canonicalUrl?.trim() || null,
        featuredImageId: dto.featuredImageId || null,
        templateKey: dto.templateKey?.trim() || null,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        publishedAt:
          dto.status === 'published'
            ? dto.publishedAt
              ? new Date(dto.publishedAt)
              : new Date()
            : null,
      });

      const savedPub = await pubRepo.save(pub);

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        for (const catId of dto.categoryIds) {
          await pubCatRepo.save(
            pubCatRepo.create({
              publicationId: savedPub.id,
              categoryId: catId,
              siteId: dto.siteId,
            }),
          );
        }
      }

      if (dto.tagIds && dto.tagIds.length > 0) {
        for (const tagId of dto.tagIds) {
          await pubTagRepo.save(
            pubTagRepo.create({
              publicationId: savedPub.id,
              tagId,
              siteId: dto.siteId,
            }),
          );
        }
      }

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId: savedPub.siteId,
        action: 'publication.create',
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          slug: savedPub.slug,
          status: savedPub.status,
          postId: savedPub.postId,
        },
      });

      return this.mapToItem(savedPub, dto.categoryIds, dto.tagIds);
    });
  }

  async listPublicationsForSite(
    actor: EffectiveAuthContext,
    siteId: string,
    query: ListPublicationsQueryDto,
  ): Promise<PaginatedResult<PostPublicationItem>> {
    this.checkSiteAccess(actor, siteId);

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const publicationRepo = await this.getPublicationRepo();
    const pubCategoryRepo = await this.getPubCategoryRepo();
    const pubTagRepo = await this.getPubTagRepo();

    const qb = publicationRepo
      .createQueryBuilder('pp')
      .where('pp.site_id = :siteId', { siteId })
      .orderBy('pp.created_at', 'DESC');

    if (query.status) {
      qb.andWhere('pp.status = :status', { status: query.status });
    }

    if (query.categoryId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM post_publication_categories ppc WHERE ppc.publication_id = pp.id AND ppc.category_id = :catId)',
        { catId: query.categoryId },
      );
    }

    if (query.tagId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM post_publication_tags ppt WHERE ppt.publication_id = pp.id AND ppt.tag_id = :tagId)',
        { tagId: query.tagId },
      );
    }

    if (query.search) {
      qb.andWhere('(pp.slug ILIKE :search OR pp.seo_title ILIKE :search)', {
        search: `%${query.search.trim()}%`,
      });
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const resultItems: PostPublicationItem[] = [];
    for (const item of items) {
      const categories = await pubCategoryRepo.find({
        where: { publicationId: item.id },
      });
      const tags = await pubTagRepo.find({
        where: { publicationId: item.id },
      });
      resultItems.push(
        this.mapToItem(
          item,
          categories.map((c) => c.categoryId),
          tags.map((t) => t.tagId),
        ),
      );
    }

    return {
      items: resultItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getPublication(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pubCategoryRepo = await this.getPubCategoryRepo();
    const pubTagRepo = await this.getPubTagRepo();

    const pub = await publicationRepo.findOne({
      where: { id: publicationId, siteId },
    });

    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    const categories = await pubCategoryRepo.find({
      where: { publicationId: pub.id },
    });
    const tags = await pubTagRepo.find({
      where: { publicationId: pub.id },
    });

    return this.mapToItem(
      pub,
      categories.map((c) => c.categoryId),
      tags.map((t) => t.tagId),
    );
  }

  async updatePublication(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
    dto: UpdatePublicationDto,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const revisionRepo = await this.getRevisionRepo();
    const mediaRepo = await this.getMediaRepo();

    const pub = await publicationRepo.findOne({
      where: { id: publicationId, siteId },
    });

    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (dto.slug && dto.slug.toLowerCase() !== pub.slug) {
      const existingSlug = await publicationRepo.findOne({
        where: { siteId, slug: dto.slug.toLowerCase() },
      });
      if (existingSlug && existingSlug.id !== publicationId) {
        throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'publication.slugConflict');
      }
      pub.slug = dto.slug.toLowerCase();
    }

    if (dto.revisionId && dto.revisionId !== pub.revisionId) {
      const revision = await revisionRepo.findOne({
        where: { id: dto.revisionId, postId: pub.postId },
      });
      if (!revision) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'revision.notFound');
      }
      pub.revisionId = dto.revisionId;
    }

    if (dto.featuredImageId !== undefined) {
      if (dto.featuredImageId) {
        const media = await mediaRepo.findOne({
          where: { id: dto.featuredImageId, siteId },
        });
        if (!media) {
          throw new ApiException(HttpStatus.BAD_REQUEST, 'NOT_FOUND', 'media.notFound');
        }
      }
      pub.featuredImageId = dto.featuredImageId || null;
    }

    if (dto.seoTitle !== undefined) {
      pub.seoTitle = dto.seoTitle?.trim() || null;
    }
    if (dto.seoDescription !== undefined) {
      pub.seoDescription = dto.seoDescription?.trim() || null;
    }
    if (dto.canonicalUrl !== undefined) {
      pub.canonicalUrl = dto.canonicalUrl?.trim() || null;
    }
    if (dto.templateKey !== undefined) {
      pub.templateKey = dto.templateKey?.trim() || null;
    }
    if (dto.scheduledFor !== undefined) {
      pub.scheduledFor = dto.scheduledFor ? new Date(dto.scheduledFor) : null;
    }
    if (dto.publishedAt !== undefined) {
      pub.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    }

    const previousStatus = pub.status;
    if (dto.status !== undefined) {
      pub.status = dto.status;
      if (dto.status === 'published' && !pub.publishedAt) {
        pub.publishedAt = new Date();
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const txPubRepo = manager.getRepository(PostPublication);
      const pubCatRepo = manager.getRepository(PostPublicationCategory);
      const pubTagRepo = manager.getRepository(PostPublicationTag);

      const savedPub = await txPubRepo.save(pub);

      if (dto.categoryIds !== undefined) {
        await pubCatRepo.delete({ publicationId: savedPub.id });
        for (const catId of dto.categoryIds) {
          await pubCatRepo.save(
            pubCatRepo.create({
              publicationId: savedPub.id,
              categoryId: catId,
              siteId,
            }),
          );
        }
      }

      if (dto.tagIds !== undefined) {
        await pubTagRepo.delete({ publicationId: savedPub.id });
        for (const tagId of dto.tagIds) {
          await pubTagRepo.save(
            pubTagRepo.create({
              publicationId: savedPub.id,
              tagId,
              siteId,
            }),
          );
        }
      }

      const currentCats = await pubCatRepo.find({ where: { publicationId: savedPub.id } });
      const currentTags = await pubTagRepo.find({ where: { publicationId: savedPub.id } });

      const action =
        dto.status === 'published' && previousStatus !== 'published'
          ? 'publication.publish'
          : 'publication.update';

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId,
        action,
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          slug: savedPub.slug,
          status: savedPub.status,
          revisionId: savedPub.revisionId,
        },
      });

      return this.mapToItem(
        savedPub,
        currentCats.map((c) => c.categoryId),
        currentTags.map((t) => t.tagId),
      );
    });
  }

  async deletePublication(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
  ): Promise<void> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({
      where: { id: publicationId, siteId },
    });

    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    pub.status = 'archived';
    await publicationRepo.save(pub);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action: 'publication.archive',
      entityType: 'post_publication',
      entityId: pub.id,
      metadata: { slug: pub.slug, status: 'archived' },
    });
  }

  private mapToItem(
    pub: PostPublication,
    categoryIds?: string[],
    tagIds?: string[],
  ): PostPublicationItem {
    return {
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
      categoryIds,
      tagIds,
    };
  }
}
