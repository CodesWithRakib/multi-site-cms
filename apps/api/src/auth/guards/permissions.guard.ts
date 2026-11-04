import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { ApiException } from '../../common/exceptions/api.exception';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthorizationService, type EffectiveAuthContext } from '../services/authorization.service';
import { resolveRequestSiteId } from '../utils/resolve-request-site-id';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
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

    // Super Admin has platform-wide authority
    if (authContext.isSuperAdmin) {
      return true;
    }

    // Resolve site context if present
    const siteId = resolveRequestSiteId(request);

    for (const permission of requiredPermissions) {
      this.authorizationService.assertPermission(authContext, permission, siteId);
    }

    return true;
  }
}
