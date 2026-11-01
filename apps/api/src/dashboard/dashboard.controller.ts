import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { DashboardOverviewData } from '@multi-site-cms/types';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @RequirePermissions('post:read')
  @ApiOperation({
    summary: 'Get centralized dashboard overview including metrics, activity, and recent content',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard overview metrics, time-series, and activity',
  })
  async getOverview(
    @CurrentUser() actor: EffectiveAuthContext,
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardOverviewData> {
    return this.dashboardService.getOverview(actor, query);
  }
}
