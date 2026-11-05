import type { Request, Response } from 'express';
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
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { MediaAssetItem, MediaUploadResponse, PaginatedResult } from '@multi-site-cms/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { CreateMediaDto, ListMediaQueryDto, UpdateMediaDto, UploadMediaDto } from './dto';
import { MediaService } from './media.service';
import type { UploadedFilePayload } from './storage/storage-provider.interface';

@ApiTags('Media')
@Controller('media')
@UseGuards(AuthGuard, PermissionsGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @RequirePermissions('media:upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a binary media asset file' })
  @ApiResponse({ status: 201, description: 'Media file uploaded and asset created' })
  async uploadMedia(
    @CurrentUser() actor: EffectiveAuthContext,
    @UploadedFile() file: UploadedFilePayload,
    @Body() dto: UploadMediaDto,
  ): Promise<MediaUploadResponse> {
    return this.mediaService.uploadMedia(actor, file, dto);
  }

  @Post()
  @RequirePermissions('media:upload')
  @ApiOperation({ summary: 'Register a new media asset metadata record' })
  @ApiResponse({ status: 201, description: 'Media asset created' })
  async createMedia(
    @CurrentUser() actor: EffectiveAuthContext,
    @Body() dto: CreateMediaDto,
  ): Promise<MediaAssetItem> {
    return this.mediaService.createMedia(actor, dto);
  }

  @Get('assets/*')
  @Public()
  @ApiOperation({ summary: 'Stream or serve media asset binary content' })
  async getAsset(
    @Param() params: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const urlPath = req.originalUrl || req.url;
    const match = urlPath.match(/\/media\/assets\/(.+?)(\?|$)/);
    const rawPath =
      match && match[1] ? match[1] : (req.params as Record<string, string>)[0] || params['0'] || '';
    const storageKey = decodeURIComponent(rawPath);
    const { stream, mimeType, byteSize, filename } =
      await this.mediaService.getMediaStream(storageKey);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', byteSize);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (mimeType === 'image/svg+xml') {
      // SVG is a document that can carry script. Upload sanitizing is a regex
      // pass, so opening the file directly is also sandboxed: no script, no
      // same-origin access, styles only. <img> rendering is unaffected.
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
      );
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const isInline = mimeType.startsWith('image/') || mimeType === 'application/pdf';
    const disposition = isInline ? 'inline' : 'attachment';
    if (filename) {
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(filename)}"`,
      );
    } else {
      res.setHeader('Content-Disposition', disposition);
    }

    stream.pipe(res);
  }

  @Get()
  @ApiOperation({ summary: 'List media assets' })
  @ApiResponse({ status: 200, description: 'Paginated media asset list' })
  async listMedia(
    @CurrentUser() actor: EffectiveAuthContext,
    @Query() query: ListMediaQueryDto,
  ): Promise<PaginatedResult<MediaAssetItem>> {
    return this.mediaService.listMedia(actor, query);
  }

  @Get(':mediaId')
  @ApiOperation({ summary: 'Get media asset metadata details' })
  @ApiResponse({ status: 200, description: 'Media asset details' })
  async getMedia(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('mediaId', new ParseUUIDPipe({ version: '4' })) mediaId: string,
  ): Promise<MediaAssetItem> {
    return this.mediaService.getMedia(actor, mediaId);
  }

  @Patch(':mediaId')
  @RequirePermissions('media:upload')
  @ApiOperation({ summary: 'Update media asset metadata' })
  @ApiResponse({ status: 200, description: 'Media asset updated' })
  async updateMedia(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('mediaId', new ParseUUIDPipe({ version: '4' })) mediaId: string,
    @Body() dto: UpdateMediaDto,
  ): Promise<MediaAssetItem> {
    return this.mediaService.updateMedia(actor, mediaId, dto);
  }

  @Delete(':mediaId')
  @RequirePermissions('media:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete / archive media asset' })
  @ApiResponse({ status: 204, description: 'Media asset archived' })
  async deleteMedia(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('mediaId', new ParseUUIDPipe({ version: '4' })) mediaId: string,
  ): Promise<void> {
    return this.mediaService.deleteMedia(actor, mediaId);
  }
}
