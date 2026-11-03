import { AuthenticationAndSessions1793491203000 } from './1793491203000-AuthenticationAndSessions';
import { ContentEnhancementsAndTaxonomyHierarchy1793491205000 } from './1793491205000-ContentEnhancementsAndTaxonomyHierarchy';
import { ContentMediaAndAudit1793491202000 } from './1793491202000-ContentMediaAndAudit';
import { EnableDatabaseExtensions1793491200000 } from './1793491200000-EnableDatabaseExtensions';
import { IdentityAndSiteRegistry1793491201000 } from './1793491201000-IdentityAndSiteRegistry';
import { PublishingLifecycleAndOutbox1793491206000 } from './1793491206000-PublishingLifecycleAndOutbox';
import { SiteDomainsVerificationAndLifecycle1793491204000 } from './1793491204000-SiteDomainsVerificationAndLifecycle';
import { AnalyticsAndTrafficEvents1793491207000 } from './1793491207000-AnalyticsAndTrafficEvents';
import { PlatformSettingsRegistry1793491208000 } from './1793491208000-PlatformSettingsRegistry';
import { NewsletterSubscribers1793491209000 } from './1793491209000-NewsletterSubscribers';
import { PostComments1793491210000 } from './1793491210000-PostComments';

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
  SiteDomainsVerificationAndLifecycle1793491204000,
  ContentEnhancementsAndTaxonomyHierarchy1793491205000,
  PublishingLifecycleAndOutbox1793491206000,
  AnalyticsAndTrafficEvents1793491207000,
  PlatformSettingsRegistry1793491208000,
  NewsletterSubscribers1793491209000,
  PostComments1793491210000,
] as const;

