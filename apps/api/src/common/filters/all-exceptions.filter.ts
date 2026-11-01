import { randomUUID } from 'node:crypto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorCode, ApiErrorResponse } from '@multi-site-cms/types';
import type { Response } from 'express';

import { errorCodeForStatus } from '../http/error-code';
import type { RequestWithId } from '../middleware/request-id.middleware';

interface ExceptionBody {
  message?: string | string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<RequestWithId>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'An unexpected error occurred.';
    let details: string[] | undefined;

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (isRecord(exceptionResponse)) {
        const body = exceptionResponse as ExceptionBody;

        if (Array.isArray(body.message)) {
          message = 'Validation failed.';
          details = body.message.filter((item): item is string => typeof item === 'string');
        } else if (typeof body.message === 'string') {
          message = body.message;
        }
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'An unexpected error occurred.';
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error('Unhandled request failure', stack);
    }

    const requestId =
      request.requestId ?? response.getHeader('x-request-id')?.toString() ?? randomUUID();
    const code: ApiErrorCode = errorCodeForStatus(status);

    const payload: ApiErrorResponse = {
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    response.setHeader('x-request-id', requestId);
    response.status(status).json(payload);
  }
}
