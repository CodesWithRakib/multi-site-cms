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

import type { MediaAssetItem, PaginatedResult } from '@multi-site-cms/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { CreateMediaDto, ListMediaQueryDto, UpdateMediaDto } from './dto';
import { MediaService } from './media.service';

@ApiTags('Media')
@Controller('media')
@UseGuards(AuthGuard, PermissionsGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

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
