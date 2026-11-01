/**
 * Shared API contract primitives.
 *
 * This package must remain framework-agnostic and free of runtime code so that
 * every application can depend on it without pulling in a UI, server, or state
 * management runtime.
 */

export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  data: T;
  meta: ApiMeta;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'HTTP_ERROR';

/**
 * A field-level error detail.
 *
 * `code` is machine-readable and never localized; `message` is localized for the
 * request locale. Clients should branch on `code`/`field`, never on `message`.
 */
export interface ApiErrorDetail {
  field?: string;
  code: string;
  message: string;
}

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
  meta: ApiMeta;
}

export interface HealthResponse {
  status: 'ok';
  service: 'api';
  uptimeSeconds: number;
}

export interface ReadinessCheck {
  status: 'up' | 'down';
  latencyMs: number;
}

export interface ReadinessResponse {
  status: 'ready';
  checks: {
    database: ReadinessCheck;
  };
}

export type UserStatus = 'active' | 'invited' | 'suspended' | 'disabled';
export type RoleScope = 'platform' | 'site';

export interface UserRoleSummary {
  assignmentId: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  scopeType: RoleScope;
  siteId: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  roles: UserRoleSummary[];
  permissions: string[];
  authorizedSiteIds: string[];
  isSuperAdmin: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  expiresAt: string;
}

export interface CsrfResponse {
  csrfToken: string;
}

export interface UserItem {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  lastLoginAt: string | null;
  failedLoginCount: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  roles: UserRoleSummary[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SiteStatus = 'active' | 'paused' | 'archived' | 'suspended';
export type DomainStatus = 'active' | 'disabled';
export type NavigationVisibility = 'public' | 'authenticated' | 'hidden';
export type RobotsPolicy = 'all' | 'noindex' | 'nofollow' | 'none';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface SiteBranding {
  displayName?: string;
  description?: string;
  logoMediaId?: string | null;
  faviconMediaId?: string | null;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  themePreference: ThemePreference;
}

export interface SiteSeo {
  titleTemplate?: string;
  defaultDescription?: string;
  socialImageMediaId?: string | null;
  canonicalHost?: string;
  robotsPolicy: RobotsPolicy;
  sitemapEnabled: boolean;
}

export interface SiteNavigationItem {
  id: string;
  label: string;
  url: string;
  visibility: NavigationVisibility;
  order: number;
  parentId: string | null;
  localeLabels?: Record<string, string>;
}

export interface SiteLocales {
  defaultLocale: string;
  supportedLocales: string[];
  fallbackLocale: string;
}

export interface SiteSettings {
  branding?: Partial<SiteBranding>;
  seo?: Partial<SiteSeo>;
  navigation?: SiteNavigationItem[];
  locales?: Partial<SiteLocales>;
  features?: Record<string, boolean>;
  [key: string]: unknown;
}

export interface SiteDomainItem {
  id: string;
  siteId: string;
  hostname: string;
  status: DomainStatus;
  isPrimary: boolean;
  verifiedAt: string | null;
  verificationToken?: string | null;
  verificationTokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SiteItem {
  id: string;
  key: string;
  name: string;
  defaultLocale: string;
  timezone: string;
  status: SiteStatus;
  settings: SiteSettings;
  domains: SiteDomainItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicNavigationItem {
  id: string;
  label: string;
  url: string;
  order: number;
  parentId: string | null;
  children?: PublicNavigationItem[];
}

export interface PublicSiteConfig {
  key: string;
  name: string;
  defaultLocale: string;
  supportedLocales: string[];
  timezone: string;
  primaryDomain: string | null;
  branding: SiteBranding;
  navigation: PublicNavigationItem[];
  seo: SiteSeo;
}
