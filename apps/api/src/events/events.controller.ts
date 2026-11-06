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

import type { EventItem, PaginatedResult } from '@multi-site-cms/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { CreateEventDto, ListEventsQueryDto, UpdateEventDto } from './dto';
import { EventsService } from './events.service';

const uuid = () => new ParseUUIDPipe({ version: '4' });

@ApiTags('Events')
@Controller('sites/:siteId/events')
@UseGuards(AuthGuard, PermissionsGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @RequirePermissions('site:read')
  @ApiOperation({ summary: 'List events for a site' })
  @ApiResponse({ status: 200, description: 'Paginated event list' })
  list(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', uuid()) siteId: string,
    @Query() query: ListEventsQueryDto,
  ): Promise<PaginatedResult<EventItem>> {
    return this.eventsService.list(actor, siteId, query);
  }

  @Get(':eventId')
  @RequirePermissions('site:read')
  @ApiOperation({ summary: 'Get an event' })
  @ApiResponse({ status: 200, description: 'Event details' })
  get(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', uuid()) siteId: string,
    @Param('eventId', uuid()) eventId: string,
  ): Promise<EventItem> {
    return this.eventsService.get(actor, siteId, eventId);
  }

  @Post()
  @RequirePermissions('event:manage')
  @ApiOperation({ summary: 'Create an event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  create(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', uuid()) siteId: string,
    @Body() dto: CreateEventDto,
  ): Promise<EventItem> {
    return this.eventsService.create(actor, siteId, dto);
  }

  @Patch(':eventId')
  @RequirePermissions('event:manage')
  @ApiOperation({ summary: 'Update an event' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  update(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', uuid()) siteId: string,
    @Param('eventId', uuid()) eventId: string,
    @Body() dto: UpdateEventDto,
  ): Promise<EventItem> {
    return this.eventsService.update(actor, siteId, eventId, dto);
  }

  @Delete(':eventId')
  @RequirePermissions('event:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event; linked publications are detached' })
  @ApiResponse({ status: 204, description: 'Event deleted' })
  remove(
    @CurrentUser() actor: EffectiveAuthContext,
    @Param('siteId', uuid()) siteId: string,
    @Param('eventId', uuid()) eventId: string,
  ): Promise<void> {
    return this.eventsService.remove(actor, siteId, eventId);
  }
}
