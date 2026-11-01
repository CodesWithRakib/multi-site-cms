import { createHash, randomUUID } from 'node:crypto';
import { Controller, Get, HttpStatus, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { Public } from '../auth/decorators/public.decorator';
import { ApiException } from '../common/exceptions/api.exception';
import type { RequestContext } from '../common/http/request-context';
import { SitesPublicService } from './sites-public.service';

@Controller('public/sites')
@Public()
export class SitesPublicController {
  constructor(private readonly publicService: SitesPublicService) {}

  @Get('by-domain/:hostname')
  async getByDomain(
    @Param('hostname') hostname: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const config = await this.publicService.getPublicConfigByHostname(hostname);
    if (!config) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    const hash = createHash('sha256').update(JSON.stringify(config)).digest('hex');
    const etag = `"${hash}"`;

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    if (req.headers['if-none-match'] === etag) {
      res.status(HttpStatus.NOT_MODIFIED).end();
      return;
    }

    const requestId = (req as RequestContext).requestId ?? randomUUID();
    res.status(HttpStatus.OK).json({
      data: config,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  @Get(':key/config')
  async getByKey(
    @Param('key') key: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const config = await this.publicService.getPublicConfigByKey(key);
    if (!config) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }

    const hash = createHash('sha256').update(JSON.stringify(config)).digest('hex');
    const etag = `"${hash}"`;

    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

    if (req.headers['if-none-match'] === etag) {
      res.status(HttpStatus.NOT_MODIFIED).end();
      return;
    }

    const requestId = (req as RequestContext).requestId ?? randomUUID();
    res.status(HttpStatus.OK).json({
      data: config,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
