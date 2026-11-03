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

export type PostType =
  | 'article'
  | 'guide'
  | 'news'
  | 'live_update'
  | 'travel_guide'
  | 'air_sports_update'
  | 'event_update';

export type PostStatus = 'draft' | 'in_review' | 'approved' | 'archived';
export type PublicationStatus = 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';
export type MediaStatus = 'active' | 'archived';
export type MediaUsageRole = 'featured' | 'gallery' | 'inline' | 'attachment';

export interface PostRevisionItem {
  id: string;
  postId: string;
  revisionNumber: number;
  title: string;
  excerpt: string | null;
  body: Record<string, unknown>;
  changeSummary: string | null;
  createdBy: string;
  createdAt: string;
}

export interface PostPublicationItem {
  id: string;
  siteId: string;
  postId: string;
  revisionId: string;
  slug: string;
  status: PublicationStatus;
  scheduledFor: string | null;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  featuredImageId: string | null;
  templateKey: string | null;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface PostItem {
  id: string;
  authorId: string;
  type: PostType;
  status: PostStatus;
  sourceLocale: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentRevision?: PostRevisionItem | null;
  currentRevisionNumber?: number;
  publications?: PostPublicationItem[];
}

export interface CategoryItem {
  id: string;
  siteId: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: CategoryItem[];
}

export interface TagItem {
  id: string;
  siteId: string;
  slug: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface MediaAssetItem {
  id: string;
  siteId: string | null;
  uploadedBy: string | null;
  storageProvider: string;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  byteSize: string;
  checksum: string;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  status: MediaStatus;
  url?: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadResponse {
  media: MediaAssetItem;
  url: string;
}

export interface PreviewTokenResponse {
  token: string;
  expiresAt: string;
  previewUrl: string;
}

export interface PostPreviewData {
  post: PostItem;
  revision: PostRevisionItem;
  publication: PostPublicationItem | null;
  site: {
    id: string;
    key: string;
    name: string;
    primaryDomain: string | null;
  } | null;
}

export interface DestinationInfoBlockAttributes {
  destination: string;
  country: string;
  region?: string;
  bestSeason?: string;
  elevation?: string;
  highlights?: string[];
}

export interface EventTimelineBlockAttributes {
  time: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'completed' | 'delayed' | 'cancelled';
  windSpeed?: string;
  weatherCondition?: string;
  alertLevel?: 'normal' | 'advisory' | 'warning';
}

export interface PublishingHealthStats {
  scheduledPublicationsPending: number;
  oldestPendingScheduledFor: string | null;
  outboxBacklogPending: number;
  outboxDeadLetterCount: number;
  isScheduledWorkerActive: boolean;
  isOutboxDispatcherActive: boolean;
}

export interface RealtimeBroadcastEvent {
  id: string;
  type: string;
  siteKey: string;
  publicationId: string;
  postId: string;
  slug: string;
  title: string;
  publishedAt: string;
  alertLevel?: string;
  windConditions?: string;
  weather?: string;
  timestamp: number;
}

export interface SchedulePublicationRequest {
  scheduledFor: string;
  reason?: string;
}

export interface ReschedulePublicationRequest {
  scheduledFor: string;
  reason?: string;
}

export interface VerificationChallenge {
  domainId: string;
  hostname: string;
  verificationToken: string;
  recordType: string;
  recordName: string;
  recordValue: string;
  expiresAt: string | null;
  isVerified: boolean;
}

export interface CreateSitePayload {
  key: string;
  name: string;
  defaultLocale?: string;
  timezone?: string;
  settings?: SiteSettings;
}

export interface UpdateSitePayload {
  name?: string;
  defaultLocale?: string;
  timezone?: string;
  status?: SiteStatus;
  settings?: Partial<SiteSettings>;
}

export interface CreateDomainPayload {
  hostname: string;
  isPrimary?: boolean;
}

export interface CreateUserPayload {
  email: string;
  displayName: string;
  password?: string;
  roleKey?: string;
  siteId?: string | null;
}

export interface UpdateUserPayload {
  displayName?: string;
  status?: UserStatus;
}

export interface AssignRolePayload {
  roleKey: string;
  scopeType: RoleScope;
  siteId?: string | null;
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CreateTagPayload {
  name: string;
  slug: string;
  description?: string | null;
}

export interface UpdateTagPayload {
  name?: string;
  slug?: string;
  description?: string | null;
}

// ==========================================
// Phase 10: Public Content Discovery Types
// ==========================================

export interface PublicArticleImage {
  id: string;
  url: string;
  altText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
}

export interface PublicTaxonomyRef {
  id: string;
  name: string;
  slug: string;
}

export interface PublicArticleAuthor {
  id: string;
  displayName: string;
}

export interface PublicArticleSummary {
  id: string;
  publicationId: string;
  postId: string;
  slug: string;
  title: string;
  excerpt: string | null;
  type: PostType;
  templateKey: string | null;
  eventId: string | null;
  sourceLocale: string;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  featuredImage: PublicArticleImage | null;
  categories: PublicTaxonomyRef[];
  tags: PublicTaxonomyRef[];
  author: PublicArticleAuthor | null;
}

export interface PublicArticleDetail extends PublicArticleSummary {
  body: Record<string, unknown>; // Tiptap JSON document AST
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  event: {
    id: string;
    slug: string;
    name: string;
    status: string;
  } | null;
  relatedArticles: PublicArticleSummary[];
  adjacentArticles: {
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
  };
}

export interface PublicCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  postCount: number;
}

export interface PublicTagItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

export interface PublicEventSummary {
  id: string;
  slug: string;
  name: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  startsAt: string;
  endsAt: string | null;
  description: string | null;
  updateCount: number;
}

export interface PublicEventDetail extends PublicEventSummary {
  updates: PublicArticleSummary[];
}

export interface PublicSitemapItem {
  slug: string;
  updatedAt: string;
  publishedAt: string;
}

export type PublicPostSort = 'newest' | 'oldest' | 'popular' | 'title_asc';

export interface ListPublicPostsQuery {
  page?: number;
  limit?: number;
  type?: string;
  templateKey?: string;
  eventId?: string;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  featured?: boolean;
  sort?: PublicPostSort;
}

// ==========================================
// Dashboard Overview Contracts (Phase 14)
// ==========================================

export interface DashboardMetrics {
  totalContent: number;
  publishedCount: number;
  draftsCount: number;
  scheduledCount: number;
  archivedCount: number;
  activeSitesCount: number;
}

export interface DashboardActivityDataPoint {
  date: string;
  published: number;
  drafts: number;
  scheduled: number;
}

export interface DashboardRecentContentItem {
  id: string;
  postId: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  siteId: string;
  siteName: string;
  siteKey: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledFor: string | null;
}

export interface DashboardRecentActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  actorName: string;
  actorEmail?: string | null;
  siteId: string | null;
  siteName?: string | null;
  createdAt: string;
  summary: string;
}

export interface DashboardOverviewData {
  metrics: DashboardMetrics;
  activitySeries: DashboardActivityDataPoint[];
  recentContent: DashboardRecentContentItem[];
  recentActivity: DashboardRecentActivityItem[];
}

// ==========================================
// Analytics Domain Contracts
// ==========================================

export type AnalyticsTimeframe = '7d' | '14d' | '30d' | '90d' | '1y';

export interface AnalyticsSummary {
  totalPageViews: number;
  pageViewsGrowth: number;
  uniqueVisitors: number;
  visitorsGrowth: number;
  avgDurationSeconds: number;
  durationGrowth: number;
  bounceRate: number;
  bounceRateGrowth: number;
}

export interface AnalyticsTimeseriesPoint {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  avgDurationSeconds: number;
}

export interface AnalyticsTopPage {
  postId?: string | null;
  slug: string;
  title: string;
  siteId: string;
  siteName: string;
  pageViews: number;
  uniqueVisitors: number;
  avgDurationSeconds: number;
  bounceRate: number;
}

export interface AnalyticsBreakdownItem {
  label: string;
  key: string;
  count: number;
  percentage: number;
}

export interface AnalyticsCountryItem {
  countryCode: string;
  countryName: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSitePerformance {
  siteId: string;
  siteName: string;
  siteKey: string;
  pageViews: number;
  uniqueVisitors: number;
  percentage: number;
}

export interface AnalyticsRealtimeEvent {
  id: string;
  siteName: string;
  path: string;
  title?: string;
  countryName: string;
  deviceType: string;
  timestamp: string;
}

export interface AnalyticsRealtimeData {
  activeVisitors30m: number;
  pageViewsLastHour: number;
  recentViewsPerMinute: Array<{ minute: string; views: number }>;
  recentEvents: AnalyticsRealtimeEvent[];
}

export interface AnalyticsOverviewData {
  summary: AnalyticsSummary;
  timeseries: AnalyticsTimeseriesPoint[];
  topPages: AnalyticsTopPage[];
  deviceBreakdown: AnalyticsBreakdownItem[];
  trafficSources: AnalyticsBreakdownItem[];
  countryBreakdown: AnalyticsCountryItem[];
  browserBreakdown: AnalyticsBreakdownItem[];
  sitePerformance: AnalyticsSitePerformance[];
}

export interface AnalyticsQueryParams {
  siteId?: string;
  days?: number;
  timeframe?: AnalyticsTimeframe;
}

export interface RecordPageViewPayload {
  siteId: string;
  postId?: string;
  path: string;
  referrer?: string;
  visitorId?: string;
  durationSeconds?: number;
}

/**
 * Audit Log Types
 */
export type AuditActorType = 'user' | 'system' | 'bootstrap';

export interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorType: AuditActorType;
  actorName: string | null;
  actorEmail: string | null;
  siteId: string | null;
  siteName: string | null;
  siteKey: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  requestId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogSummary {
  totalEvents: number;
  securityAuthEvents: number;
  contentEvents: number;
  systemRoleEvents: number;
  uniqueActorsCount: number;
  activeSitesCount: number;
}

export type AuditLogCategory = 'all' | 'auth' | 'content' | 'user' | 'system' | 'media';

export interface AuditLogQueryParams {
  siteId?: string;
  action?: string;
  category?: AuditLogCategory;
  entityType?: string;
  actorId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Platform Settings Types
 */
export interface PlatformGeneralSettings {
  platformName: string;
  tagline: string;
  contactEmail: string;
  defaultLocale: string;
  defaultTimezone: string;
}

export interface PlatformSecuritySettings {
  sessionTtlHours: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  requireStrongPasswords: boolean;
  enforceMfaForSuperAdmin: boolean;
  allowPublicRegistration: boolean;
}

export interface PlatformMediaSettings {
  storageProvider: 'cloudinary' | 'local' | 's3';
  maxUploadSizeBytes: number;
  allowedMimeTypes: string[];
  autoWebpConversion: boolean;
}

export interface PlatformPublishingSettings {
  defaultPostStatus: 'draft' | 'in_review';
  autoSaveIntervalSeconds: number;
  maxRevisionHistory: number;
  previewTokenTtlMinutes: number;
}

export interface PlatformMaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceNoticeEn: string;
  maintenanceNoticeBn: string;
  auditRetentionDays: number;
}

export interface PlatformSettings {
  id: string;
  general: PlatformGeneralSettings;
  security: PlatformSecuritySettings;
  media: PlatformMediaSettings;
  publishing: PlatformPublishingSettings;
  maintenance: PlatformMaintenanceSettings;
  updatedAt: string;
  updatedBy: string | null;
}

export interface UpdatePlatformSettingsPayload {
  general?: Partial<PlatformGeneralSettings>;
  security?: Partial<PlatformSecuritySettings>;
  media?: Partial<PlatformMediaSettings>;
  publishing?: Partial<PlatformPublishingSettings>;
  maintenance?: Partial<PlatformMaintenanceSettings>;
}

export interface PublicPlatformSettings {
  platformName: string;
  tagline: string;
  maintenanceMode: boolean;
  maintenanceNoticeEn: string;
  maintenanceNoticeBn: string;
  allowPublicRegistration: boolean;
  defaultLocale: string;
  defaultTimezone: string;
}

export interface PlatformSystemDiagnostics {
  service: string;
  nodeVersion: string;
  platform: string;
  environment: string;
  uptimeSeconds: number;
  databaseStatus: 'up' | 'down';
  databaseLatencyMs: number;
  totalSites: number;
  totalUsers: number;
  totalPosts: number;
  totalMediaAssets: number;
  storageProvider: string;
  memoryUsageMb: number;
}



