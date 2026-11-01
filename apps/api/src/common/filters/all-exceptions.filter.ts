import { randomUUID } from 'node:crypto';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { ApiException } from '../exceptions/api.exception';
import { errorCodeForStatus, messageKeyForStatus } from '../http/error-code';
import { buildErrorResponse, type ErrorResponseInput } from '../http/error-payload';
import type { RequestContext } from '../http/request-context';
import { DEFAULT_LOCALE } from '../i18n/locale';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<RequestContext>();

    const locale = request.locale ?? DEFAULT_LOCALE;
    const requestId =
      request.requestId ?? response.getHeader('x-request-id')?.toString() ?? randomUUID();

    const payload = buildErrorResponse(locale, requestId, this.describe(exception));

    response.setHeader('x-request-id', requestId);
    response.status(statusOf(exception)).json(payload);
  }

  private describe(exception: unknown): ErrorResponseInput {
    if (exception instanceof ApiException) {
      return {
        code: exception.code,
        messageKey: exception.messageKey,
        params: exception.params,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      // Framework-thrown exceptions (guards, throttling, 404) keep their status and
      // code, but their own message is not reused: it is often internal English text.
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error('Request failed with a server error', exception.stack);
      }

      return {
        code: errorCodeForStatus(status),
        messageKey: messageKeyForStatus(status),
      };
    }

    this.logger.error(
      'Unhandled request failure',
      exception instanceof Error ? exception.stack : undefined,
    );

    return { code: 'INTERNAL_ERROR', messageKey: 'http.internal' };
  }
}

function statusOf(exception: unknown): number {
  return exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
}
