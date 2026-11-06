import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { PostPublicationItem } from '@multi-site-cms/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import {
  ArchivePublicationDto,
  CancelScheduleDto,
  ReschedulePublicationDto,
  SchedulePublicationDto,
  UnpublishDto,
} from './dto';
import { ScheduledPublicationWorker } from './jobs/scheduled-publication.worker';
import { OutboxDispatcherWorker } from './jobs/outbox-dispatcher.worker';
import { PublishingService } from './publishing.service';
import type { PublishingHealthStats } from './publishing.types';

@ApiTags('Publishing')
@Controller()
@UseGuards(AuthGuard, PermissionsGuard)
export class PublishingController {
  constructor(
    private readonly publishingService: PublishingService,
    private readonly scheduledWorker: ScheduledPublicationWorker,
    private readonly outboxWorker: OutboxDispatcherWorker,
  ) {}

  @Post('sites/:siteId/publications/:publicationId/publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('publication:publish')
  @ApiOperation({ summary: 'Publish content immediately to a site' })
  @ApiResponse({ status: 200, description: 'Publication published' })
  async publishImmediately(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
  ): Promise<PostPublicationItem> {
    return this.publishingService.publishImmediately(actor, siteId, publicationId);
  }

  @Post('sites/:siteId/publications/:publicationId/update-live')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('publication:publish')
  @ApiOperation({ summary: 'Push the latest edits of a published post to the live site' })
  @ApiResponse({ status: 200, description: 'Live publication now shows the latest revision' })
  async updateLiveContent(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
  ): Promise<PostPublicationItem> {
    return this.publishingService.updateLiveContent(actor, siteId, publicationId);
  }

  @Post('sites/:siteId/publications/:publicationId/schedule')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('publication:schedule')
  @ApiOperation({ summary: 'Schedule content for future publication' })
  @ApiResponse({ status: 200, description: 'Publication scheduled' })
  async schedulePublication(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
    @Body() dto: SchedulePublicationDto,
  ): Promise<PostPublicationItem> {
    return this.publishingService.schedulePublication(actor, siteId, publicationId, dto);
  }

  @Post('sites/:siteId/publications/:publicationId/reschedule')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('publication:schedule')
  @ApiOperation({ summary: 'Reschedule a pending scheduled publication' })
  @ApiResponse({ status: 200, description: 'Publication rescheduled' })
  async reschedulePublication(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
    @Body() dto: ReschedulePublicationDto,
  ): Promise<PostPublicationItem> {
    return this.publishingService.reschedulePublication(actor, siteId, publicationId, dto);
  }

  @Post('sites/:siteId/publications/:publicationId/cancel-schedule')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('publication:schedule')
  @ApiOperation({ summary: 'Cancel a pending scheduled publication and return to draft' })
  @ApiResponse({ status: 200, description: 'Publication schedule cancelled' })
  async cancelSchedule(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
    @Body() dto: CancelScheduleDto,
  ): Promise<PostPublicationItem> {
    return this.publishingService.cancelScheduledPublication(actor, siteId, publicationId, dto);
  }

  @Post('sites/:siteId/publications/:publicationId/unpublish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('publication:archive')
  @ApiOperation({ summary: 'Unpublish published content back to draft status' })
  @ApiResponse({ status: 200, description: 'Publication unpublished' })
  async unpublish(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
    @Body() dto: UnpublishDto,
  ): Promise<PostPublicationItem> {
    return this.publishingService.unpublish(actor, siteId, publicationId, dto);
  }

  @Post('sites/:siteId/publications/:publicationId/archive')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('publication:archive')
  @ApiOperation({ summary: 'Archive publication' })
  @ApiResponse({ status: 200, description: 'Publication archived' })
  async archive(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
    @Body() dto: ArchivePublicationDto,
  ): Promise<PostPublicationItem> {
    return this.publishingService.archive(actor, siteId, publicationId, dto);
  }

  @Post('sites/:siteId/publications/:publicationId/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('publication:archive')
  @ApiOperation({ summary: 'Restore archived publication back to draft status' })
  @ApiResponse({ status: 200, description: 'Publication restored' })
  async restore(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
  ): Promise<PostPublicationItem> {
    return this.publishingService.restore(actor, siteId, publicationId);
  }

  @Post('sites/:siteId/publications/:publicationId/review')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('post:update')
  @ApiOperation({ summary: 'Submit draft publication for editorial review' })
  @ApiResponse({ status: 200, description: 'Publication submitted for review' })
  async submitForReview(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', new ParseUUIDPipe({ version: '4' })) siteId: string,
    @Param('publicationId', new ParseUUIDPipe({ version: '4' })) publicationId: string,
  ): Promise<PostPublicationItem> {
    return this.publishingService.submitForReview(actor, siteId, publicationId);
  }

  @Get('publishing/health')
  @RequirePermissions('publication:publish')
  @ApiOperation({ summary: 'Get operational health and queue metrics for publishing engine' })
  @ApiResponse({ status: 200, description: 'Publishing health metrics' })
  async getHealth(): Promise<PublishingHealthStats> {
    return this.publishingService.getHealthStats(
      this.scheduledWorker.getIsRunning(),
      this.outboxWorker.getIsRunning(),
    );
  }
}
