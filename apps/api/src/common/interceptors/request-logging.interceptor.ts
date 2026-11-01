import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { finalize, type Observable } from 'rxjs';

import type { RequestContext } from '../http/request-context';

/**
 * Emits one structured log line per request on completion:
 * method, path, status, duration, and correlation id.
 *
 * Intentionally excluded: query strings, headers, bodies, cookies, and the remote
 * address. Query strings and headers routinely carry tokens, and the body can
 * contain unpublished content. Path is logged because route-level aggregates are
 * what make an incident legible.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType<'http' | 'ws' | 'rpc'>() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<RequestContext>();
    const response = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const status = response.statusCode;
        const record = {
          method: request.method,
          path: request.path,
          status,
          durationMs: Math.round(durationMs * 10) / 10,
          requestId: request.requestId,
        };

        if (status >= 500) {
          this.logger.error(record);
        } else if (status >= 400) {
          this.logger.warn(record);
        } else {
          this.logger.log(record);
        }
      }),
    );
  }
}
