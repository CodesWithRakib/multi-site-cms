import { ApiProperty } from '@nestjs/swagger';
import type { HealthResponse, ReadinessResponse } from '@multi-site-cms/types';

import { ApiMetaDto } from '../common/http/openapi-error.dto';

export class HealthDto implements HealthResponse {
  @ApiProperty({ example: 'ok', enum: ['ok'] })
  status!: 'ok';

  @ApiProperty({ example: 'api', enum: ['api'] })
  service!: 'api';

  @ApiProperty({ example: 128, description: 'Process uptime in seconds.' })
  uptimeSeconds!: number;
}

export class ReadinessCheckDto {
  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  status!: 'up' | 'down';

  @ApiProperty({ example: 3, description: 'Measured check duration in milliseconds.' })
  latencyMs!: number;
}

export class ReadinessChecksDto {
  @ApiProperty({ type: ReadinessCheckDto })
  database!: ReadinessCheckDto;
}

export class ReadinessDto implements ReadinessResponse {
  @ApiProperty({ example: 'ready', enum: ['ready'] })
  status!: 'ready';

  @ApiProperty({ type: ReadinessChecksDto })
  checks!: ReadinessChecksDto;
}

/**
 * Envelope wrappers. One level only: the resource lives directly under `data`.
 */
export class HealthEnvelopeDto {
  @ApiProperty({ type: HealthDto })
  data!: HealthDto;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;
}

export class ReadinessEnvelopeDto {
  @ApiProperty({ type: ReadinessDto })
  data!: ReadinessDto;

  @ApiProperty({ type: ApiMetaDto })
  meta!: ApiMetaDto;
}
