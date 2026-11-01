import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type DataSource, type Repository } from 'typeorm';

import type { CategoryItem, PaginatedResult, TagItem } from '@multi-site-cms/types';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { DATA_SOURCE } from '../database/database.tokens';
import { Category } from '../database/entities/category.entity';
import { Tag } from '../database/entities/tag.entity';
import { getInitializedRepository } from '../database/ensure-connected';
import {
  CreateCategoryDto,
  CreateTagDto,
  ListTaxonomyQueryDto,
  UpdateCategoryDto,
  UpdateTagDto,
} from './dto';
import { validateCategoryHierarchy } from './utils/category-validator';

@Injectable()
export class TaxonomyService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

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

  // --- CATEGORIES ---

  async createCategory(
    actor: EffectiveAuthContext,
    siteId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryItem> {
    this.checkSiteAccess(actor, siteId);
    const categoryRepo = await this.getCategoryRepo();

    const existingSlug = await categoryRepo.findOne({
      where: { siteId, slug: dto.slug },
    });
    if (existingSlug) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'category.slugConflict');
    }

    if (dto.parentId) {
      const parent = await categoryRepo.findOne({
        where: { id: dto.parentId, siteId },
      });
      if (!parent) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'category.notFound');
      }
    }

    const category = categoryRepo.create({
      siteId,
      name: dto.name.trim(),
      slug: dto.slug.trim().toLowerCase(),
      description: dto.description?.trim() || null,
      parentId: dto.parentId || null,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    const saved = await categoryRepo.save(category);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action: 'category.create',
      entityType: 'category',
      entityId: saved.id,
      metadata: { name: saved.name, slug: saved.slug, parentId: saved.parentId },
    });

    return this.mapCategoryToItem(saved);
  }

  async listCategories(
    actor: EffectiveAuthContext,
    siteId: string,
    query: ListTaxonomyQueryDto,
  ): Promise<PaginatedResult<CategoryItem>> {
    this.checkSiteAccess(actor, siteId);
    const categoryRepo = await this.getCategoryRepo();

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const qb = categoryRepo
      .createQueryBuilder('cat')
      .where('cat.site_id = :siteId', { siteId })
      .orderBy('cat.display_order', 'ASC')
      .addOrderBy('cat.name', 'ASC');

    if (query.search) {
      qb.andWhere('(cat.name ILIKE :search OR cat.slug ILIKE :search)', {
        search: `%${query.search.trim()}%`,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('cat.is_active = :isActive', { isActive: query.isActive });
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items: items.map((cat) => this.mapCategoryToItem(cat)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getCategory(
    actor: EffectiveAuthContext,
    siteId: string,
    categoryId: string,
  ): Promise<CategoryItem> {
    this.checkSiteAccess(actor, siteId);
    const categoryRepo = await this.getCategoryRepo();

    const category = await categoryRepo.findOne({
      where: { id: categoryId, siteId },
    });

    if (!category) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'category.notFound');
    }

    return this.mapCategoryToItem(category);
  }

  async updateCategory(
    actor: EffectiveAuthContext,
    siteId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryItem> {
    this.checkSiteAccess(actor, siteId);
    const categoryRepo = await this.getCategoryRepo();

    const category = await categoryRepo.findOne({
      where: { id: categoryId, siteId },
    });

    if (!category) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'category.notFound');
    }

    if (dto.slug && dto.slug.toLowerCase() !== category.slug) {
      const existingSlug = await categoryRepo.findOne({
        where: { siteId, slug: dto.slug.toLowerCase() },
      });
      if (existingSlug && existingSlug.id !== categoryId) {
        throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'category.slugConflict');
      }
      category.slug = dto.slug.toLowerCase();
    }

    if (dto.name !== undefined) {
      category.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      category.description = dto.description?.trim() || null;
    }

    if (dto.displayOrder !== undefined) {
      category.displayOrder = dto.displayOrder;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId) {
        const parent = await categoryRepo.findOne({
          where: { id: dto.parentId, siteId },
        });
        if (!parent) {
          throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'category.notFound');
        }

        const allCategories = await categoryRepo.find({
          where: { siteId },
          select: { id: true, parentId: true },
        });

        const hierarchyCheck = validateCategoryHierarchy(categoryId, dto.parentId, allCategories);
        if (!hierarchyCheck.isValid) {
          throw new ApiException(
            HttpStatus.BAD_REQUEST,
            'VALIDATION_ERROR',
            'category.cycleDetected',
          );
        }
      }
      category.parentId = dto.parentId || null;
    }

    const saved = await categoryRepo.save(category);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action: 'category.update',
      entityType: 'category',
      entityId: saved.id,
      metadata: { name: saved.name, slug: saved.slug, parentId: saved.parentId },
    });

    return this.mapCategoryToItem(saved);
  }

  async deleteCategory(
    actor: EffectiveAuthContext,
    siteId: string,
    categoryId: string,
  ): Promise<void> {
    this.checkSiteAccess(actor, siteId);
    const categoryRepo = await this.getCategoryRepo();

    const category = await categoryRepo.findOne({
      where: { id: categoryId, siteId },
    });

    if (!category) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'category.notFound');
    }

    const hasChildren = await categoryRepo.count({
      where: { parentId: categoryId, siteId },
    });
    if (hasChildren > 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'category.cannotDeleteWithChildren',
      );
    }

    await categoryRepo.remove(category);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action: 'category.delete',
      entityType: 'category',
      entityId: categoryId,
      metadata: { name: category.name, slug: category.slug },
    });
  }

  // --- TAGS ---

  async createTag(
    actor: EffectiveAuthContext,
    siteId: string,
    dto: CreateTagDto,
  ): Promise<TagItem> {
    this.checkSiteAccess(actor, siteId);
    const tagRepo = await this.getTagRepo();

    const existingSlug = await tagRepo.findOne({
      where: { siteId, slug: dto.slug.toLowerCase() },
    });
    if (existingSlug) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'tag.slugConflict');
    }

    const tag = tagRepo.create({
      siteId,
      name: dto.name.trim(),
      slug: dto.slug.trim().toLowerCase(),
      description: dto.description?.trim() || null,
    });

    const saved = await tagRepo.save(tag);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action: 'tag.create',
      entityType: 'tag',
      entityId: saved.id,
      metadata: { name: saved.name, slug: saved.slug },
    });

    return this.mapTagToItem(saved);
  }

  async listTags(
    actor: EffectiveAuthContext,
    siteId: string,
    query: ListTaxonomyQueryDto,
  ): Promise<PaginatedResult<TagItem>> {
    this.checkSiteAccess(actor, siteId);
    const tagRepo = await this.getTagRepo();

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const qb = tagRepo
      .createQueryBuilder('t')
      .where('t.site_id = :siteId', { siteId })
      .orderBy('t.name', 'ASC');

    if (query.search) {
      qb.andWhere('(t.name ILIKE :search OR t.slug ILIKE :search)', {
        search: `%${query.search.trim()}%`,
      });
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items: items.map((t) => this.mapTagToItem(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getTag(actor: EffectiveAuthContext, siteId: string, tagId: string): Promise<TagItem> {
    this.checkSiteAccess(actor, siteId);
    const tagRepo = await this.getTagRepo();

    const tag = await tagRepo.findOne({
      where: { id: tagId, siteId },
    });

    if (!tag) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'tag.notFound');
    }

    return this.mapTagToItem(tag);
  }

  async updateTag(
    actor: EffectiveAuthContext,
    siteId: string,
    tagId: string,
    dto: UpdateTagDto,
  ): Promise<TagItem> {
    this.checkSiteAccess(actor, siteId);
    const tagRepo = await this.getTagRepo();

    const tag = await tagRepo.findOne({
      where: { id: tagId, siteId },
    });

    if (!tag) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'tag.notFound');
    }

    if (dto.slug && dto.slug.toLowerCase() !== tag.slug) {
      const existingSlug = await tagRepo.findOne({
        where: { siteId, slug: dto.slug.toLowerCase() },
      });
      if (existingSlug && existingSlug.id !== tagId) {
        throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'tag.slugConflict');
      }
      tag.slug = dto.slug.toLowerCase();
    }

    if (dto.name !== undefined) {
      tag.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      tag.description = dto.description?.trim() || null;
    }

    const saved = await tagRepo.save(tag);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action: 'tag.update',
      entityType: 'tag',
      entityId: saved.id,
      metadata: { name: saved.name, slug: saved.slug },
    });

    return this.mapTagToItem(saved);
  }

  async deleteTag(actor: EffectiveAuthContext, siteId: string, tagId: string): Promise<void> {
    this.checkSiteAccess(actor, siteId);
    const tagRepo = await this.getTagRepo();

    const tag = await tagRepo.findOne({
      where: { id: tagId, siteId },
    });

    if (!tag) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'tag.notFound');
    }

    await tagRepo.remove(tag);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action: 'tag.delete',
      entityType: 'tag',
      entityId: tagId,
      metadata: { name: tag.name, slug: tag.slug },
    });
  }

  private mapCategoryToItem(cat: Category): CategoryItem {
    return {
      id: cat.id,
      siteId: cat.siteId,
      slug: cat.slug,
      name: cat.name,
      description: cat.description,
      parentId: cat.parentId,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    };
  }

  private mapTagToItem(tag: Tag): TagItem {
    return {
      id: tag.id,
      siteId: tag.siteId,
      slug: tag.slug,
      name: tag.name,
      description: tag.description,
      createdAt: tag.createdAt.toISOString(),
    };
  }
}
