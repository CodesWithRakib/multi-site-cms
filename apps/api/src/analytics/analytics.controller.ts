import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AnalyticsOverviewData, AnalyticsRealtimeData } from '@multi-site-cms/types';
import type { Request } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { RecordPageViewDto } from './dto/record-page-view.dto';

@ApiTags('analytics')
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics/overview')
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'Get aggregated and timeseries analytics metrics' })
  @ApiResponse({ status: 200, description: 'Analytics overview data' })
  async getOverview(
    @CurrentUser() actor: EffectiveAuthContext,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsOverviewData> {
    return this.analyticsService.getOverview(actor, query);
  }

  @Get('analytics/realtime')
  @RequirePermissions('post:read')
  @ApiOperation({ summary: 'Get real-time 30-minute visitor stats and recent events' })
  @ApiResponse({ status: 200, description: 'Real-time analytics data' })
  async getRealtime(
    @CurrentUser() actor: EffectiveAuthContext,
    @Query('siteId') siteId?: string,
  ): Promise<AnalyticsRealtimeData> {
    return this.analyticsService.getRealtime(actor, siteId);
  }

  @Public()
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Post('public/analytics/collect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public beacon to record privacy-respecting page view metrics' })
  @ApiResponse({ status: 200, description: 'Recorded successfully' })
  async collect(
    @Body() dto: RecordPageViewDto,
    @Req() req: Request,
  ): Promise<{ success: boolean; id: string }> {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.analyticsService.recordPageView(dto, ip, userAgent);
  }
}

