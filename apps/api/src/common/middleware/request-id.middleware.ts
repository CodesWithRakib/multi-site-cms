import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

export interface RequestWithId extends Request {
  requestId: string;
}

/**
 * Propagate a caller-supplied request ID only when it is a bounded, safe token;
 * otherwise generate one. The value is echoed in the response and included in
 * the API envelope for support and audit correlation.
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

  (request as RequestWithId).requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
}
