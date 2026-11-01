import { Controller, Get, Header } from '@nestjs/common';
import type { HealthResponse } from '@multi-site-cms/types';

@Controller('health')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
