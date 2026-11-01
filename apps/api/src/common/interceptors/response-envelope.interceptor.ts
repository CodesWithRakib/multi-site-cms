import { randomUUID } from 'node:crypto';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { ApiSuccess } from '@multi-site-cms/types';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';

import type { RequestContext } from '../http/request-context';

/**
 * Wraps handler results in the single documented success envelope: `{ data, meta }`.
 *
 * One level only: resources are returned directly inside `data`, and paginated
 * collections will be `data.items` with `data.pageInfo`. The envelope exists to
 * carry the correlation id and timestamp without repeating them in every payload.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestContext>();
    const response = http.getResponse<Response>();

    const requestId =
      request.requestId ?? response.getHeader('x-request-id')?.toString() ?? randomUUID();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
