import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ApiException } from '../../common/exceptions/api.exception';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthorizationService, type EffectiveAuthContext } from '../services/authorization.service';
import { SESSION_COOKIE_NAME, SessionService } from '../services/session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<
      Request & {
        cookies?: Record<string, string>;
        authContext?: EffectiveAuthContext;
      }
    >();

    const rawToken = this.extractToken(request);

    if (!rawToken) {
      if (isPublic) {
        return true;
      }
      throw new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'http.unauthenticated');
    }

    const sessionWithUser = await this.sessionService.findValidSession(rawToken);

    if (!sessionWithUser) {
      if (isPublic) {
        return true;
      }
      throw new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'auth.sessionExpired');
    }

    const user = sessionWithUser.user;

    // Accounts that are suspended, disabled, or invited fail closed immediately
    if (user.status !== 'active') {
      await this.sessionService.revokeSession(rawToken);
      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.accountInactive');
    }

    // Resolve full effective roles, permissions, and authorized sites
    const authContext = await this.authorizationService.resolveUserAccess(user);

    request.authContext = authContext;
    (request as unknown as { user: unknown }).user = user;

    return true;
  }

  private extractToken(request: Request & { cookies?: Record<string, string> }): string | null {
    // 1. Primary: HttpOnly session cookie
    if (request.cookies && request.cookies[SESSION_COOKIE_NAME]) {
      return request.cookies[SESSION_COOKIE_NAME];
    }

    // 2. Secondary: Bearer token in Authorization header (supported for API tooling / tests)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    return null;
  }
}
