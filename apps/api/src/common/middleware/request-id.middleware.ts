import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import type { RequestContext } from '../http/request-context';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

/**
 * Propagate a caller-supplied request ID only when it is a bounded, safe token;
 * otherwise generate one. The value is echoed in the response and included in the
 * API envelope for support and audit correlation.
 *
 * The header is client input: it is length-bounded and restricted to a safe
 * character set so it cannot inject control characters into logs.
 */
export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const suppliedRequestId = request.header('x-request-id');
  const requestId =
    suppliedRequestId && REQUEST_ID_PATTERN.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();

  (request as RequestContext).requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
}
