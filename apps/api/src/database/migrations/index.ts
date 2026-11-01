import { AuthenticationAndSessions1793491203000 } from './1793491203000-AuthenticationAndSessions';
import { ContentMediaAndAudit1793491202000 } from './1793491202000-ContentMediaAndAudit';
import { EnableDatabaseExtensions1793491200000 } from './1793491200000-EnableDatabaseExtensions';
import { IdentityAndSiteRegistry1793491201000 } from './1793491201000-IdentityAndSiteRegistry';

/**
 * Ordered migration registry.
 *
 * Explicit rather than globbed: a glob would pick up stale `.js` files from an
 * older build in `dist/` and run them twice, and it cannot be type-checked.
 */
export const MIGRATIONS = [
  EnableDatabaseExtensions1793491200000,
  IdentityAndSiteRegistry1793491201000,
  ContentMediaAndAudit1793491202000,
  AuthenticationAndSessions1793491203000,
] as const;
