'use client';

import type {
  UserStats,
  EffectivePlatformPolicy,
  AdminCommentItem,
  AdminCommentsListResult,
  AnalyticsOverviewData,
  AnalyticsQueryParams,
  AnalyticsRealtimeData,
  ApiSuccess,
  AssignRolePayload,
  AuditLogQueryParams,
  AuditLogSummary,
  AuthUser,
  CategoryItem,
  CommentStatus,
  CreateCategoryPayload,
  CreateDomainPayload,
  CreateSitePayload,
  CreateTagPayload,
  CreateUserPayload,
  CsrfResponse,
  DashboardOverviewData,
  ListAdminCommentsQuery,
  LoginResponse,
  MediaAssetItem,
  MediaUploadResponse,
  PaginatedAuditLogs,
  PaginatedResult,
  PlatformSettings,
  PlatformSystemDiagnostics,
  PublicPlatformSettings,
  PostItem,
  PostStatusCounts,
  PostPreviewData,
  PostPublicationItem,
  PreviewTokenResponse,
  PublishingHealthStats,
  RecordPageViewPayload,
  ReschedulePublicationRequest,
  SchedulePublicationRequest,
  SiteDomainItem,
  SiteItem,
  TagItem,
  UpdateCategoryPayload,
  UpdatePlatformSettingsPayload,
  UpdateSitePayload,
  UpdateTagPayload,
  UpdateUserPayload,
  UserItem,
  VerificationChallenge,
} from '@multi-site-cms/types';
import { platformApi } from './store';

export interface CreatePostPayload {
  type: string;
  sourceLocale?: string;
  title: string;
  excerpt?: string;
  body: Record<string, unknown>;
  publications?: CreatePublicationPayload[];
}

export interface UpdatePostPayload {
  expectedRevisionNumber: number;
  type?: string;
  title?: string;
  excerpt?: string;
  body?: Record<string, unknown>;
  changeSummary?: string;
}

export interface CreatePublicationPayload {
  siteId: string;
  slug: string;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  featuredImageId?: string;
  scheduledFor?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

/** PATCH body for a publication; `null` clears an optional field. */
export type UpdatePublicationPayload = Partial<
  Omit<CreatePublicationPayload, 'siteId' | 'featuredImageId' | 'seoTitle' | 'seoDescription'>
> & {
  featuredImageId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export interface ListPostsParams {
  siteId?: string;
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Scope of the posts workspace status counts. */
export interface PostStatsParams {
  siteId?: string;
  type?: string;
}

export interface ListMediaParams {
  siteId?: string;
  mimeType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListUsersParams {
  search?: string;
  status?: string;
  roleKey?: string;
  siteId?: string;
  page?: number;
  limit?: number;
}

export interface ListPublicationsParams {
  siteId: string;
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DashboardOverviewParams {
  siteId?: string;
  days?: number;
}

export const cmsApi = platformApi.injectEndpoints({
  endpoints: (build) => ({
    // ==========================================
    // Authentication & Current User
    // ==========================================
    getCsrf: build.query<CsrfResponse, void>({
      query: () => ({ path: '/auth/csrf' }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as CsrfResponse,
    }),

    getMe: build.query<AuthUser, void>({
      query: () => ({ path: '/auth/me' }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as AuthUser,
      providesTags: ['Auth'],
    }),

    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({
        path: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as LoginResponse,
      invalidatesTags: [
        'Auth',
        'Post',
        'Media',
        'Site',
        'User',
        'Publication',
        'Taxonomy',
        'Health',
      ],
    }),

    // Self-service: requires the current password; other sessions are signed out.
    changeOwnPassword: build.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ path: '/auth/password', method: 'POST', body }),
    }),

    logout: build.mutation<void, void>({
      query: () => ({
        path: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: [
        'Auth',
        'Post',
        'Media',
        'Site',
        'User',
        'Publication',
        'Taxonomy',
        'Health',
      ],
    }),

    // ==========================================
    // Sites & Domains
    // ==========================================
    listSites: build.query<SiteItem[], void>({
      query: () => ({ path: '/sites' }),
      transformResponse: (response: ApiSuccess<unknown>) => {
        const payload = response.data;
        if (Array.isArray(payload)) {
          return payload as SiteItem[];
        }
        if (
          payload &&
          typeof payload === 'object' &&
          'items' in payload &&
          Array.isArray((payload as { items: unknown }).items)
        ) {
          return (payload as { items: SiteItem[] }).items;
        }
        return [] as SiteItem[];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({ type: 'Site' as const, id: item.id })),
              { type: 'Site' as const, id: 'LIST' },
            ]
          : [{ type: 'Site' as const, id: 'LIST' }],
    }),

    getSite: build.query<SiteItem, string>({
      query: (siteId) => ({ path: `/sites/${siteId}` }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as SiteItem,
      providesTags: (_res, _err, id) => [{ type: 'Site' as const, id }],
    }),

    createSite: build.mutation<SiteItem, CreateSitePayload>({
      query: (body) => ({
        path: '/sites',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as SiteItem,
      invalidatesTags: [{ type: 'Site' as const, id: 'LIST' }],
    }),

    updateSite: build.mutation<SiteItem, { siteId: string; data: UpdateSitePayload }>({
      query: ({ siteId, data }) => ({
        path: `/sites/${siteId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as SiteItem,
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Site' as const, id: siteId },
        { type: 'Site' as const, id: 'LIST' },
      ],
    }),

    deleteSite: build.mutation<void, string>({
      query: (siteId) => ({
        path: `/sites/${siteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Site' as const, id: 'LIST' }],
    }),

    listDomains: build.query<SiteDomainItem[], string>({
      query: (siteId) => ({ path: `/sites/${siteId}/domains` }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as SiteDomainItem[],
      providesTags: (_res, _err, siteId) => [{ type: 'Site' as const, id: `DOMAINS_${siteId}` }],
    }),

    addDomain: build.mutation<SiteDomainItem, { siteId: string; data: CreateDomainPayload }>({
      query: ({ siteId, data }) => ({
        path: `/sites/${siteId}/domains`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as SiteDomainItem,
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Site' as const, id: `DOMAINS_${siteId}` },
        { type: 'Site' as const, id: siteId },
        { type: 'Site' as const, id: 'LIST' },
      ],
    }),

    setPrimaryDomain: build.mutation<SiteDomainItem, { siteId: string; domainId: string }>({
      query: ({ siteId, domainId }) => ({
        path: `/sites/${siteId}/domains/${domainId}/primary`,
        method: 'PATCH',
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as SiteDomainItem,
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Site' as const, id: `DOMAINS_${siteId}` },
        { type: 'Site' as const, id: siteId },
        { type: 'Site' as const, id: 'LIST' },
      ],
    }),

    deleteDomain: build.mutation<void, { siteId: string; domainId: string }>({
      query: ({ siteId, domainId }) => ({
        path: `/sites/${siteId}/domains/${domainId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Site' as const, id: `DOMAINS_${siteId}` },
        { type: 'Site' as const, id: siteId },
        { type: 'Site' as const, id: 'LIST' },
      ],
    }),

    verifyDomain: build.mutation<SiteDomainItem, { siteId: string; domainId: string }>({
      query: ({ siteId, domainId }) => ({
        path: `/sites/${siteId}/domains/${domainId}/verify`,
        method: 'POST',
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as SiteDomainItem,
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Site' as const, id: `DOMAINS_${siteId}` },
        { type: 'Site' as const, id: siteId },
      ],
    }),

    getVerificationChallenge: build.query<
      VerificationChallenge,
      { siteId: string; domainId: string }
    >({
      query: ({ siteId, domainId }) => ({
        path: `/sites/${siteId}/domains/${domainId}/challenge`,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as VerificationChallenge,
    }),

    // ==========================================
    // Users & Roles
    // ==========================================
    listUsers: build.query<PaginatedResult<UserItem>, ListUsersParams | void>({
      query: (params) => ({
        path: '/users',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as PaginatedResult<UserItem>,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({ type: 'User' as const, id: item.id })),
              { type: 'User' as const, id: 'LIST' },
            ]
          : [{ type: 'User' as const, id: 'LIST' }],
    }),

    getUserStats: build.query<UserStats, void>({
      query: () => ({ path: '/users/stats' }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as UserStats,
      providesTags: ['User'],
    }),

    getUser: build.query<UserItem, string>({
      query: (userId) => ({ path: `/users/${userId}` }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as UserItem,
      providesTags: (_res, _err, id) => [{ type: 'User' as const, id }],
    }),

    createUser: build.mutation<UserItem, CreateUserPayload>({
      query: (body) => ({
        path: '/users',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as UserItem,
      invalidatesTags: [{ type: 'User' as const, id: 'LIST' }],
    }),

    updateUser: build.mutation<UserItem, { userId: string; data: UpdateUserPayload }>({
      query: ({ userId, data }) => ({
        path: `/users/${userId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as UserItem,
      invalidatesTags: (_res, _err, { userId }) => [
        { type: 'User' as const, id: userId },
        { type: 'User' as const, id: 'LIST' },
      ],
    }),

    assignRole: build.mutation<UserItem, { userId: string; data: AssignRolePayload }>({
      query: ({ userId, data }) => ({
        path: `/users/${userId}/roles`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as UserItem,
      invalidatesTags: (_res, _err, { userId }) => [
        { type: 'User' as const, id: userId },
        { type: 'User' as const, id: 'LIST' },
      ],
    }),

    revokeRole: build.mutation<UserItem, { userId: string; assignmentId: string }>({
      query: ({ userId, assignmentId }) => ({
        path: `/users/${userId}/roles/${assignmentId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as UserItem,
      invalidatesTags: (_res, _err, { userId }) => [
        { type: 'User' as const, id: userId },
        { type: 'User' as const, id: 'LIST' },
      ],
    }),

    // ==========================================
    // Dashboard Overview (Phase 14)
    // ==========================================
    getDashboardOverview: build.query<DashboardOverviewData, DashboardOverviewParams | void>({
      query: (params) => ({
        path: '/dashboard/overview',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as DashboardOverviewData,
      providesTags: ['Post', 'Publication', 'Site'],
    }),

    // ==========================================
    // Analytics (Full Multi-Site Analytics System)
    // ==========================================
    getAnalyticsOverview: build.query<AnalyticsOverviewData, AnalyticsQueryParams | void>({
      query: (params) => ({
        path: '/analytics/overview',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as AnalyticsOverviewData,
      providesTags: ['Post', 'Publication', 'Site'],
    }),

    getAnalyticsRealtime: build.query<AnalyticsRealtimeData, { siteId?: string } | void>({
      query: (params) => ({
        path: '/analytics/realtime',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as AnalyticsRealtimeData,
    }),

    recordPageView: build.mutation<{ success: boolean; id: string }, RecordPageViewPayload>({
      query: (body) => ({
        path: '/public/analytics/collect',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccess<{ success: boolean; id: string }>) => response.data,
    }),

    // ==========================================
    // Audit Logs
    // ==========================================
    listAuditLogs: build.query<PaginatedAuditLogs, AuditLogQueryParams | void>({
      query: (params) => ({
        path: '/audit-logs',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PaginatedAuditLogs,
      providesTags: ['Site', 'User'],
    }),

    getAuditSummary: build.query<AuditLogSummary, { siteId?: string } | void>({
      query: (params) => ({
        path: '/audit-logs/summary',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as AuditLogSummary,
      providesTags: ['Site', 'User'],
    }),

    // ==========================================
    // Platform Settings
    // ==========================================
    getPlatformSettings: build.query<PlatformSettings, void>({
      query: () => ({ path: '/settings/platform' }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PlatformSettings,
      providesTags: ['Site', 'User'],
    }),

    updatePlatformSettings: build.mutation<PlatformSettings, UpdatePlatformSettingsPayload>({
      query: (body) => ({
        path: '/settings/platform',
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PlatformSettings,
      invalidatesTags: ['Site', 'User'],
    }),

    getPlatformDiagnostics: build.query<PlatformSystemDiagnostics, void>({
      query: () => ({ path: '/settings/diagnostics' }),
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as PlatformSystemDiagnostics,
      providesTags: ['Health'],
    }),

    // Enforced limits (upload size/types, autosave interval, password rules).
    getEffectivePolicy: build.query<EffectivePlatformPolicy, void>({
      query: () => ({ path: '/settings/policy' }),
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as EffectivePlatformPolicy,
      providesTags: ['Site', 'User'],
    }),

    getPublicPlatformSettings: build.query<PublicPlatformSettings, void>({
      query: () => ({ path: '/settings/public' }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PublicPlatformSettings,
    }),

    // ==========================================
    // Posts & Revisions
    // ==========================================
    listPosts: build.query<PaginatedResult<PostItem>, ListPostsParams | void>({
      query: (params) => ({
        path: '/posts',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as PaginatedResult<PostItem>,
      providesTags: (result: PaginatedResult<PostItem> | undefined) =>
        result
          ? [
              ...result.items.map((item: PostItem) => ({ type: 'Post' as const, id: item.id })),
              { type: 'Post' as const, id: 'LIST' },
            ]
          : [{ type: 'Post' as const, id: 'LIST' }],
    }),

    getPostStats: build.query<PostStatusCounts, PostStatsParams | void>({
      query: (params) => ({
        path: '/posts/stats',
        query: params as Record<string, string | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostStatusCounts,
      // Any post or publication change can move a post between statuses.
      providesTags: ['Post', 'Publication'],
    }),

    getPost: build.query<PostItem, string>({
      query: (postId) => ({ path: `/posts/${postId}` }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostItem,
      // Publication tags too, so publish/unpublish/update-live refresh the editor.
      providesTags: (result, _error, id) => [
        { type: 'Post' as const, id },
        ...(result?.publications ?? []).map((pub) => ({
          type: 'Publication' as const,
          id: pub.id,
        })),
      ],
    }),

    createPost: build.mutation<PostItem, CreatePostPayload>({
      query: (body) => ({
        path: '/posts',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostItem,
      invalidatesTags: [{ type: 'Post' as const, id: 'LIST' }],
    }),

    updatePost: build.mutation<PostItem, { postId: string; data: UpdatePostPayload }>({
      query: ({ postId, data }) => ({
        path: `/posts/${postId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostItem,
      invalidatesTags: (_result, _error, { postId }) => [
        { type: 'Post' as const, id: postId },
        { type: 'Post' as const, id: 'LIST' },
      ],
    }),

    deletePost: build.mutation<void, string>({
      query: (postId) => ({
        path: `/posts/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Post' as const, id: 'LIST' }],
    }),

    // ==========================================
    // Publications & Publishing Engine
    // ==========================================
    listSitePublications: build.query<PaginatedResult<PostPublicationItem>, ListPublicationsParams>(
      {
        query: ({ siteId, ...params }) => ({
          path: `/sites/${siteId}/publications`,
          query: params as Record<string, string | number | boolean | null | undefined>,
        }),
        transformResponse: (response: ApiSuccess<unknown>) =>
          response.data as PaginatedResult<PostPublicationItem>,
        providesTags: (result) =>
          result
            ? [
                ...result.items.map((item) => ({ type: 'Publication' as const, id: item.id })),
                { type: 'Publication' as const, id: 'LIST' },
              ]
            : [{ type: 'Publication' as const, id: 'LIST' }],
      },
    ),

    getPublication: build.query<PostPublicationItem, { siteId: string; publicationId: string }>({
      query: ({ siteId, publicationId }) => ({
        path: `/sites/${siteId}/publications/${publicationId}`,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      providesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
      ],
    }),

    createPublication: build.mutation<
      PostPublicationItem,
      { postId: string; data: CreatePublicationPayload }
    >({
      query: ({ postId, data }) => ({
        path: `/posts/${postId}/publications`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_result, _error, { postId }) => [
        { type: 'Post' as const, id: postId },
        { type: 'Publication' as const, id: 'LIST' },
      ],
    }),

    updatePublication: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string; data: UpdatePublicationPayload }
    >({
      query: ({ siteId, publicationId, data }) => ({
        path: `/sites/${siteId}/publications/${publicationId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
        { type: 'Post' as const, id: 'LIST' },
      ],
    }),

    deletePublication: build.mutation<void, { siteId: string; publicationId: string }>({
      query: ({ siteId, publicationId }) => ({
        path: `/sites/${siteId}/publications/${publicationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Publication' as const, id: 'LIST' }],
    }),

    publishImmediately: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string }
    >({
      query: ({ siteId, publicationId }) => ({
        path: `/sites/${siteId}/publications/${publicationId}/publish`,
        method: 'POST',
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
        { type: 'Post' as const, id: 'LIST' },
      ],
    }),

    updateLiveContent: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string }
    >({
      query: ({ siteId, publicationId }) => ({
        path: `/sites/${siteId}/publications/${publicationId}/update-live`,
        method: 'POST',
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
        { type: 'Post' as const, id: 'LIST' },
      ],
    }),

    schedulePublication: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string; data: SchedulePublicationRequest }
    >({
      query: ({ siteId, publicationId, data }) => ({
        path: `/sites/${siteId}/publications/${publicationId}/schedule`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
        { type: 'Post' as const, id: 'LIST' },
      ],
    }),

    reschedulePublication: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string; data: ReschedulePublicationRequest }
    >({
      query: ({ siteId, publicationId, data }) => ({
        path: `/sites/${siteId}/publications/${publicationId}/reschedule`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
      ],
    }),

    cancelSchedule: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string; data?: { reason?: string } }
    >({
      query: ({ siteId, publicationId, data }) => ({
        path: `/sites/${siteId}/publications/${publicationId}/cancel-schedule`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
      ],
    }),

    unpublishPublication: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string; data?: { reason?: string } }
    >({
      query: ({ siteId, publicationId, data }) => ({
        path: `/sites/${siteId}/publications/${publicationId}/unpublish`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
        { type: 'Post' as const, id: 'LIST' },
      ],
    }),

    archivePublication: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string; data?: { reason?: string } }
    >({
      query: ({ siteId, publicationId, data }) => ({
        path: `/sites/${siteId}/publications/${publicationId}/archive`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
      ],
    }),

    restorePublication: build.mutation<
      PostPublicationItem,
      { siteId: string; publicationId: string }
    >({
      query: ({ siteId, publicationId }) => ({
        path: `/sites/${siteId}/publications/${publicationId}/restore`,
        method: 'POST',
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
      invalidatesTags: (_res, _err, { publicationId }) => [
        { type: 'Publication' as const, id: publicationId },
        { type: 'Publication' as const, id: 'LIST' },
      ],
    }),

    submitForReview: build.mutation<PostPublicationItem, { siteId: string; publicationId: string }>(
      {
        query: ({ siteId, publicationId }) => ({
          path: `/sites/${siteId}/publications/${publicationId}/review`,
          method: 'POST',
        }),
        transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPublicationItem,
        invalidatesTags: (_res, _err, { publicationId }) => [
          { type: 'Publication' as const, id: publicationId },
          { type: 'Publication' as const, id: 'LIST' },
        ],
      },
    ),

    getPublishingHealth: build.query<PublishingHealthStats, void>({
      query: () => ({ path: '/publishing/health' }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PublishingHealthStats,
      providesTags: [{ type: 'Health', id: 'PUBLISHING' }],
    }),

    // ==========================================
    // Preview Tokens
    // ==========================================
    generatePreviewToken: build.mutation<PreviewTokenResponse, { postId: string; siteId?: string }>(
      {
        query: ({ postId, siteId }) => ({
          path: `/posts/${postId}/preview-token`,
          method: 'POST',
          query: siteId ? { siteId } : undefined,
        }),
        transformResponse: (response: ApiSuccess<unknown>) => response.data as PreviewTokenResponse,
      },
    ),

    getPostPreview: build.query<
      PostPreviewData,
      { postId: string; token: string; siteId?: string }
    >({
      query: ({ postId, token, siteId }) => ({
        path: `/posts/${postId}/preview`,
        query: { token, siteId: siteId ?? '' },
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as PostPreviewData,
    }),

    // ==========================================
    // Media Library
    // ==========================================
    listMedia: build.query<PaginatedResult<MediaAssetItem>, ListMediaParams | void>({
      query: (params) => ({
        path: '/media',
        query: params as Record<string, string | number | boolean | null | undefined> | undefined,
      }),
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as PaginatedResult<MediaAssetItem>,
      providesTags: (result: PaginatedResult<MediaAssetItem> | undefined) =>
        result
          ? [
              ...result.items.map((item: MediaAssetItem) => ({
                type: 'Media' as const,
                id: item.id,
              })),
              { type: 'Media' as const, id: 'LIST' },
            ]
          : [{ type: 'Media' as const, id: 'LIST' }],
    }),

    getMediaAsset: build.query<MediaAssetItem, string>({
      query: (mediaId) => ({ path: `/media/${mediaId}` }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as MediaAssetItem,
      providesTags: (_result, _error, mediaId) => [{ type: 'Media' as const, id: mediaId }],
    }),

    uploadMedia: build.mutation<MediaUploadResponse, FormData>({
      query: (formData) => ({
        path: '/media/upload',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as MediaUploadResponse,
      invalidatesTags: [{ type: 'Media' as const, id: 'LIST' }],
    }),

    updateMedia: build.mutation<
      MediaAssetItem,
      { mediaId: string; altText?: string; caption?: string }
    >({
      query: ({ mediaId, ...body }) => ({
        path: `/media/${mediaId}`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as MediaAssetItem,
      invalidatesTags: (_result, _error, { mediaId }) => [
        { type: 'Media' as const, id: mediaId },
        { type: 'Media' as const, id: 'LIST' },
      ],
    }),

    deleteMedia: build.mutation<void, string>({
      query: (mediaId) => ({
        path: `/media/${mediaId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Media' as const, id: 'LIST' }],
    }),

    // ==========================================
    // Taxonomy
    // ==========================================
    listCategories: build.query<CategoryItem[], string>({
      query: (siteId) => ({ path: `/sites/${siteId}/categories` }),
      transformResponse: (response: ApiSuccess<unknown>) => {
        const payload = response.data;
        if (Array.isArray(payload)) {
          return payload as CategoryItem[];
        }
        if (
          payload &&
          typeof payload === 'object' &&
          'items' in payload &&
          Array.isArray((payload as { items: unknown }).items)
        ) {
          return (payload as { items: CategoryItem[] }).items;
        }
        return [] as CategoryItem[];
      },
      providesTags: (_res, _err, siteId) => [
        { type: 'Taxonomy' as const, id: `CATEGORIES_${siteId}` },
      ],
    }),

    createCategory: build.mutation<CategoryItem, { siteId: string; data: CreateCategoryPayload }>({
      query: ({ siteId, data }) => ({
        path: `/sites/${siteId}/categories`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as CategoryItem,
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Taxonomy' as const, id: `CATEGORIES_${siteId}` },
      ],
    }),

    updateCategory: build.mutation<
      CategoryItem,
      { siteId: string; categoryId: string; data: UpdateCategoryPayload }
    >({
      query: ({ siteId, categoryId, data }) => ({
        path: `/sites/${siteId}/categories/${categoryId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as CategoryItem,
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Taxonomy' as const, id: `CATEGORIES_${siteId}` },
      ],
    }),

    deleteCategory: build.mutation<void, { siteId: string; categoryId: string }>({
      query: ({ siteId, categoryId }) => ({
        path: `/sites/${siteId}/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Taxonomy' as const, id: `CATEGORIES_${siteId}` },
      ],
    }),

    listTags: build.query<TagItem[], string>({
      query: (siteId) => ({ path: `/sites/${siteId}/tags` }),
      transformResponse: (response: ApiSuccess<unknown>) => {
        const payload = response.data;
        if (Array.isArray(payload)) {
          return payload as TagItem[];
        }
        if (
          payload &&
          typeof payload === 'object' &&
          'items' in payload &&
          Array.isArray((payload as { items: unknown }).items)
        ) {
          return (payload as { items: TagItem[] }).items;
        }
        return [] as TagItem[];
      },
      providesTags: (_res, _err, siteId) => [{ type: 'Taxonomy' as const, id: `TAGS_${siteId}` }],
    }),

    createTag: build.mutation<TagItem, { siteId: string; data: CreateTagPayload }>({
      query: ({ siteId, data }) => ({
        path: `/sites/${siteId}/tags`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as TagItem,
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Taxonomy' as const, id: `TAGS_${siteId}` },
      ],
    }),

    updateTag: build.mutation<TagItem, { siteId: string; tagId: string; data: UpdateTagPayload }>({
      query: ({ siteId, tagId, data }) => ({
        path: `/sites/${siteId}/tags/${tagId}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as TagItem,
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Taxonomy' as const, id: `TAGS_${siteId}` },
      ],
    }),

    deleteTag: build.mutation<void, { siteId: string; tagId: string }>({
      query: ({ siteId, tagId }) => ({
        path: `/sites/${siteId}/tags/${tagId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { siteId }) => [
        { type: 'Taxonomy' as const, id: `TAGS_${siteId}` },
      ],
    }),

    // ==========================================
    // Comments Moderation
    // ==========================================
    listComments: build.query<AdminCommentsListResult, ListAdminCommentsQuery | void>({
      query: (params) => {
        const query: Record<string, string | number> = {};
        if (params?.siteId) query.siteId = params.siteId;
        if (params?.status && params.status !== 'all') query.status = params.status;
        if (params?.search) query.search = params.search;
        if (params?.publicationId) query.publicationId = params.publicationId;
        if (params?.page) query.page = params.page;
        if (params?.limit) query.limit = params.limit;

        return {
          path: '/comments',
          query,
        };
      },
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as AdminCommentsListResult,
      providesTags: ['Comment'],
    }),

    updateCommentStatus: build.mutation<AdminCommentItem, { id: string; status: CommentStatus }>({
      query: ({ id, status }) => ({
        path: `/comments/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: ApiSuccess<unknown>) => response.data as AdminCommentItem,
      invalidatesTags: ['Comment'],
    }),

    batchUpdateComments: build.mutation<
      { updatedCount: number },
      { ids: string[]; status: CommentStatus }
    >({
      query: (body) => ({
        path: '/comments/batch',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccess<unknown>) =>
        response.data as { updatedCount: number },
      invalidatesTags: ['Comment'],
    }),

    deleteComment: build.mutation<void, string>({
      query: (id) => ({
        path: `/comments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Comment'],
    }),
  }),
});

export const {
  // Auth
  useGetCsrfQuery,
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useChangeOwnPasswordMutation,

  // Sites & Domains
  useListSitesQuery,
  useGetSiteQuery,
  useCreateSiteMutation,
  useUpdateSiteMutation,
  useDeleteSiteMutation,
  useListDomainsQuery,
  useAddDomainMutation,
  useSetPrimaryDomainMutation,
  useDeleteDomainMutation,
  useVerifyDomainMutation,
  useGetVerificationChallengeQuery,

  // Users
  useListUsersQuery,
  useGetUserStatsQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useAssignRoleMutation,
  useRevokeRoleMutation,

  // Dashboard (Phase 14)
  useGetDashboardOverviewQuery,

  // Analytics
  useGetAnalyticsOverviewQuery,
  useGetAnalyticsRealtimeQuery,
  useRecordPageViewMutation,

  // Audit Logs
  useListAuditLogsQuery,
  useGetAuditSummaryQuery,

  // Platform Settings
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useGetPlatformDiagnosticsQuery,
  useGetPublicPlatformSettingsQuery,
  useGetEffectivePolicyQuery,

  // Posts
  useListPostsQuery,
  useGetPostStatsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,

  // Publications & Publishing
  useListSitePublicationsQuery,
  useGetPublicationQuery,
  useCreatePublicationMutation,
  useUpdatePublicationMutation,
  useDeletePublicationMutation,
  usePublishImmediatelyMutation,
  useUpdateLiveContentMutation,
  useSchedulePublicationMutation,
  useReschedulePublicationMutation,
  useCancelScheduleMutation,
  useUnpublishPublicationMutation,
  useArchivePublicationMutation,
  useRestorePublicationMutation,
  useSubmitForReviewMutation,
  useGetPublishingHealthQuery,

  // Preview
  useGeneratePreviewTokenMutation,
  useGetPostPreviewQuery,

  // Media
  useListMediaQuery,
  useGetMediaAssetQuery,
  useUploadMediaMutation,
  useUpdateMediaMutation,
  useDeleteMediaMutation,

  // Taxonomy
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useListTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,

  // Comments Moderation
  useListCommentsQuery,
  useUpdateCommentStatusMutation,
  useBatchUpdateCommentsMutation,
  useDeleteCommentMutation,
} = cmsApi;
