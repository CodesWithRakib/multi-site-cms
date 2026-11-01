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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { PaginatedResult, PostPublicationItem } from '@multi-site-cms/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { ListPublicationsQueryDto, UpdatePublicationDto } from './dto';
import { PublicationsService } from './publications.service';

@ApiTags('Publications')
@Controller('sites/:siteId/publications')
@UseGuards(AuthGuard, PermissionsGuard)
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Get()
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'List publications for a site' })
  @ApiResponse({ status: 200, description: 'Paginated publications list' })
  async listPublications(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Query() query: ListPublicationsQueryDto,
  ): Promise<PaginatedResult<PostPublicationItem>> {
    return this.publicationsService.listPublicationsForSite(actor, siteId, query);
  }

  @Get(':publicationId')
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'Get publication details for a site' })
  @ApiResponse({ status: 200, description: 'Publication details' })
  async getPublication(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
  ): Promise<PostPublicationItem> {
    return this.publicationsService.getPublication(actor, siteId, publicationId);
  }

  @Patch(':publicationId')
  @RequirePermissions('publication:publish')
  @ApiOperation({ summary: 'Update publication settings, status, or taxonomy' })
  @ApiResponse({ status: 200, description: 'Publication updated' })
  async updatePublication(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
    @Body() dto: UpdatePublicationDto,
  ): Promise<PostPublicationItem> {
    return this.publicationsService.updatePublication(actor, siteId, publicationId, dto);
  }

  @Delete(':publicationId')
  @RequirePermissions('publication:archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unpublish / archive publication' })
  @ApiResponse({ status: 204, description: 'Publication archived' })
  async deletePublication(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
  ): Promise<void> {
    return this.publicationsService.deletePublication(actor, siteId, publicationId);
  }
}
