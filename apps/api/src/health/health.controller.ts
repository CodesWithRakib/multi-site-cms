import { Controller, Get, Header, HttpStatus, Inject } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { HealthResponse, ReadinessResponse } from '@multi-site-cms/types';

import { ApiErrorResponseDto } from '../common/http/openapi-error.dto';
import { ApiException } from '../common/exceptions/api.exception';
import { DatabaseHealthService } from '../database/database-health.service';
import { HealthEnvelopeDto, ReadinessEnvelopeDto } from './health.dto';

@Controller('health')
@ApiTags('operations')
export class HealthController {
  // Explicit token: the class is both the provider and the injection token, and
  // stating it keeps the dependency visible rather than inferred from metadata.
  constructor(
    @Inject(DatabaseHealthService) private readonly databaseHealth: DatabaseHealthService,
  ) {}

  /**
   * Liveness: the process can serve HTTP. It deliberately does not touch the
   * database, so an optional-dependency outage cannot restart a healthy pod.
   */
  @Get()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Reports that the process is running. Does not check the database or any other dependency.',
  })
  @ApiOkResponse({ type: HealthEnvelopeDto })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  /**
   * Readiness: the instance can serve requests that need the database. A failed
   * check returns 503 with the standard error envelope, so orchestrators and
   * uptime monitors see a single contract.
   */
  @Get('ready')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Verifies mandatory dependencies with a lightweight `SELECT 1`. Returns 503 when the database is unreachable.',
  })
  @ApiOkResponse({ type: ReadinessEnvelopeDto })
  @ApiServiceUnavailableResponse({
    type: ApiErrorResponseDto,
    description: 'A mandatory dependency is unavailable.',
  })
  async getReadiness(): Promise<ReadinessResponse> {
    const database = await this.databaseHealth.check();

    if (database.status === 'down') {
      throw new ApiException(
        HttpStatus.SERVICE_UNAVAILABLE,
        'SERVICE_UNAVAILABLE',
        'http.serviceUnavailable',
        { logContext: 'readiness.database' },
      );
    }

    return {
      status: 'ready',
      checks: { database },
    };
  }
}
