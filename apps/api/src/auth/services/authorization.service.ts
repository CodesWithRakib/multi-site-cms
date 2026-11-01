import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AuthUser, UserRoleSummary } from '@multi-site-cms/types';
import { type DataSource, type Repository } from 'typeorm';

import { ApiException } from '../../common/exceptions/api.exception';
import { getInitializedRepository } from '../../database/ensure-connected';
import { DATA_SOURCE } from '../../database/database.tokens';
import { UserRoleAssignment } from '../../database/entities/user-role-assignment.entity';
import { type User } from '../../database/entities/user.entity';

export interface EffectiveAuthContext {
  user: User;
  isSuperAdmin: boolean;
  roles: UserRoleSummary[];
  permissions: string[];
  authorizedSiteIds: string[];
  sitePermissions: Record<string, string[]>;
}

@Injectable()
export class AuthorizationService {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  private async getAssignmentRepo(): Promise<Repository<UserRoleAssignment>> {
    return getInitializedRepository(this.dataSource, UserRoleAssignment);
  }

  /**
   * Resolves the complete effective authorization context for a user from database records.
   * Never trusts client claims.
   */
  async resolveUserAccess(user: User): Promise<EffectiveAuthContext> {
    const assignmentRepo = await this.getAssignmentRepo();
    const assignments = await assignmentRepo.find({
      where: { userId: user.id },
      relations: {
        role: {
          rolePermissions: {
            permission: true,
          },
        },
      },
    });

    let isSuperAdmin = false;
    const roles: UserRoleSummary[] = [];
    const platformPermissions = new Set<string>();
    const sitePermissionsMap: Record<string, Set<string>> = {};
    const authorizedSiteIdsSet = new Set<string>();

    for (const assignment of assignments) {
      const role = assignment.role;
      if (!role) {
        continue;
      }

      roles.push({
        assignmentId: assignment.id,
        roleId: role.id,
        roleKey: role.key,
        roleName: role.name,
        scopeType: assignment.scopeType,
        siteId: assignment.siteId,
      });

      if (role.key === 'super_admin' && assignment.scopeType === 'platform') {
        isSuperAdmin = true;
      }

      const permissionKeys =
        role.rolePermissions?.map((rp) => rp.permission?.key).filter(Boolean) ?? [];

      if (assignment.scopeType === 'platform') {
        for (const key of permissionKeys) {
          platformPermissions.add(key);
        }
      } else if (assignment.scopeType === 'site' && assignment.siteId) {
        authorizedSiteIdsSet.add(assignment.siteId);
        let siteSet = sitePermissionsMap[assignment.siteId];
        if (!siteSet) {
          siteSet = new Set<string>();
          sitePermissionsMap[assignment.siteId] = siteSet;
        }
        for (const key of permissionKeys) {
          siteSet.add(key);
        }
      }
    }

    const sitePermissions: Record<string, string[]> = {};
    for (const [siteId, permSet] of Object.entries(sitePermissionsMap)) {
      sitePermissions[siteId] = Array.from(permSet);
    }

    // A Super Admin has all assigned platform permissions and can access any site
    const authorizedSiteIds = Array.from(authorizedSiteIdsSet);
    const permissions = Array.from(platformPermissions);

    return {
      user,
      isSuperAdmin,
      roles,
      permissions,
      authorizedSiteIds,
      sitePermissions,
    };
  }

  /**
   * Converts an EffectiveAuthContext into a client-safe AuthUser DTO.
   */
  toAuthUser(context: EffectiveAuthContext): AuthUser {
    return {
      id: context.user.id,
      email: context.user.email,
      displayName: context.user.displayName,
      status: context.user.status,
      roles: context.roles,
      permissions: context.permissions,
      authorizedSiteIds: context.authorizedSiteIds,
      isSuperAdmin: context.isSuperAdmin,
    };
  }

  /**
   * Checks whether the principal is authorized to access a given site.
   * Super Admins can access all sites; Admins can access only explicitly assigned sites.
   */
  canAccessSite(context: EffectiveAuthContext, siteId: string): boolean {
    if (context.isSuperAdmin) {
      return true;
    }
    return context.authorizedSiteIds.includes(siteId);
  }

  /**
   * Checks whether the principal has a specific permission, either platform-wide or for a site.
   */
  hasPermission(
    context: EffectiveAuthContext,
    permissionKey: string,
    siteId?: string | null,
  ): boolean {
    if (context.isSuperAdmin) {
      return true;
    }

    if (siteId) {
      const sitePerms = context.sitePermissions[siteId];
      return sitePerms ? sitePerms.includes(permissionKey) : false;
    }

    return context.permissions.includes(permissionKey);
  }

  /**
   * Asserts site access, throwing 404 NOT_FOUND to prevent tenant resource enumeration.
   */
  assertSiteAccess(context: EffectiveAuthContext, siteId: string): void {
    if (!this.canAccessSite(context, siteId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'http.notFound');
    }
  }

  /**
   * Asserts a required permission. If site context is missing/unauthorized, returns 404;
   * if site is accessible but permission is lacking, returns 403.
   */
  assertPermission(
    context: EffectiveAuthContext,
    permissionKey: string,
    siteId?: string | null,
  ): void {
    if (siteId) {
      this.assertSiteAccess(context, siteId);
    }

    if (!this.hasPermission(context, permissionKey, siteId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'http.forbidden');
    }
  }
}
