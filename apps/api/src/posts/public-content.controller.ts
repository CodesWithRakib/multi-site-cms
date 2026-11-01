import { createHash, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { Controller, Get, HttpStatus, Param, ParseUUIDPipe, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import type { RequestContext } from '../common/http/request-context';
import { ListPublicPostsQueryDto } from './dto/list-public-posts-query.dto';
import { PublicContentService } from './public-content.service';

@ApiTags('Public Content')
@Controller('public/sites/:siteKey')
@Public()
export class PublicContentController {
  constructor(private readonly publicContentService: PublicContentService) {}

  private sendWithEtag(
    req: Request,
    res: Response,
    contentForHash: unknown,
    buildPayload: (requestId: string) => unknown,
    cacheControl = 'public, max-age=60, stale-while-revalidate=300',
  ): void {
    const jsonString = JSON.stringify(contentForHash);
    const hash = createHash('sha256').update(jsonString).digest('hex');
    const etag = `"${hash}"`;

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', cacheControl);

    if (req.headers['if-none-match'] === etag) {
      res.status(HttpStatus.NOT_MODIFIED).end();
      return;
    }

    const requestId = (req as RequestContext).requestId ?? randomUUID();
    res.status(HttpStatus.OK).json(buildPayload(requestId));
  }

  @Get('posts')
  @ApiOperation({ summary: 'List published articles for a public site' })
  @ApiResponse({ status: 200, description: 'Paginated published articles' })
  async listPosts(
    @Param('siteKey') siteKey: string,
    @Query() query: ListPublicPostsQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.publicContentService.listPublishedPosts(siteKey, query);

    this.sendWithEtag(
      req,
      res,
      { items: result.items, total: result.total, page: result.page, limit: result.limit },
      (requestId) => ({
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      }),
      'public, max-age=60, stale-while-revalidate=300',
    );
  }

  @Get('posts/:slug')
  @ApiOperation({ summary: 'Get published article details by publication slug' })
  @ApiResponse({ status: 200, description: 'Published article details' })
  @ApiResponse({ status: 404, description: 'Article not found or unpublished' })
  async getPostBySlug(
    @Param('siteKey') siteKey: string,
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const article = await this.publicContentService.getPublishedPostBySlug(siteKey, slug);

    this.sendWithEtag(
      req,
      res,
      article,
      (requestId) => ({
        data: article,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      }),
      'public, max-age=60, stale-while-revalidate=300',
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'List active public categories with published post counts' })
  @ApiResponse({ status: 200, description: 'Active categories' })
  async listCategories(
    @Param('siteKey') siteKey: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const categories = await this.publicContentService.listPublishedCategories(siteKey);

    this.sendWithEtag(
      req,
      res,
      categories,
      (requestId) => ({
        data: categories,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      }),
      'public, max-age=300, stale-while-revalidate=600',
    );
  }

  @Get('tags')
  @ApiOperation({ summary: 'List active public tags with published post counts' })
  @ApiResponse({ status: 200, description: 'Active tags' })
  async listTags(
    @Param('siteKey') siteKey: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const tags = await this.publicContentService.listPublishedTags(siteKey);

    this.sendWithEtag(
      req,
      res,
      tags,
      (requestId) => ({
        data: tags,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      }),
      'public, max-age=300, stale-while-revalidate=600',
    );
  }

  @Get('sitemap')
  @ApiOperation({ summary: 'Get published publication slugs and timestamps for XML sitemap' })
  @ApiResponse({ status: 200, description: 'Sitemap index entries' })
  async getSitemap(
    @Param('siteKey') siteKey: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const entries = await this.publicContentService.getSitemapEntries(siteKey);

    this.sendWithEtag(
      req,
      res,
      entries,
      (requestId) => ({
        data: entries,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      }),
      'public, max-age=600, stale-while-revalidate=1200',
    );
  }

  @Get('preview/:postId')
  @ApiOperation({ summary: 'Load authenticated draft preview with signed token' })
  @ApiQuery({ name: 'token', required: true, description: 'Signed preview token' })
  @ApiResponse({ status: 200, description: 'Preview article detail' })
  @ApiResponse({ status: 401, description: 'Invalid or expired preview token' })
  async getPreview(
    @Param('siteKey') siteKey: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const article = await this.publicContentService.getDraftPreview(postId, token, siteKey);
    const requestId = (req as RequestContext).requestId ?? randomUUID();

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');

    res.status(HttpStatus.OK).json({
      data: article,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
