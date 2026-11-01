import { HttpStatus } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { errorCodeForStatus, messageKeyForStatus } from '../http/error-code';
import { buildErrorResponse } from '../http/error-payload';
import type { RequestContext } from '../http/request-context';
import { DEFAULT_LOCALE } from '../i18n/locale';

interface BodyParserError {
  status?: number;
  statusCode?: number;
  type?: string;
}

function isTooLarge(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as BodyParserError;
  const status = candidate.status ?? candidate.statusCode;

  return status === HttpStatus.PAYLOAD_TOO_LARGE || candidate.type === 'entity.too.large';
}

/**
 * Express-level error handler for failures raised by body parsing, which happen
 * before Nest's router and therefore never reach an exception filter.
 *
 * Without this, an oversized payload would return body-parser's HTML error page and
 * break the documented JSON contract. Unknown errors are passed on unchanged so
 * Nest keeps ownership of application failures.
 */
export function bodyParserErrorMiddleware(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!isTooLarge(error)) {
    next(error);
    return;
  }

  const context = request as RequestContext;
  const requestId = context.requestId ?? 'unavailable';
  const status = HttpStatus.PAYLOAD_TOO_LARGE;

  const payload = buildErrorResponse(context.locale ?? DEFAULT_LOCALE, requestId, {
    code: errorCodeForStatus(status),
    messageKey: messageKeyForStatus(status),
  });

  response.setHeader('x-request-id', requestId);
  response.status(status).json(payload);
}
