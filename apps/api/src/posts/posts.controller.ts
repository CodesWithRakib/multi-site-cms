import type { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type {
  PaginatedResult,
  PostItem,
  PostPreviewData,
  PostPublicationItem,
  PostRevisionItem,
  PreviewTokenResponse,
} from '@multi-site-cms/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import {
  CreatePostDto,
  CreatePublicationDto,
  ListPostsQueryDto,
  RestoreRevisionDto,
  UpdatePostDto,
} from './dto';
import { PostsService } from './posts.service';
import { PublicationsService } from './publications.service';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(AuthGuard, PermissionsGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly publicationsService: PublicationsService,
  ) {}

  @Post()
  @RequirePermissions('post:create')
  @ApiOperation({ summary: 'Create a new canonical post with initial revision' })
  @ApiResponse({ status: 201, description: 'Post created' })
  async createPost(
    @CurrentUser() actor: EffectiveAuthContext,
    @Body() dto: CreatePostDto,
  ): Promise<PostItem> {
    return this.postsService.createPost(actor, dto);
  }

  @Get()
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'List canonical posts' })
  @ApiResponse({ status: 200, description: 'Paginated post list' })
  async listPosts(
    @CurrentUser() actor: EffectiveAuthContext,
    @Query() query: ListPostsQueryDto,
  ): Promise<PaginatedResult<PostItem>> {
    return this.postsService.listPosts(actor, query);
  }

  @Get(':postId')
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'Get canonical post details' })
  @ApiResponse({ status: 200, description: 'Post details' })
  async getPost(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
  ): Promise<PostItem> {
    return this.postsService.getPost(actor, postId);
  }

  @Patch(':postId')
  @RequirePermissions('post:update')
  @ApiOperation({ summary: 'Update canonical post / create new revision with concurrency check' })
  @ApiResponse({ status: 200, description: 'Post updated' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  async updatePost(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostItem> {
    return this.postsService.updatePost(actor, postId, dto);
  }

  @Delete(':postId')
  @RequirePermissions('post:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive / soft-delete canonical post' })
  @ApiResponse({ status: 204, description: 'Post archived' })
  async archivePost(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
  ): Promise<void> {
    return this.postsService.archivePost(actor, postId);
  }

  @Post(':postId/restore')
  @RequirePermissions('post:delete')
  @ApiOperation({ summary: 'Restore archived canonical post (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Post restored' })
  async restorePost(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
  ): Promise<PostItem> {
    return this.postsService.restorePost(actor, postId);
  }

  // --- REVISIONS ---

  @Get(':postId/revisions')
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'List revision history for a post' })
  @ApiResponse({ status: 200, description: 'Revision history list' })
  async listRevisions(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
  ): Promise<PostRevisionItem[]> {
    return this.postsService.listRevisions(actor, postId);
  }

  @Get(':postId/revisions/:revisionNumber')
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'Get specific revision snapshot details' })
  @ApiResponse({ status: 200, description: 'Revision snapshot' })
  async getRevision(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Param('revisionNumber', ParseIntPipe) revisionNumber: number,
  ): Promise<PostRevisionItem> {
    return this.postsService.getRevision(actor, postId, revisionNumber);
  }

  @Post(':postId/revisions/:revisionNumber/restore')
  @RequirePermissions('post:update')
  @ApiOperation({ summary: 'Restore historical revision by creating a new revision' })
  @ApiResponse({ status: 201, description: 'New revision created from historical snapshot' })
  async restoreRevision(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Param('revisionNumber', ParseIntPipe) revisionNumber: number,
    @Body() dto: RestoreRevisionDto,
  ): Promise<PostRevisionItem> {
    return this.postsService.restoreRevision(actor, postId, revisionNumber, dto);
  }

  // --- PUBLICATIONS ON POST ---

  @Post(':postId/publications')
  @RequirePermissions('publication:publish')
  @ApiOperation({ summary: 'Create publication of this post on a specific site' })
  @ApiResponse({ status: 201, description: 'Publication created' })
  async createPublication(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Body() dto: CreatePublicationDto,
  ): Promise<PostPublicationItem> {
    return this.publicationsService.createPublication(actor, postId, dto);
  }

  // --- PREVIEW SYSTEM ---

  @Post(':postId/preview-token')
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'Generate short-lived signed preview token for post draft' })
  @ApiResponse({ status: 201, description: 'Preview token generated' })
  async generatePreviewToken(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Query('siteId') siteId?: string,
  ): Promise<PreviewTokenResponse> {
    return this.postsService.generatePreviewToken(actor, postId, siteId);
  }

  @Get(':postId/preview')
  @Public()
  @ApiOperation({ summary: 'Render authenticated post draft preview with simulated site context' })
  @ApiResponse({ status: 200, description: 'Post preview content' })
  async getPostPreview(
    @Param('postId', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Query('token') token: string,
    @Query('siteId') siteId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostPreviewData> {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return this.postsService.getPostPreview(postId, token, siteId);
  }
}
