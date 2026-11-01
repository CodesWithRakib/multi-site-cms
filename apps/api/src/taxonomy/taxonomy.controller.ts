import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { CategoryItem, PaginatedResult, TagItem } from '@multi-site-cms/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import {
  CreateCategoryDto,
  CreateTagDto,
  ListTaxonomyQueryDto,
  UpdateCategoryDto,
  UpdateTagDto,
} from './dto';
import { TaxonomyService } from './taxonomy.service';

@ApiTags('Taxonomy')
@Controller('sites/:siteId')
@UseGuards(AuthGuard, PermissionsGuard)
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  // --- CATEGORIES ---

  @Post('categories')
  @RequirePermissions('taxonomy:manage')
  @ApiOperation({ summary: 'Create a new category for a site' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryItem> {
    return this.taxonomyService.createCategory(actor, siteId, dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List categories for a site' })
  @ApiResponse({ status: 200, description: 'Paginated category list' })
  async listCategories(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Query() query: ListTaxonomyQueryDto,
  ): Promise<PaginatedResult<CategoryItem>> {
    return this.taxonomyService.listCategories(actor, siteId, query);
  }

  @Get('categories/:categoryId')
  @ApiOperation({ summary: 'Get category details' })
  @ApiResponse({ status: 200, description: 'Category details' })
  async getCategory(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
  ): Promise<CategoryItem> {
    return this.taxonomyService.getCategory(actor, siteId, categoryId);
  }

  @Patch('categories/:categoryId')
  @RequirePermissions('taxonomy:manage')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateCategory(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryItem> {
    return this.taxonomyService.updateCategory(actor, siteId, categoryId, dto);
  }

  @Delete('categories/:categoryId')
  @RequirePermissions('taxonomy:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  async deleteCategory(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
  ): Promise<void> {
    return this.taxonomyService.deleteCategory(actor, siteId, categoryId);
  }

  // --- TAGS ---

  @Post('tags')
  @RequirePermissions('taxonomy:manage')
  @ApiOperation({ summary: 'Create a new tag for a site' })
  @ApiResponse({ status: 201, description: 'Tag created' })
  async createTag(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Body() dto: CreateTagDto,
  ): Promise<TagItem> {
    return this.taxonomyService.createTag(actor, siteId, dto);
  }

  @Get('tags')
  @ApiOperation({ summary: 'List tags for a site' })
  @ApiResponse({ status: 200, description: 'Paginated tag list' })
  async listTags(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Query() query: ListTaxonomyQueryDto,
  ): Promise<PaginatedResult<TagItem>> {
    return this.taxonomyService.listTags(actor, siteId, query);
  }

  @Get('tags/:tagId')
  @ApiOperation({ summary: 'Get tag details' })
  @ApiResponse({ status: 200, description: 'Tag details' })
  async getTag(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('tagId', new ParseUUIDPipe({ version: '4' })) tagId: string,
  ): Promise<TagItem> {
    return this.taxonomyService.getTag(actor, siteId, tagId);
  }

  @Patch('tags/:tagId')
  @RequirePermissions('taxonomy:manage')
  @ApiOperation({ summary: 'Update tag' })
  @ApiResponse({ status: 200, description: 'Tag updated' })
  async updateTag(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('tagId', new ParseUUIDPipe({ version: '4' })) tagId: string,
    @Body() dto: UpdateTagDto,
  ): Promise<TagItem> {
    return this.taxonomyService.updateTag(actor, siteId, tagId, dto);
  }

  @Delete('tags/:tagId')
  @RequirePermissions('taxonomy:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tag' })
  @ApiResponse({ status: 204, description: 'Tag deleted' })
  async deleteTag(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('tagId', new ParseUUIDPipe({ version: '4' })) tagId: string,
  ): Promise<void> {
    return this.taxonomyService.deleteTag(actor, siteId, tagId);
  }
}
