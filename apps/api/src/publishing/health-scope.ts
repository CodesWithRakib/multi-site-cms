import type { EffectiveAuthContext } from '../auth/services/authorization.service';

/**
 * Which tenants a publishing-health response may count.
 *
 * - `null`: the whole platform (Super Admin only).
 * - a list: only those sites; an empty list means the caller reaches none, so
 *   every count is zero. A caller-supplied site is never part of this.
 *
 * Queue sizes of other tenants are tenant data: a site Admin must not learn
 * how much another site has scheduled or backlogged.
 */
export function resolveHealthScope(
  actor: Pick<EffectiveAuthContext, 'isSuperAdmin' | 'authorizedSiteIds'>,
): readonly string[] | null {
  return actor.isSuperAdmin ? null : actor.authorizedSiteIds;
}
