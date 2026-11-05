import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuditLogSummary, PaginatedAuditLogs } from '@multi-site-cms/types';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import type { EffectiveAuthContext } from '../../auth/services/authorization.service';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'List and filter paginated audit events' })
  @ApiResponse({ status: 200, description: 'Paginated audit log items' })
  async listLogs(
    @CurrentUser() actor: EffectiveAuthContext,
    @Query() query: AuditLogQueryDto,
  ): Promise<PaginatedAuditLogs> {
    return this.auditService.listAuditLogs(actor, query);
  }

  @Get('summary')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get audit activity KPI metrics' })
  @ApiResponse({ status: 200, description: 'Audit summary metrics' })
  async getSummary(
    @CurrentUser() actor: EffectiveAuthContext,
    @Query('siteId') siteId?: string,
  ): Promise<AuditLogSummary> {
    return this.auditService.getAuditSummary(actor, siteId);
  }
}
