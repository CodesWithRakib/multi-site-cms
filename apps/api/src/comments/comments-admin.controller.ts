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
import type { AdminCommentItem, AdminCommentsListResult } from '@multi-site-cms/types';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { CommentsAdminService } from './comments-admin.service';
import { BatchUpdateCommentsDto } from './dto/batch-update-comments.dto';
import { ListAdminCommentsQueryDto } from './dto/list-admin-comments-query.dto';
import { UpdateCommentStatusDto } from './dto/update-comment-status.dto';

@ApiTags('Comments Moderation')
@Controller('comments')
@UseGuards(AuthGuard, PermissionsGuard)
export class CommentsAdminController {
  constructor(private readonly commentsService: CommentsAdminService) {}

  @Get()
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'List comments for admin moderation with filtering and status counts' })
  @ApiResponse({ status: 200, description: 'Paginated comments list with counts' })
  async listComments(
    @Query() query: ListAdminCommentsQueryDto,
  ): Promise<AdminCommentsListResult> {
    return this.commentsService.listComments(query);
  }

  @Patch(':id/status')
  @RequirePermissions('post:update')
  @ApiOperation({ summary: 'Update moderation status of a specific comment' })
  @ApiResponse({ status: 200, description: 'Updated comment item' })
  async updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCommentStatusDto,
    @CurrentUser() actor: EffectiveAuthContext,
  ): Promise<AdminCommentItem> {
    return this.commentsService.updateCommentStatus(id, dto.status, actor.user.id);
  }

  @Post('batch')
  @RequirePermissions('post:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update moderation status for multiple comments' })
  @ApiResponse({ status: 200, description: 'Updated count' })
  async batchUpdate(
    @Body() dto: BatchUpdateCommentsDto,
    @CurrentUser() actor: EffectiveAuthContext,
  ): Promise<{ updatedCount: number }> {
    return this.commentsService.batchUpdateStatus(dto, actor.user.id);
  }

  @Delete(':id')
  @RequirePermissions('post:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete an offensive or spam comment' })
  @ApiResponse({ status: 204, description: 'Comment permanently deleted' })
  async deleteComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: EffectiveAuthContext,
  ): Promise<void> {
    await this.commentsService.deleteComment(id, actor.user.id);
  }
}
