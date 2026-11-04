import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ApiException } from '../../common/exceptions/api.exception';
import { REQUIRE_SITE_CONTEXT_KEY } from '../decorators/site-context.decorator';
import { AuthorizationService, type EffectiveAuthContext } from '../services/authorization.service';
import { resolveRequestSiteId } from '../utils/resolve-request-site-id';

@Injectable()
export class SiteAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requireSite = this.reflector.getAllAndOverride<boolean>(REQUIRE_SITE_CONTEXT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireSite) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      Request & {
        authContext?: EffectiveAuthContext;
      }
    >();

    const authContext = request.authContext;
    if (!authContext) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'http.unauthenticated');
    }

    const siteId = resolveRequestSiteId(request);
    if (!siteId) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'auth.siteRequired');
    }

    this.authorizationService.assertSiteAccess(authContext, siteId);

    return true;
  }
}
