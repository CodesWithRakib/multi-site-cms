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

import type { RequestWithId } from '../middleware/request-id.middleware';

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
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
