import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { ApiException } from '../../common/exceptions/api.exception';
import { env } from '../../config/env';
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from '../services/session.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & {
        cookies?: Record<string, string>;
      }
    >();

    // 1. Safe methods never perform state changes
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    // 2. Login endpoint establishes the session and is exempt from prior CSRF token.
    // Match the exact path; the query string must never be able to opt a request out.
    if (this.isLoginPath(request.originalUrl ?? request.url ?? '')) {
      return true;
    }

    // 3. CSRF applies to cookie-authenticated requests with ambient credentials
    const hasSessionCookie = Boolean(request.cookies && request.cookies[SESSION_COOKIE_NAME]);
    if (!hasSessionCookie) {
      // Bearer-token or unauthenticated requests are not vulnerable to ambient credential CSRF
      return true;
    }

    // 4. Origin / Referer verification
    const origin = request.headers.origin ?? this.extractOriginFromReferer(request.headers.referer);
    if (origin) {
      const allowed = env.CORS_ORIGINS.some((allowedOrigin) => {
        return origin === allowedOrigin || origin === `${allowedOrigin}/`;
      });
      if (!allowed) {
        throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.csrfFailed');
      }
    }

    // 5. Double-submit anti-CSRF token verification
    const csrfCookie = request.cookies?.[CSRF_COOKIE_NAME];
    const csrfHeader =
      request.headers['x-csrf-token'] ??
      request.headers['x-xsrf-token'] ??
      request.headers['x-csrf-protection'];

    const headerValue = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;

    if (
      !csrfCookie ||
      !headerValue ||
      csrfCookie.trim() === '' ||
      csrfCookie !== headerValue.trim()
    ) {
      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.csrfFailed');
    }

    return true;
  }

  private isLoginPath(url: string): boolean {
    const queryStart = url.search(/[?#]/);
    const path = (queryStart === -1 ? url : url.slice(0, queryStart)).replace(/\/+$/, '');
    return path === `/${env.API_PREFIX}/auth/login`;
  }

  private extractOriginFromReferer(referer?: string): string | null {
    if (!referer) {
      return null;
    }
    try {
      const parsed = new URL(referer);
      return parsed.origin;
    } catch {
      return null;
    }
  }
}
