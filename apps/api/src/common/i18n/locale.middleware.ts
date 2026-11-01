import type { NextFunction, Request, Response } from 'express';

import type { RequestContext } from '../http/request-context';
import { resolveLocale } from './locale';

/**
 * Negotiate the response locale from `Accept-Language` once per request.
 *
 * Runs after the request-id middleware so a later failure can carry both the
 * correlation id and the language. The header is client input: it is bounded in
 * `resolveLocale` and can only select a catalog, never a code path.
 */
export function localeMiddleware(request: Request, _response: Response, next: NextFunction): void {
  (request as RequestContext).locale = resolveLocale(request.header('accept-language'));
  next();
}
